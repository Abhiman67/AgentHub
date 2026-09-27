import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const s = await auth();
  if (!s?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const u = await db.user.findUnique({ where: { email: s.user.email } });
  if (!u) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const start = performance.now();
  const [runByStatus, toolFailed, queueBacklog, queueDead, fileFailed, approvalsPending, oldestPending] = await Promise.all([
    db.agentRun.groupBy({ by: ["status"], where: { ownerId: u.id }, _count: { status: true } }),
    db.toolCall.count({ where: { ownerId: u.id, status: "failed" } }),
    db.jobRecord.count({ where: { status: { in: ["queued", "running", "retrying"] } } }),
    db.jobRecord.count({ where: { status: "dead_letter" } }),
    db.file.count({ where: { ownerId: u.id, status: "failed" } }),
    db.approval.count({ where: { ownerId: u.id, status: "pending" } }),
    db.approval.findFirst({ where: { ownerId: u.id, status: "pending" }, orderBy: { createdAt: "asc" }, select: { createdAt: true } }),
  ]);
  const latencyMs = Math.round(performance.now() - start);
  return NextResponse.json(
    {
      runs: Object.fromEntries(runByStatus.map((r) => [r.status, r._count.status])),
      toolFailures: toolFailed,
      queue: { backlog: queueBacklog, deadLetter: queueDead },
      fileFailures: fileFailed,
      approvals: { pending: approvalsPending, oldestPendingWaitMs: oldestPending ? Date.now() - oldestPending.createdAt.getTime() : 0 },
      dbLatencyMs: latencyMs,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
