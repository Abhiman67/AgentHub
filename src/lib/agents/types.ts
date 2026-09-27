export const AGENT_RUN_STATUSES = [
  "queued",
  "planning",
  "awaiting_approval",
  "running",
  "paused",
  "completed",
  "failed",
  "cancelled",
] as const;

export type AgentRunStatus = (typeof AGENT_RUN_STATUSES)[number];

export const AGENT_STEP_STATUSES = [
  "queued",
  "running",
  "awaiting_approval",
  "completed",
  "failed",
  "cancelled",
  "skipped",
] as const;

export type AgentStepStatus = (typeof AGENT_STEP_STATUSES)[number];

export type PlanStepKind = "reasoning" | "retrieval" | "tool" | "draft" | "approval";

export type PlanStep = {
  title: string;
  description: string;
  kind: PlanStepKind;
  toolName?: string;
  requiresApproval: boolean;
  input?: Record<string, unknown>;
};

export type AgentRunRequest = {
  agentId: string;
  goal: string;
  conversationId?: string;
  projectId?: string;
  contextFileIds?: string[];
};

export type AgentEvent =
  | { type: "run_created"; runId: string }
  | { type: "plan_created"; runId: string; stepCount: number }
  | { type: "step_started"; runId: string; stepId: string; title: string }
  | { type: "step_completed"; runId: string; stepId: string }
  | { type: "tool_started"; runId: string; toolCallId: string; toolName: string }
  | { type: "tool_completed"; runId: string; toolCallId: string; toolName: string }
  | { type: "approval_required"; runId: string; approvalId: string }
  | { type: "message_delta"; runId: string; text: string }
  | { type: "run_completed"; runId: string }
  | { type: "run_failed"; runId: string; message: string };

export function sseEncodeRun(e: AgentEvent): string {
  return `data: ${JSON.stringify(e)}\n\n`;
}
