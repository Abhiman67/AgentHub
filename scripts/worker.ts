/**
 * Milestone 5 — Redis worker entrypoint.
 * Run: `bun run worker` (requires REDIS_URL + JOB_EXECUTION_MODE=redis).
 * Loads all job processors, then drains the BullMQ queue, mirroring the
 * inline JobRecord lifecycle (running → completed / retrying / dead_letter).
 */
import { Worker, Queue, type Job as BullJob } from "bullmq";
import { db } from "@/lib/db";
import { QUEUE_NAME, getRedisUrl } from "@/lib/jobs/redis";
import { backoffMs, type JobType } from "@/lib/jobs/types";
import { logError, logInfo } from "@/lib/observability/logger";
import "@/lib/jobs/processors";
import { runHandler } from "@/lib/jobs/queue";

function parseKey(jobId: string | undefined): { type: JobType; key: string } | null {
  if (!jobId) return null;
  const sep = jobId.indexOf(":");
  if (sep < 0) return null;
  return { type: jobId.slice(0, sep) as JobType, key: jobId.slice(sep + 1) };
}

async function processBullJob(bullJob: BullJob): Promise<void> {
  let parsed = parseKey(bullJob.id);
  if (!parsed && bullJob.name) {
    // Scheduler-originated jobs (repeatable): ensure a JobRecord exists.
    const key = `scheduler:${bullJob.id}`;
    await db.jobRecord.upsert({
      where: { idempotencyKey: key },
      create: { type: bullJob.name, idempotencyKey: key, payload: JSON.stringify(bullJob.data ?? {}).slice(0, 8000), status: "queued" },
      update: {},
    });
    parsed = { type: bullJob.name as JobType, key };
  }
  if (!parsed) throw new Error(`Unparseable job id ${bullJob.id}`);
  const rec = await db.jobRecord.findUnique({ where: { idempotencyKey: parsed.key } });
  if (!rec) throw new Error(`No JobRecord for ${parsed.key}`);
  if (rec.status === "completed") return; // already done (e.g. inline race)
  if (rec.status === "cancelled") throw new Error("Job cancelled");
  await db.jobRecord.update({ where: { idempotencyKey: parsed.key }, data: { status: "running" } });
  const started = Date.now();
  try {
    await runHandler({
      id: rec.id,
      type: rec.type as JobType,
      payload: JSON.parse(rec.payload || "{}"),
      idempotencyKey: parsed.key,
      retries: rec.retries,
      maxRetries: rec.maxRetries,
      createdAt: rec.createdAt,
    });
    await db.jobRecord.update({ where: { idempotencyKey: parsed.key }, data: { status: "completed" } });
    logInfo("job.completed", { type: rec.type, key: parsed.key, durationMs: Date.now() - started, worker: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Job failed";
    const retries = rec.retries + 1;
    if (retries > rec.maxRetries || /cancelled/i.test(message)) {
      await db.jobRecord.update({
        where: { idempotencyKey: parsed.key },
        data: { status: message.match(/cancel/i) ? "cancelled" : "dead_letter", retries, lastError: message.slice(0, 1000) },
      });
      logError("job.dead_letter", { type: rec.type, key: parsed.key, worker: true });
      return; // terminal: do not rethrow (BullMQ attempts exhausted via JobRecord)
    }
    await db.jobRecord.update({
      where: { idempotencyKey: parsed.key },
      data: { status: "retrying", retries, lastError: message.slice(0, 1000), nextAttemptAt: new Date(Date.now() + backoffMs(retries)) },
    });
    logError("job.retrying", { type: rec.type, key: parsed.key, retries, worker: true });
    throw err; // rethrow so BullMQ backs off and retries per bullOptions
  }
}

const worker = new Worker(QUEUE_NAME, processBullJob, {
  connection: { url: getRedisUrl() },
  concurrency: Number(process.env.WORKER_CONCURRENCY ?? 5),
});

worker.on("failed", (job, err) => logError("worker.failed", { jobId: job?.id, error: err.message }));
worker.on("error", (err) => logError("worker.error", { error: err.message }));
process.on("SIGTERM", () => void worker.close());
process.on("SIGINT", () => void worker.close());

logInfo("worker.started", { queue: QUEUE_NAME, concurrency: Number(process.env.WORKER_CONCURRENCY ?? 5) });

// Repeatable scheduler tick (spec §7): fires responsibility.tick every
// 15 minutes. Idempotency keys are per-minute so overlapping workers dedupe.
async function scheduleTick() {
  const queue = new Queue(QUEUE_NAME, { connection: { url: getRedisUrl() } });
  await queue.upsertJobScheduler(
    "responsibility.tick",
    { every: 15 * 60 * 1000 },
    { name: "responsibility.tick", data: {}, opts: { removeOnComplete: 10, removeOnFail: 50 } }
  );
  await queue.close();
}

scheduleTick().catch((err) => logError("worker.schedule.failed", { error: err instanceof Error ? err.message : "unknown" }));
