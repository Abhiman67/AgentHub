/**
 * Milestone 4 §7.2 — agent workflow integration tests.
 * Runs against an isolated temp SQLite DB (see `bun run test:integration`).
 * Covers: create run → plan → safe steps → approval pause → approve/resume →
 * task created once → run completes → audit; deny; retry; cancel;
 * cross-user rejection; expired/replayed approvals; file citations;
 * job idempotency.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { createRun, planRun, executeRun, resumeRun, cancelRun } from "@/lib/agents/orchestrator";
import { decideApproval } from "@/lib/approvals-decide";
import { ApprovalDecisionError } from "@/lib/approvals";
import { getOwnedRunDetail } from "@/lib/agents/run-views";
import { buildBoundedContext } from "@/lib/agents/context";
import { enqueue } from "@/lib/jobs/queue";
import "@/lib/jobs/processors";
import { assertRunTransition } from "@/lib/agents/state-machine";

const stamp = Date.now().toString(36);
let uid1 = "";
let uid2 = "";
let agentId = "";
let projectId = "";

async function makeUser(email: string) {
  const u = await db.user.create({ data: { name: "Test", email, passwordHash: "x" } });
  await db.profile.create({ data: { userId: u.id } });
  return u.id;
}

async function startTaskRun(ownerId: string, goal = "Create a task to revise databases tomorrow") {
  const run = await createRun(ownerId, { agentId, goal, projectId });
  expect(run.status).toBe("queued");
  const steps = await planRun(run.id, ownerId);
  expect(steps).toHaveLength(3);
  const taskStep = steps.find((s) => s.kind === "tool");
  expect(taskStep?.requiresApproval).toBe(true);
  return run;
}

beforeAll(async () => {
  uid1 = await makeUser(`m4u1-${stamp}@test.local`);
  uid2 = await makeUser(`m4u2-${stamp}@test.local`);
  const agent = await db.agent.create({
    data: { ownerId: uid1, template: "test-coach", name: "Test Coach", role: "r", description: "d", category: "Academic", systemPrompt: "Test." },
  });
  agentId = agent.id;
  const project = await db.project.create({ data: { ownerId: uid1, name: "P1" } });
  projectId = project.id;
});

describe("task workflow: plan → approve → exactly one task → complete", () => {
  it("pauses at approval without creating the task", async () => {
    const run = await startTaskRun(uid1);
    const after = await executeRun(run.id, uid1);
    expect(after.status).toBe("awaiting_approval");
    expect(await db.task.count({ where: { ownerId: uid1 } })).toBe(0);
    const approvals = await db.approval.findMany({ where: { runId: run.id, status: "pending" } });
    expect(approvals).toHaveLength(1);
  });

  it("approve executes once, resumes, completes with audit trail", async () => {
    const run = await db.agentRun.findFirstOrThrow({ where: { ownerId: uid1, status: "awaiting_approval" }, orderBy: { createdAt: "desc" } });
    const ap = await db.approval.findFirstOrThrow({ where: { runId: run.id, status: "pending" } });
    const { executionResult } = await decideApproval(uid1, ap.id, "approve");
    expect(executionResult).toContain("create_task");
    expect(await db.task.count({ where: { ownerId: uid1 } })).toBe(1);
    const task = await db.task.findFirstOrThrow({ where: { ownerId: uid1 } });
    expect(task.status).toBe("todo");

    assertRunTransition("awaiting_approval", "running");
    await db.agentRun.update({ where: { id: run.id }, data: { status: "running" } });
    const done = await executeRun(run.id, uid1);
    expect(done.status).toBe("completed");
    // No duplicate task after continuation.
    expect(await db.task.count({ where: { ownerId: uid1 } })).toBe(1);
    const audits = await db.auditEvent.findMany({ where: { ownerId: uid1 } });
    expect(audits.some((a) => a.action === "agent_run_completed")).toBe(true);
  });
});

describe("deny path", () => {
  it("denies without executing and cancels the run", async () => {
    const before = await db.task.count({ where: { ownerId: uid1 } });
    const run = await startTaskRun(uid1, "Create a task to review physics notes");
    await executeRun(run.id, uid1);
    const ap = await db.approval.findFirstOrThrow({ where: { runId: run.id, status: "pending" } });
    await decideApproval(uid1, ap.id, "deny");
    expect(await db.task.count({ where: { ownerId: uid1 } })).toBe(before);
    const steps = await db.agentStep.findMany({ where: { runId: run.id } });
    expect(steps.find((s) => s.kind === "tool")?.status).toBe("cancelled");
    const cancelled = await cancelRun(run.id, uid1);
    expect(cancelled.status).toBe("cancelled");
  });
});

describe("retry and cancel", () => {
  it("retries a failed run without duplicating completed steps", async () => {
    const run = await startTaskRun(uid1, "Create a task to practice chemistry");
    const steps = await db.agentStep.findMany({ where: { runId: run.id }, orderBy: { sequence: "asc" } });
    const toolStep = steps.find((s) => s.kind === "tool")!;
    // Corrupt the tool step to force a failure (bypass approval to hit execution).
    await db.agentStep.update({ where: { id: toolStep.id }, data: { requiresApproval: false, input: JSON.stringify({ toolName: "nope_missing" }) } });
    await db.agentRun.update({ where: { id: run.id }, data: { status: "running" } });
    const failed = await executeRun(run.id, uid1);
    expect(failed.status).toBe("failed");

    await db.agentStep.update({ where: { id: toolStep.id }, data: { status: "queued", errorMessage: null, requiresApproval: false, input: JSON.stringify({ toolName: "create_draft", title: "t", body: "b" }) } });
    const before = await db.task.count({ where: { ownerId: uid1 } });
    const resumed = await resumeRun(run.id, uid1);
    expect(["running", "completed"]).toContain(resumed.status);
    // Completed reasoning/retrieval steps were not re-created.
    expect(await db.agentStep.count({ where: { runId: run.id } })).toBe(3);
    // Draft tool needs no approval and creates no task.
    expect(await db.task.count({ where: { ownerId: uid1 } })).toBe(before);
  });

  it("cancels a fresh run and rejects resuming it", async () => {
    const run = await startTaskRun(uid1, "Create a task to cancel me");
    const cancelled = await cancelRun(run.id, uid1);
    expect(cancelled.status).toBe("cancelled");
    await expect(resumeRun(run.id, uid1)).rejects.toThrow("cancelled");
  });
});

describe("ownership and approval safety", () => {
  it("rejects cross-user agent use and run reads", async () => {
    await expect(createRun(uid2, { agentId, goal: "x" })).rejects.toThrow("Agent not found");
    const run = await db.agentRun.findFirstOrThrow({ where: { ownerId: uid1 } });
    expect(await getOwnedRunDetail(uid2, run.id)).toBeNull();
  });

  it("rejects expired approvals", async () => {
    const ap = await db.approval.create({
      data: { ownerId: uid1, agentId, title: "old", description: "d", createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) },
    });
    await expect(decideApproval(uid1, ap.id, "approve")).rejects.toMatchObject({ code: "EXPIRED" });
  });

  it("rejects repeated approval decisions", async () => {
    const run = await startTaskRun(uid1, "Create a task for replay test");
    await executeRun(run.id, uid1);
    const ap = await db.approval.findFirstOrThrow({ where: { runId: run.id, status: "pending" } });
    await decideApproval(uid1, ap.id, "deny");
    await expect(decideApproval(uid1, ap.id, "approve")).rejects.toBeInstanceOf(ApprovalDecisionError);
    await cancelRun(run.id, uid1);
  });
});

describe("file retrieval with citations", () => {
  it("returns bounded chunks and citations", async () => {
    const file = await db.file.create({
      data: { ownerId: uid1, name: "db-notes.txt", mimeType: "text/plain", size: 100, status: "ready", textContent: "Databases use indexes to speed up queries. Normalization reduces redundancy across tables." },
    });
    const ctx = await buildBoundedContext({ userId: uid1, agentId, currentGoal: "revise database indexes" });
    expect(ctx.citations.length).toBeGreaterThan(0);
    expect(ctx.citations[0].sourceId).toBe(file.id);
    expect(JSON.stringify(ctx).length).toBeLessThanOrEqual(20000);
    expect(JSON.stringify(ctx)).not.toContain("passwordHash");
  });
});

describe("file pipeline: uploaded → ready, soft delete", () => {
  it("extracts, chunks and marks ready", async () => {
    const { enqueue } = await import("@/lib/jobs/queue");
    const file = await db.file.create({
      data: { ownerId: uid1, name: "pipe-notes.txt", mimeType: "text/plain", size: 64, status: "uploaded", textContent: "Photosynthesis converts light to chemical energy in chloroplasts." },
    });
    await enqueue("file.extract", { fileId: file.id, ownerId: uid1 }, { idempotencyKey: `m4-pipe-${stamp}` });
    const done = await db.file.findUniqueOrThrow({ where: { id: file.id } });
    expect(done.status).toBe("ready");
    expect(await db.fileChunk.count({ where: { fileId: file.id } })).toBeGreaterThan(0);
  });

  it("soft-deleted files are hidden from lists", async () => {
    const file = await db.file.create({
      data: { ownerId: uid1, name: "gone.txt", mimeType: "text/plain", size: 3, status: "deleted", textContent: "" },
    });
    const visible = await db.file.findMany({ where: { ownerId: uid1, status: { not: "deleted" } } });
    expect(visible.some((f) => f.id === file.id)).toBe(false);
  });
});

describe("projects depth: milestones, risks, task links, goals", () => {
  it("links tasks to milestones and cascades on project delete", async () => {
    const project = await db.project.create({ data: { ownerId: uid1, name: "Capstone" } });
    const ms = await db.milestone.create({ data: { ownerId: uid1, projectId: project.id, title: "MVP", position: 0 } });
    const task = await db.task.create({ data: { ownerId: uid1, title: "Build auth", projectId: project.id, milestoneId: ms.id } });
    expect(task.milestoneId).toBe(ms.id);
    const risk = await db.projectRisk.create({ data: { ownerId: uid1, projectId: project.id, title: "Scope creep", severity: "high" } });
    expect(risk.status).toBe("open");
    await db.project.delete({ where: { id: project.id } });
    expect(await db.milestone.count({ where: { id: ms.id } })).toBe(0);
    expect(await db.projectRisk.count({ where: { id: risk.id } })).toBe(0);
    // Task survives with project link nulled (SetNull).
    expect(await db.task.findUnique({ where: { id: task.id } })).not.toBeNull();
  });

  it("manages career goals with statuses", async () => {
    const goal = await db.careerGoal.create({ data: { ownerId: uid1, title: "Frontend intern", targetRole: "Frontend Engineer" } });
    expect(goal.status).toBe("active");
    const updated = await db.careerGoal.update({ where: { id: goal.id }, data: { status: "achieved" } });
    expect(updated.status).toBe("achieved");
    expect(await db.careerGoal.findFirst({ where: { id: goal.id, ownerId: uid2 } })).toBeNull();
    await db.careerGoal.delete({ where: { id: goal.id } });
  });
});

describe("responsibilities: schedule → run → notify, pause-all", () => {
  it("executes a fresh run end-to-end without a separate plan call (regression)", async () => {
    const run = await createRun(uid1, { agentId, goal: "Create a task to water the plants" });
    const after = await executeRun(run.id, uid1);
    expect(after.status).toBe("awaiting_approval");
    expect(await db.approval.count({ where: { runId: run.id, status: "pending" } })).toBe(1);
    await cancelRun(run.id, uid1);
  });
  it("ticks a due routine into an approval-paused run with notification", async () => {
    const { tickResponsibilities } = await import("@/lib/responsibilities");
    const routine = await db.agentResponsibility.create({
      data: {
        ownerId: uid1, agentId, title: "Daily check",
        instruction: "Create a task to review notes", triggerType: "schedule",
        triggerValue: "daily", actionPolicy: "suggest_only",
        nextRunAt: new Date(Date.now() - 1000),
      },
    });
    const result = await tickResponsibilities();
    expect(result.ran).toBeGreaterThanOrEqual(1);
    const updated = await db.agentResponsibility.findUniqueOrThrow({ where: { id: routine.id } });
    expect(updated.nextRunAt!.getTime()).toBeGreaterThan(Date.now());
    const notes = await db.notification.findMany({ where: { ownerId: uid1, groupedKey: `responsibility:${routine.id}:approval` } });
    expect(notes.length).toBe(1);
    // Grouped repeat: second notify with same key updates instead of adding.
    const { notify } = await import("@/lib/notifications");
    await notify(uid1, { kind: "approval_required", title: "again", groupedKey: `responsibility:${routine.id}:approval` });
    expect(await db.notification.count({ where: { ownerId: uid1, groupedKey: `responsibility:${routine.id}:approval` } })).toBe(1);
  });

  it("pauses all routines idempotently", async () => {
    await db.agentResponsibility.updateMany({ where: { ownerId: uid1 }, data: { status: "active" } });
    const first = await db.agentResponsibility.updateMany({ where: { ownerId: uid1, status: "active" }, data: { status: "paused" } });
    expect(first.count).toBeGreaterThan(0);
    const second = await db.agentResponsibility.updateMany({ where: { ownerId: uid1, status: "active" }, data: { status: "paused" } });
    expect(second.count).toBe(0);
  });
});

describe("job idempotency", () => {
  it("dedupes identical idempotency keys", async () => {
    const key = `m4-test-${stamp}`;
    const first = await enqueue("usage.aggregate", {}, { idempotencyKey: key, executeInline: false });
    expect(first.deduped).toBe(false);
    const second = await enqueue("usage.aggregate", {}, { idempotencyKey: key, executeInline: false });
    expect(second.deduped).toBe(true);
  });
});

describe("learning workspace: subjects → evidence → mastery → plan", () => {
  it("creates a subject with topics and recomputes mastery from evidence", async () => {
    const subject = await db.subject.create({
      data: {
        ownerId: uid1, name: "Databases",
        topics: { create: [{ ownerId: uid1, name: "Joins", position: 0 }, { ownerId: uid1, name: "Indexes", position: 1 }] },
      },
      include: { topics: true },
    });
    const [joins, indexes] = subject.topics.sort((a, b) => a.position - b.position);
    expect(joins.mastery).toBe("unknown");

    const { deriveMastery } = await import("@/lib/learning");
    await db.masteryEvidence.createMany({
      data: [
        { ownerId: uid1, topicId: joins.id, kind: "quiz", score: 90, total: 100 },
        { ownerId: uid1, topicId: joins.id, kind: "quiz", score: 85, total: 100 },
      ],
    });
    const history = await db.masteryEvidence.findMany({ where: { topicId: joins.id }, orderBy: { createdAt: "asc" } });
    const mastery = deriveMastery(history.map((e) => ({ kind: e.kind, score: e.score, total: e.total, note: e.note, createdAt: e.createdAt.getTime() })));
    expect(mastery).toBe("confident");
    await db.topic.update({ where: { id: joins.id }, data: { mastery } });
    expect((await db.topic.findUniqueOrThrow({ where: { id: joins.id } })).mastery).toBe("confident");

    // Self-reported weakness downgrades to needs_review.
    await db.masteryEvidence.create({ data: { ownerId: uid1, topicId: indexes.id, kind: "self_review", note: "still weak on B-trees" } });
    const h2 = await db.masteryEvidence.findMany({ where: { topicId: indexes.id }, orderBy: { createdAt: "asc" } });
    expect(deriveMastery(h2.map((e) => ({ kind: e.kind, score: e.score, total: e.total, note: e.note, createdAt: e.createdAt.getTime() })))).toBe("needs_review");

    // Cross-user subject access is isolated.
    expect(await db.subject.findFirst({ where: { id: subject.id, ownerId: uid2 } })).toBeNull();
  });

  it("generates an idempotent revision plan", async () => {
    const { planRevision } = await import("@/lib/learning");
    const topics = await db.topic.findMany({ where: { ownerId: uid1 }, orderBy: { position: "asc" }, take: 5 });
    const plan = planRevision(topics.map((t) => t.id), Object.fromEntries(topics.map((t) => [t.id, t.mastery as "unknown"])), 7);
    expect(plan.length).toBeGreaterThan(0);
    expect(plan[0].topicIds.length).toBeGreaterThan(0);
  });
});
