import { db } from "@/lib/db";
import { assertRunTransition } from "./state-machine";
import { buildPlan } from "./planner";
import { buildBoundedContext, renderContextText } from "./context";
import { getTool } from "@/lib/tools/registry";
import { requiresApproval } from "@/lib/tools/permissions";
import { APPROVAL_TTL_MS } from "@/lib/approvals";
import { audit } from "@/lib/audit";
import { trackUsage } from "@/lib/usage";
import { logError, logInfo } from "@/lib/observability/logger";
import { startTrace } from "@/lib/observability/tracing";
import { captureError } from "@/lib/observability/sentry";
import type { AgentRunRequest, AgentRunStatus } from "./types";

async function setRunStatus(runId: string, from: AgentRunStatus, to: AgentRunStatus, extra: Record<string, unknown> = {}) {
  assertRunTransition(from, to);
  return db.agentRun.update({ where: { id: runId }, data: { status: to, ...extra } });
}

export async function createRun(ownerId: string, req: AgentRunRequest) {
  const goal = req.goal.trim().slice(0, 1000);
  if (!goal) throw new Error("Empty goal");
  const agent = await db.agent.findFirst({ where: { id: req.agentId, ownerId }, select: { id: true } });
  if (!agent) throw new Error("Agent not found");
  if (req.projectId) {
    const p = await db.project.findFirst({ where: { id: req.projectId, ownerId }, select: { id: true } });
    if (!p) throw new Error("Project not found");
  }
  if (req.conversationId) {
    const c = await db.conversation.findFirst({ where: { id: req.conversationId, userId: ownerId }, select: { id: true } });
    if (!c) throw new Error("Conversation not found");
  }
  if (req.contextFileIds?.length) {
    const count = await db.file.count({ where: { id: { in: req.contextFileIds }, ownerId } });
    if (count !== new Set(req.contextFileIds).size) throw new Error("File not authorized");
  }
  const run = await db.agentRun.create({
    data: {
      ownerId,
      agentId: req.agentId,
      goal,
      status: "queued",
      conversationId: req.conversationId,
      projectId: req.projectId,
      metadata: JSON.stringify({ contextFileIds: req.contextFileIds ?? [] }),
    },
  });
  await trackUsage(ownerId, "agent_run_created");
  return run;
}

export async function planRun(runId: string, ownerId: string) {
  const run = await db.agentRun.findFirst({ where: { id: runId, ownerId } });
  if (!run) throw new Error("Run not found");
  await setRunStatus(runId, run.status as AgentRunStatus, "planning", { startedAt: run.startedAt ?? new Date() });
  const steps = buildPlan(run.goal);
  await db.agentStep.createMany({
    data: steps.map((s, i) => ({
      runId,
      sequence: i,
      kind: s.kind,
      title: s.title.slice(0, 120),
      description: s.description.slice(0, 1000),
      status: "queued",
      input: s.input ? JSON.stringify(s.input).slice(0, 4000) : null,
      requiresApproval: s.requiresApproval,
    })),
  });
  // Persist toolName for tool steps
  const created = await db.agentStep.findMany({ where: { runId }, orderBy: { sequence: "asc" } });
  for (let i = 0; i < created.length; i++) {
    const s = steps[i];
    if (s.kind === "tool" && s.toolName) {
      await db.agentStep.update({ where: { id: created[i].id }, data: { input: JSON.stringify({ toolName: s.toolName, ...(s.input ?? {}) }).slice(0, 4000) } });
    }
  }
  const after = await db.agentRun.findUniqueOrThrow({ where: { id: runId } });
  const needsApproval = steps.some((s) => s.requiresApproval);
  await setRunStatus(runId, "planning", needsApproval ? "awaiting_approval" : "running");
  return db.agentStep.findMany({ where: { runId }, orderBy: { sequence: "asc" } });
}

export async function executeRun(runId: string, ownerId: string) {
  const trace = startTrace("agent.run");
  logInfo("run.execute.start", { runId, ownerId });
  const run = await db.agentRun.findFirst({ where: { id: runId, ownerId } });
  if (!run) throw new Error("Run not found");
  if (run.status === "planning") await planRun(runId, ownerId);
  const fresh = await db.agentRun.findUniqueOrThrow({ where: { id: runId } });
  if (fresh.status === "awaiting_approval") return fresh;
  if (fresh.status === "queued") {
    await setRunStatus(runId, "queued", "planning");
    await planRun(runId, ownerId);
  }
  const active = await db.agentRun.findUniqueOrThrow({ where: { id: runId } });
  if (active.status !== "running" && active.status !== "awaiting_approval") return active;

  const steps = await db.agentStep.findMany({ where: { runId }, orderBy: { sequence: "asc" } });
  const ctx = await buildBoundedContext({
    userId: ownerId,
    agentId: active.agentId,
    conversationId: active.conversationId ?? undefined,
    projectId: active.projectId ?? undefined,
    currentGoal: active.goal,
  });
  void renderContextText(ctx);

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    if (step.status === "completed" || step.status === "skipped") continue;
    const current = await db.agentRun.findUniqueOrThrow({ where: { id: runId } });
    if (current.status === "cancelled" || current.status === "paused" || current.status === "awaiting_approval") {
      return current;
    }
    await db.agentStep.update({ where: { id: step.id }, data: { status: "running", startedAt: new Date() } });
    await db.agentRun.update({ where: { id: runId }, data: { currentStepIndex: i } });

    try {
      if (step.kind === "tool") {
        const parsed = step.input ? JSON.parse(step.input) : {};
        const toolName = String(parsed.toolName ?? "");
        const tool = getTool(toolName);
        if (!tool) throw new Error(`Unknown tool: ${toolName}`);
        const { toolName: _omit, ...toolInput } = parsed;

        if (requiresApproval(tool.risk) || step.requiresApproval) {
          const existing = await db.approval.findFirst({ where: { runId, status: "pending" } });
          if (!existing) {
            const approval = await db.approval.create({
              data: {
                ownerId,
                agentId: active.agentId,
                runId,
                title: step.title.slice(0, 160),
                description: `${step.description}\nTool: ${toolName}`.slice(0, 2000),
                payload: JSON.stringify({ toolName, ...toolInput }).slice(0, 4000),
                risk: tool.risk,
                expiresAt: new Date(Date.now() + APPROVAL_TTL_MS),
              },
            });
            await db.agentStep.update({ where: { id: step.id }, data: { status: "awaiting_approval", approvalId: approval.id } });
            await db.agentRun.update({ where: { id: runId }, data: { status: "awaiting_approval" } });
            await audit(ownerId, "approval_create", { runId, stepId: step.id, approvalId: approval.id, toolName });
            return db.agentRun.findUniqueOrThrow({ where: { id: runId } });
          }
          return db.agentRun.findUniqueOrThrow({ where: { id: runId } });
        }

        const call = await db.toolCall.create({
          data: { ownerId, runId, stepId: step.id, toolName, risk: tool.risk, status: "running", input: JSON.stringify(toolInput).slice(0, 4000), startedAt: new Date() },
        });
        const parsedInput = tool.inputSchema.parse(toolInput);
        const output = await tool.execute(parsedInput as never, { ownerId, agentId: active.agentId, runId, stepId: step.id });
        await db.toolCall.update({ where: { id: call.id }, data: { status: "completed", output: JSON.stringify(output).slice(0, 4000), completedAt: new Date() } });
        await db.agentStep.update({ where: { id: step.id }, data: { status: "completed", output: JSON.stringify(output).slice(0, 4000), completedAt: new Date() } });
      } else {
        await db.agentStep.update({ where: { id: step.id }, data: { status: "completed", output: `Done: ${step.title}`.slice(0, 1000), completedAt: new Date() } });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Step failed";
      await db.agentStep.update({ where: { id: step.id }, data: { status: "failed", errorMessage: message.slice(0, 1000) } });
      await db.agentRun.update({ where: { id: runId }, data: { status: "failed", errorMessage: message.slice(0, 1000) } });
      await audit(ownerId, "agent_run_failed", { runId, stepId: step.id, message });
      logError("run.step.failed", { runId, stepId: step.id, error: message });
      await captureError("RUN_STEP_FAILED", { runId, stepId: step.id });
      return db.agentRun.findUniqueOrThrow({ where: { id: runId } });
    }
  }

  await db.agentRun.update({ where: { id: runId }, data: { status: "completed", completedAt: new Date() } });
  await trackUsage(ownerId, "agent_run_completed");
  await audit(ownerId, "agent_run_completed", { runId });
  logInfo("run.execute.done", trace.end({ runId }));
  return db.agentRun.findUniqueOrThrow({ where: { id: runId } });
}

export async function cancelRun(runId: string, ownerId: string) {
  const run = await db.agentRun.findFirst({ where: { id: runId, ownerId } });
  if (!run) throw new Error("Run not found");
  assertRunTransition(run.status as AgentRunStatus, "cancelled");
  return db.agentRun.update({ where: { id: runId }, data: { status: "cancelled", cancelledAt: new Date() } });
}

export async function resumeRun(runId: string, ownerId: string) {
  const run = await db.agentRun.findFirst({ where: { id: runId, ownerId }, include: { steps: true } });
  if (!run) throw new Error("Run not found");
  const pending = await db.approval.findFirst({ where: { runId, ownerId, status: "pending" } });
  if (pending) throw new Error("Approval still pending");
  if (run.status === "awaiting_approval" || run.status === "paused") {
    await db.agentRun.update({ where: { id: runId }, data: { status: "running" } });
    return executeRun(runId, ownerId);
  }
  if (run.status === "failed") {
    await db.agentRun.update({ where: { id: runId }, data: { status: "queued", errorMessage: null } });
    return executeRun(runId, ownerId);
  }
  return run;
}
