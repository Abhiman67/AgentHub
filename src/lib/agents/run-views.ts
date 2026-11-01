import { db } from "@/lib/db";

/**
 * Safe run detail view (Milestone 2): steps and tool calls are summaries.
 * Raw tool input/output and step input/output are never sent to the client;
 * they may contain file excerpts or profile data. Approval payloads are the
 * user's own pending action data and are kept for informed consent.
 */
export const stepSummarySelect = {
  id: true,
  sequence: true,
  kind: true,
  title: true,
  description: true,
  status: true,
  requiresApproval: true,
  approvalId: true,
  errorMessage: true,
  createdAt: true,
  startedAt: true,
  completedAt: true,
} as const;

export const toolCallSummarySelect = {
  id: true,
  stepId: true,
  toolName: true,
  risk: true,
  status: true,
  errorMessage: true,
  createdAt: true,
  startedAt: true,
  completedAt: true,
} as const;

export async function getOwnedRunDetail(ownerId: string, runId: string) {
  return db.agentRun.findFirst({
    where: { id: runId, ownerId },
    include: {
      steps: { select: stepSummarySelect, orderBy: { sequence: "asc" } },
      toolCalls: { select: toolCallSummarySelect, orderBy: { createdAt: "asc" } },
      approvals: { orderBy: { createdAt: "desc" }, take: 10 },
      agent: { select: { name: true, template: true, role: true } },
    },
  });
}

export async function getOwnedRunSteps(runId: string) {
  return db.agentStep.findMany({
    where: { runId },
    select: stepSummarySelect,
    orderBy: { sequence: "asc" },
  });
}
