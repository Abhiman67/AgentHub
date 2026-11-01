import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleApi, invalid, notFound } from "@/lib/api";
import { nextRunAfter } from "@/lib/responsibilities";

async function ownedActiveRoutine(ownerId: string, routineId: string) {
  const r = await db.agentResponsibility.findFirst({ where: { id: routineId, ownerId } });
  if (!r) throw notFound("Responsibility");
  return r;
}

export const POST = handleApi<{ id: string }>(async (_req, { userId: id }, params) => {
  const r = await ownedActiveRoutine(id, params.id);
  if (r.status === "paused") throw invalid("Responsibility is paused. Resume it first.");
  if (r.status === "archived") throw invalid("Responsibility is archived.");
  const now = Date.now();
  const claimed = await db.agentResponsibility.updateMany({
    where: { id: r.id, status: "active", nextRunAt: r.nextRunAt },
    data: {
      nextRunAt: r.triggerType === "schedule" && r.nextRunAt ? new Date(nextRunAfter(r.triggerValue, now) ?? now + 86400000) : r.nextRunAt,
      lastRunAt: new Date(now),
    },
  });
  if (claimed.count === 0) throw invalid("A run was just triggered. Try again in a moment.");
  const { createRun, executeRun } = await import("@/lib/agents/orchestrator");
  const run = await createRun(id, { agentId: r.agentId, goal: r.instruction || r.title });
  const finished = await executeRun(run.id, id);
  return NextResponse.json({ run: finished }, { status: 201 });
}, {
  rateLimit: { keyPrefix: "routine-trigger", limit: 10 },
});
