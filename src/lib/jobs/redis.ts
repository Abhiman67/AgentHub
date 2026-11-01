export type JobMode = "inline" | "redis";

/**
 * Milestone 5 — queue execution mode.
 * inline: handlers run in-process (tests, simple local dev).
 * redis: jobs are persisted then handed to BullMQ; a separate worker
 *        process executes them. Never silently downgraded.
 */
export function getJobMode(): JobMode {
  const raw = (process.env.JOB_EXECUTION_MODE ?? "inline").toLowerCase();
  if (raw === "redis") {
    if (!process.env.REDIS_URL) {
      throw new Error("JOB_EXECUTION_MODE=redis requires REDIS_URL.");
    }
    return "redis";
  }
  return "inline";
}

export function getRedisUrl(): string {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error("REDIS_URL is not configured.");
  return url;
}

export const QUEUE_NAME = "backoff";
