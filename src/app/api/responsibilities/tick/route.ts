import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-errors";
import "@/lib/jobs/processors";
import { enqueue } from "@/lib/jobs/queue";

/**
 * Scheduler entrypoint. Gated by CRON_SECRET (never session auth — external
 * schedulers and the Redis worker have no user session).
 */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return apiError("SCHEDULER_NOT_CONFIGURED", "Set CRON_SECRET to enable scheduled ticks.", 501);
  const provided = req.headers.get("x-cron-secret") ?? new URL(req.url).searchParams.get("secret");
  if (provided !== secret) return apiError("UNAUTHORIZED", "Invalid scheduler secret.", 401);
  const key = `responsibility.tick:${new Date().toISOString().slice(0, 16)}`;
  const result = await enqueue("responsibility.tick", {}, { idempotencyKey: key, maxRetries: 1 });
  return NextResponse.json({ ok: true, job: result }, { headers: { "Cache-Control": "no-store" } });
}
