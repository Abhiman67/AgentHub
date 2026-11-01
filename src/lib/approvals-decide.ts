import { db } from "@/lib/db";
import { assertApprovable, ApprovalDecisionError } from "@/lib/approvals";

export type DecideAction = "approve" | "deny";

/**
 * Atomic single-use approval decision (Milestone 1 §4.3, tested in Milestone 4).
 *
 * Single-use is enforced with a guarded conditional update
 * (`updateMany` on id + owner + pending) instead of an interactive
 * transaction: tool execution can take arbitrary time and must never run
 * while holding a database write lock (deadlocks SQLite, strains Postgres).
 * Concurrent approve/deny attempts cannot both claim the row; the loser
 * re-reads and gets ALREADY_DECIDED / EXPIRED / FORBIDDEN.
 */
export async function decideApproval(ownerId: string, approvalId: string, action: DecideAction) {
  const row = await db.approval.findUnique({ where: { id: approvalId } });
  if (!row) throw new Error("Not found");
  try {
    assertApprovable(row, ownerId);
  } catch (e) {
    if (e instanceof ApprovalDecisionError && e.code === "EXPIRED") {
      await db.approval.updateMany({ where: { id: approvalId, status: "pending" }, data: { status: "expired", decidedAt: new Date() } });
    }
    throw e;
  }

  const approvalStatus = action === "approve" ? "approved" : "denied";
  const claimed = await db.approval.updateMany({
    where: { id: approvalId, ownerId, status: "pending" },
    data: { status: approvalStatus, decidedAt: new Date() },
  });
  if (claimed.count === 0) {
    const current = await db.approval.findUnique({ where: { id: approvalId } });
    if (!current) throw new Error("Not found");
    assertApprovable(current, ownerId);
    throw new ApprovalDecisionError("ALREADY_DECIDED", `Approval already ${current.status}.`);
  }

  let executionResult: string | null = null;
  if (action === "approve" && row.payload) {
    const data = JSON.parse(row.payload);
    if (data.type === "create_task" && typeof data.title === "string" && data.title.trim()) {
      if (data.projectId) {
        const project = await db.project.findFirst({ where: { id: data.projectId, ownerId }, select: { id: true } });
        if (!project) throw new Error("Invalid project");
      }
      await db.task.create({
        data: {
          ownerId,
          title: data.title.slice(0, 200),
          priority: data.priority ?? "medium",
          dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
          projectId: data.projectId ?? undefined,
          agentId: row.agentId,
        },
      });
      executionResult = `Task "${data.title}" created in your planner.`;
    } else if (data.toolName && typeof data.toolName === "string") {
      const { getTool } = await import("@/lib/tools/registry");
      const tool = getTool(data.toolName);
      if (!tool || !row.runId) throw new Error("Invalid approval payload");
      const { toolName: _omit, ...toolInput } = data;
      const parsed = tool.inputSchema.parse(toolInput);
      const linkedStep = await db.agentStep.findFirst({ where: { runId: row.runId, status: "awaiting_approval" }, orderBy: { sequence: "asc" } });
      const output = await tool.execute(parsed as never, { ownerId, agentId: row.agentId, runId: row.runId, stepId: linkedStep?.id });
      await db.toolCall.create({
        data: {
          ownerId,
          runId: row.runId,
          stepId: linkedStep?.id,
          toolName: data.toolName,
          risk: tool.risk,
          status: "completed",
          input: JSON.stringify(toolInput).slice(0, 4000),
          output: JSON.stringify(output).slice(0, 4000),
          completedAt: new Date(),
        },
      });
      if (linkedStep) {
        await db.agentStep.update({ where: { id: linkedStep.id }, data: { status: "completed", output: JSON.stringify(output).slice(0, 4000), completedAt: new Date() } });
      }
      executionResult = `Tool ${data.toolName} executed.`;
    }
  } else if (action === "deny" && row.runId) {
    // Denied: never execute the tool. Park waiting steps as cancelled.
    await db.agentStep.updateMany({ where: { runId: row.runId, status: "awaiting_approval" }, data: { status: "cancelled", completedAt: new Date() } });
  }

  const approval = await db.approval.findUniqueOrThrow({ where: { id: approvalId } });
  return { approval, executionResult };
}
