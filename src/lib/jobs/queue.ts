import { db } from "@/lib/db";
import { logError, logInfo } from "@/lib/observability/logger";
import { MAX_EXECUTION_MS, backoffMs, type Job, type JobHandler, type JobType } from "./types";

const handlers = new Map<JobType, JobHandler<Record<string, unknown>>>();
const cancelled = new Set<string>();

export function registerHandler(type: JobType, handler: JobHandler<Record<string, unknown>>) {
  handlers.set(type, handler);
}

export function cancelJob(idempotencyKey: string) {
  cancelled.add(idempotencyKey);
}

async function runWithTimeout<T>(type: JobType, fn: () => Promise<T>): Promise<T> {
  const max = MAX_EXECUTION_MS[type] ?? 60_000;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      fn(),
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`Job timed out after ${max}ms`)), max);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function enqueue<T extends Record<string, unknown>>(
  type: JobType,
  payload: T,
  opts: { idempotencyKey?: string; maxRetries?: number; executeInline?: boolean } = {}
) {
  const key = opts.idempotencyKey ?? `${type}:${JSON.stringify(payload).slice(0, 120)}:${Date.now()}`;
  const existing = await db.jobRecord.findUnique({ where: { idempotencyKey: key } }).catch(() => null);
  if (existing && ["queued", "running", "retrying", "completed"].includes(existing.status)) {
    return { deduped: true, key, status: existing.status };
  }
  const record = await db.jobRecord.upsert({
    where: { idempotencyKey: key },
    create: { type, idempotencyKey: key, payload: JSON.stringify(payload).slice(0, 8000), status: "queued", maxRetries: opts.maxRetries ?? 3 },
    update: { type, payload: JSON.stringify(payload).slice(0, 8000), status: "queued", lastError: null },
  });
  const job: Job<T> = { id: record.id, type, payload, idempotencyKey: key, retries: record.retries, maxRetries: record.maxRetries, createdAt: record.createdAt };

  if (opts.executeInline === false) return { deduped: false, key, status: "queued" };
  return processJob(job);
}

async function processJob<T extends Record<string, unknown>>(job: Job<T>): Promise<{ deduped: boolean; key: string; status: string }> {
  const handler = handlers.get(job.type);
  if (!handler) {
    await db.jobRecord.update({ where: { idempotencyKey: job.idempotencyKey }, data: { status: "dead_letter", lastError: "No handler" } });
    return { deduped: false, key: job.idempotencyKey, status: "dead_letter" };
  }
  await db.jobRecord.update({ where: { idempotencyKey: job.idempotencyKey }, data: { status: "running" } });
  const started = Date.now();
  try {
    if (cancelled.has(job.idempotencyKey)) throw new Error("Job cancelled");
    await runWithTimeout(job.type, () => handler(job as Job<Record<string, unknown>>));
    await db.jobRecord.update({ where: { idempotencyKey: job.idempotencyKey }, data: { status: "completed" } });
    logInfo("job.completed", { type: job.type, key: job.idempotencyKey, durationMs: Date.now() - started });
    return { deduped: false, key: job.idempotencyKey, status: "completed" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Job failed";
    const rec = await db.jobRecord.findUnique({ where: { idempotencyKey: job.idempotencyKey } });
    const retries = (rec?.retries ?? job.retries) + 1;
    const max = rec?.maxRetries ?? job.maxRetries;
    if (retries > max || /cancelled/i.test(message)) {
      await db.jobRecord.update({ where: { idempotencyKey: job.idempotencyKey }, data: { status: message.match(/cancel/i) ? "cancelled" : "dead_letter", retries, lastError: message.slice(0, 1000) } });
      logError("job.dead_letter", { type: job.type, key: job.idempotencyKey, error: message });
      return { deduped: false, key: job.idempotencyKey, status: "dead_letter" };
    }
    await db.jobRecord.update({
      where: { idempotencyKey: job.idempotencyKey },
      data: { status: "retrying", retries, lastError: message.slice(0, 1000), nextAttemptAt: new Date(Date.now() + backoffMs(retries)) },
    });
    logError("job.retrying", { type: job.type, key: job.idempotencyKey, retries, error: message });
    throw err;
  }
}

export async function retryJob(idempotencyKey: string) {
  const rec = await db.jobRecord.findUnique({ where: { idempotencyKey } });
  if (!rec) throw new Error("Job not found");
  if (!["dead_letter", "failed", "retrying"].includes(rec.status)) throw new Error(`Cannot retry job in ${rec.status}`);
  const handler = handlers.get(rec.type as JobType);
  if (!handler) throw new Error("No handler");
  await db.jobRecord.update({ where: { idempotencyKey }, data: { status: "queued", lastError: null, nextAttemptAt: null } });
  return processJob({ id: rec.id, type: rec.type as JobType, payload: JSON.parse(rec.payload || "{}"), idempotencyKey, retries: rec.retries, maxRetries: rec.maxRetries, createdAt: rec.createdAt });
}

export function __resetJobsForTests() {
  handlers.clear();
  cancelled.clear();
}
