import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleApi } from "@/lib/api";

export const GET = handleApi(async (_, { userId }) => {
  const start = performance.now();
  const [runByStatus, toolFailed, queueBacklog, queueDead, fileFailed, approvalsPending, oldestPending, completedRuns, decidedApprovals, usageByType] = await Promise.all([
    db.agentRun.groupBy({ by: ["status"], where: { ownerId: userId }, _count: { status: true } }),
    db.toolCall.count({ where: { ownerId: userId, status: "failed" } }),
    db.jobRecord.count({ where: { status: { in: ["queued", "running", "retrying"] } } }),
    db.jobRecord.count({ where: { status: "dead_letter" } }),
    db.file.count({ where: { ownerId: userId, status: "failed" } }),
    db.approval.count({ where: { ownerId: userId, status: "pending" } }),
    db.approval.findFirst({ where: { ownerId: userId, status: "pending" }, orderBy: { createdAt: "asc" }, select: { createdAt: true } }),
    db.agentRun.findMany({ where: { ownerId: userId, status: "completed" }, select: { startedAt: true, completedAt: true }, take: 200 }),
    db.approval.findMany({ where: { ownerId: userId, status: { in: ["approved", "denied"] } }, select: { createdAt: true, decidedAt: true }, take: 200 }),
    db.usageEvent.groupBy({ by: ["type"], where: { ownerId: userId }, _count: { type: true } }),
  ]);
  const latencyMs = Math.round(performance.now() - start);
  const runs = Object.fromEntries(runByStatus.map((r) => [r.status, r._count.status]));
  const totalRuns = Object.values(runs).reduce((a, b) => a + (b as number), 0);
  const durations = completedRuns
    .filter((r) => r.startedAt && r.completedAt)
    .map((r) => r.completedAt!.getTime() - r.startedAt!.getTime());
  const waits = decidedApprovals
    .filter((a) => a.decidedAt)
    .map((a) => a.decidedAt!.getTime() - a.createdAt.getTime());
  const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0);
  return NextResponse.json(
    {
      runs,
      runCompletionRate: totalRuns ? Math.round(((runs.completed ?? 0) / totalRuns) * 100) / 100 : 0,
      avgRunDurationMs: avg(durations),
      toolFailures: toolFailed,
      queue: { backlog: queueBacklog, deadLetter: queueDead },
      fileFailures: fileFailed,
      approvals: {
        pending: approvalsPending,
        oldestPendingWaitMs: oldestPending ? Date.now() - oldestPending.createdAt.getTime() : 0,
        avgDecisionWaitMs: avg(waits),
      },
      // Token/cost proxy: metered provider calls are logged as usage events
      // when a real provider is configured; mock runs record no tokens.
      usageByType: Object.fromEntries(usageByType.map((e) => [e.type, e._count.type])),
      dbLatencyMs: latencyMs,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
});
