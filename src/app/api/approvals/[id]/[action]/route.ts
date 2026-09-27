import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { trackUsage } from "@/lib/usage";
import { audit } from "@/lib/audit";

export async function POST(_: Request, { params }: { params: Promise<{ id: string; action: string }> }) {
  const { id, action } = await params;
  const s = await auth();
  if (!s?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const u = await db.user.findUnique({ where: { email: s.user.email } });
  const existing = await db.approval.findFirst({ where: { id, ownerId: u?.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.status !== "pending") return NextResponse.json({ approval: existing });
  if (Date.now() - existing.createdAt.getTime() > 7 * 24 * 60 * 60 * 1000) {
    const expired = await db.approval.update({ where: { id }, data: { status: "expired", decidedAt: new Date() } });
    return NextResponse.json({ approval: expired }, { status: 410 });
  }
  if (action !== "approve" && action !== "deny") return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  if (existing.expiresAt && existing.expiresAt.getTime() < Date.now()) {
    const expired = await db.approval.update({ where: { id }, data: { status: "expired", decidedAt: new Date() } });
    return NextResponse.json({ approval: expired }, { status: 410 });
  }
  let executionResult: string | null = null;
  const approval = await db.$transaction(async (tx) => {
    if (action === "approve" && existing.payload) {
      const data = JSON.parse(existing.payload);
      if (data.type === "create_task" && typeof data.title === "string" && data.title.trim()) {
        if (data.projectId) {
          const project = await tx.project.findFirst({ where: { id: data.projectId, ownerId: u!.id }, select: { id: true } });
          if (!project) throw new Error("Invalid project");
        }
        await tx.task.create({ data: { ownerId: u!.id, title: data.title.slice(0, 200), priority: data.priority ?? "medium", dueDate: data.dueDate ? new Date(data.dueDate) : undefined, projectId: data.projectId ?? undefined, agentId: existing.agentId } });
        executionResult = `Task "${data.title}" created in your planner.`;
      } else if (data.toolName && typeof data.toolName === "string") {
        const { getTool } = await import("@/lib/tools/registry");
        const tool = getTool(data.toolName);
        if (tool && existing.runId) {
          const { toolName: _omit, ...toolInput } = data;
          const parsed = tool.inputSchema.parse(toolInput);
          const step = existing.toolCallId
            ? await tx.toolCall.findFirst({ where: { id: existing.toolCallId } })
            : null;
          const output = await tool.execute(parsed as never, {
            ownerId: u!.id,
            agentId: existing.agentId,
            runId: existing.runId,
            stepId: step?.stepId ?? undefined,
          });
          const call = await tx.toolCall.create({
            data: {
              ownerId: u!.id,
              runId: existing.runId,
              toolName: data.toolName,
              risk: tool.risk,
              status: "completed",
              input: JSON.stringify(toolInput).slice(0, 4000),
              output: JSON.stringify(output).slice(0, 4000),
              completedAt: new Date(),
            },
          });
          if (step?.stepId) {
            await tx.agentStep.update({ where: { id: step.stepId }, data: { status: "completed", output: JSON.stringify(output).slice(0, 4000), completedAt: new Date() } });
          } else {
            const pendingStep = await tx.agentStep.findFirst({ where: { runId: existing.runId, status: "awaiting_approval" }, orderBy: { sequence: "asc" } });
            if (pendingStep) {
              await tx.agentStep.update({ where: { id: pendingStep.id }, data: { status: "completed", output: JSON.stringify(output).slice(0, 4000), completedAt: new Date() } });
            }
          }
          void call;
          executionResult = `Tool ${data.toolName} executed.`;
        }
      }
    }
    return tx.approval.update({ where: { id }, data: { status: action === "approve" ? "approved" : "denied", decidedAt: new Date() } });
  });
  await trackUsage(u!.id, action === "approve" ? "approval_accepted" : "approval_denied");
  await audit(u!.id, `approval_${action}`, { approvalId: id, executionResult });
  if (existing.runId) {
    const { resumeRun, cancelRun } = await import("@/lib/agents/orchestrator");
    try {
      if (action === "approve") {
        await db.agentRun.update({ where: { id: existing.runId }, data: { status: "running" } });
        await resumeRun(existing.runId, u!.id);
      } else if (action === "deny") {
        const run = await db.agentRun.findUnique({ where: { id: existing.runId } });
        if (run && run.status === "awaiting_approval") await cancelRun(existing.runId, u!.id);
      }
    } catch (e) {
      if (process.env.NODE_ENV !== "production") console.warn("run resume after approval failed", e);
    }
  }
  return NextResponse.json({ approval, executionResult });
}
