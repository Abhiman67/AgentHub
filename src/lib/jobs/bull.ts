import { Queue, type JobsOptions } from "bullmq";
import { QUEUE_NAME, getRedisUrl } from "./redis";
import { backoffMs, type JobType } from "./types";

let queue: Queue | null = null;

/** Lazy singleton: no Redis connection until first redis-mode enqueue. */
export function getBullQueue(): Queue {
  if (!queue) {
    queue = new Queue(QUEUE_NAME, {
      connection: { url: getRedisUrl(), lazyConnect: true, maxRetriesPerRequest: 3 },
    });
  }
  return queue;
}

export async function closeBullQueue(): Promise<void> {
  if (queue) {
    await queue.close();
    queue = null;
  }
}

export function bullOptions(maxRetries: number): JobsOptions {
  return {
    attempts: maxRetries + 1,
    backoff: { type: "exponential", delay: backoffMs(1) },
    removeOnComplete: 100,
    removeOnFail: 200,
  };
}

export function bullJobId(type: JobType, idempotencyKey: string): string {
  return `${type}:${idempotencyKey}`;
}
