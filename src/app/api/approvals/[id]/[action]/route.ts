import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { trackUsage } from "@/lib/usage";
import { audit } from "@/lib/audit";
import { assertApprovable, ApprovalDecisionError } from "@/lib/approvals";
import { decideApproval } from "@/lib/approvals-decide";
import { assertRunTransition } from "@/lib/agents/state-machine";
import type { AgentRunStatus } from "@/lib/agents/types";
import { handleApi, HttpError, invalid, notFound } from "@/lib/api";

function decisionStatus(code: string): number {
  return code === "FORBIDDEN" ? 403 : code === "EXPIRED" ? 410 : 409;
}

export const POST = handleApi<{ id: string; action: string }>(async (_, { userId }, params) => {
  const { id, action } = params;
  if (action !== "approve" && action !== "deny") throw invalid("Invalid action");

  const existing = await db.approval.findFirst({ where: { id, ownerId: userId } });
  if (!existing) throw notFound("Approval");
  try {
    assertApprovable(existing, userId);
  } catch (e) {
    if (e instanceof ApprovalDecisionError) {
      if (e.code === "EXPIRED") {
        await db.approval.updateMany({ where: { id, status: "pending" }, data: { status: "expired", decidedAt: new Date() } });
      }
      const current = await db.approval.findUnique({ where: { id } });
      throw new HttpError(e.code, decisionStatus(e.code), e.message, false, { approval: current });
    }
    throw e;
  }

  try {
    const { approval, executionResult } = await decideApproval(userId, id, action);

    await trackUsage(userId, action === "approve" ? "approval_accepted" : "approval_denied");
    await audit(userId, `approval_${action}`, { approvalId: id, executionResult });

    if (existing.runId) {
      const { executeRun, cancelRun } = await import("@/lib/agents/orchestrator");
      try {
        if (action === "approve") {
          const run = await db.agentRun.findUnique({ where: { id: existing.runId } });
          if (run && run.status === "awaiting_approval") {
            assertRunTransition(run.status as AgentRunStatus, "running");
            await db.agentRun.update({ where: { id: existing.runId }, data: { status: "running" } });
          }
          await executeRun(existing.runId, userId);
        } else if (action === "deny") {
          const run = await db.agentRun.findUnique({ where: { id: existing.runId } });
          if (run && (run.status === "awaiting_approval" || run.status === "running" || run.status === "paused")) {
            await cancelRun(existing.runId, userId);
          }
        }
      } catch (e) {
        if (process.env.NODE_ENV !== "production") console.warn("run continuation after approval failed", e);
      }
    }
    const finalApproval = await db.approval.findUnique({ where: { id } });
    return NextResponse.json({ approval: finalApproval ?? approval, executionResult });
  } catch (e) {
    if (e instanceof ApprovalDecisionError) {
      const current = await db.approval.findUnique({ where: { id } });
      throw new HttpError(e.code, decisionStatus(e.code), e.message, false, { approval: current });
    }
    if (e instanceof HttpError) throw e;
    throw invalid(e instanceof Error ? e.message : "Decision failed");
  }
}, {
  rateLimit: { keyPrefix: "approval-decide", limit: 30 },
});
