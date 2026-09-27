export type JobType = "file.extract" | "file.chunk" | "file.embed" | "agent.run" | "agent.resume" | "agent.retry" | "usage.aggregate";

export type Job<T = Record<string, unknown>> = {
  id: string;
  type: JobType;
  payload: T;
  idempotencyKey: string;
  retries: number;
  maxRetries: number;
  createdAt: Date;
};

export type JobHandler<T = Record<string, unknown>> = (job: Job<T>) => Promise<void>;

export const MAX_EXECUTION_MS: Record<JobType, number> = {
  "file.extract": 60_000,
  "file.chunk": 30_000,
  "file.embed": 60_000,
  "agent.run": 120_000,
  "agent.resume": 120_000,
  "agent.retry": 120_000,
  "usage.aggregate": 30_000,
};

export function backoffMs(attempt: number): number {
  return Math.min(30_000, 1000 * 2 ** Math.max(0, attempt));
}
