import type { AgentRunStatus } from "./types";

export class RunTransitionError extends Error {
  code = "INVALID_RUN_TRANSITION";
  constructor(from: string, to: string) {
    super(`Invalid run transition: ${from} -> ${to}`);
  }
}

const ALLOWED: Record<AgentRunStatus, AgentRunStatus[]> = {
  queued: ["planning"],
  planning: ["running", "awaiting_approval", "failed"],
  running: ["awaiting_approval", "paused", "completed", "failed", "cancelled"],
  awaiting_approval: ["running", "cancelled"],
  paused: ["running", "cancelled"],
  completed: [],
  failed: ["queued"],
  cancelled: [],
};

export function canTransitionRun(from: AgentRunStatus, to: AgentRunStatus): boolean {
  return (ALLOWED[from] ?? []).includes(to);
}

export function assertRunTransition(from: AgentRunStatus, to: AgentRunStatus): void {
  if (!canTransitionRun(from, to)) throw new RunTransitionError(from, to);
}

export const RUN_TRANSITIONS = ALLOWED;
