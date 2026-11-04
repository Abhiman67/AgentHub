/**
 * Responsibility scheduling (master spec §7). Pure schedule math + the tick
 * routine that claims due responsibilities and runs them through the same
 * orchestrator foreground requests use (§8.1 boundary: one domain path).
 */

export type TriggerType = "schedule" | "event";
export type ActionPolicy = "suggest_only" | "draft_only" | "approval_required";
export type ResponsibilityStatus = "active" | "paused" | "archived";

export const ACTION_POLICIES: ActionPolicy[] = ["suggest_only", "draft_only", "approval_required"];

const HOUR = 3600000;

export function nextRunAfter(value: string, from: number): number | null {
  if (value === "daily") return from + 24 * HOUR;
  if (value === "weekly") return from + 7 * 24 * HOUR;
  const m = /^every_(\d+)h$/.exec(value);
  if (m) {
    const hours = Math.min(Math.max(parseInt(m[1], 10), 1), 168);
    return from + hours * HOUR;
  }
  return null;
}

export function isValidSchedule(value: string): boolean {
  return nextRunAfter(value, Date.now()) !== null;
}

export type TickResult = { ran: number; skipped: number; errors: string[] };

/**
 * Run all due responsibilities once. Each claim is a guarded conditional
 * update (status active + nextRunAt due + id match), so concurrent ticks
 * cannot double-run. nextRunAt advances BEFORE execution (at-most-once
 * per interval even if the run fails; failures notify with retry/disable).
 */
export async function tickResponsibilities(now = Date.now(), limit = 25): Promise<TickResult> {
  const { db } = await import("@/lib/db");
  const { createRun, executeRun } = await import("@/lib/agents/orchestrator");
  const { notify } = await import("@/lib/notifications");
  const result: TickResult = { ran: 0, skipped: 0, errors: [] };

  // Keep Classroom-backed tasks current whenever the scheduler ticks.
  const { syncClassroomTasks } = await import("@/lib/integrations/classroom-sync");
  const classroomAccounts = await db.integrationAccount.findMany({ where: { provider: "classroom" }, select: { ownerId: true } });
  for (const account of classroomAccounts) {
    try { await syncClassroomTasks(account.ownerId); } catch (err) { result.errors.push(err instanceof Error ? err.message : "Classroom sync failed"); }
  }

  const due = await db.agentResponsibility.findMany({
    where: { status: "active", triggerType: "schedule", nextRunAt: { lte: new Date(now) } },
    orderBy: { nextRunAt: "asc" },
    take: limit,
  });

  for (const r of due) {
    const next = nextRunAfter(r.triggerValue, now);
    if (next === null) {
      result.skipped += 1;
      continue;
    }
    // Guarded claim: only the tick that flips nextRunAt proceeds.
    const claimed = await db.agentResponsibility.updateMany({
      where: { id: r.id, status: "active", nextRunAt: r.nextRunAt },
      data: { nextRunAt: new Date(next), lastRunAt: new Date(now) },
    });
    if (claimed.count === 0) {
      result.skipped += 1;
      continue;
    }
    try {
      const run = await createRun(r.ownerId, { agentId: r.agentId, goal: r.instruction || r.title });
      const finished = await executeRun(run.id, r.ownerId);
      result.ran += 1;
      if (finished.status === "awaiting_approval") {
        await notify(r.ownerId, {
          kind: "approval_required",
          title: `"${r.title}" needs your review`,
          body: "A scheduled check produced an action waiting for approval.",
          link: "/app/approvals",
          groupedKey: `responsibility:${r.id}:approval`,
        });
      } else if (finished.status === "failed") {
        await notify(r.ownerId, {
          kind: "run_failed",
          title: `"${r.title}" failed`,
          body: finished.errorMessage ?? "The scheduled run failed. Retry it from Routines or disable the routine.",
          link: "/app/responsibilities",
          groupedKey: `responsibility:${r.id}:failed`,
        });
      }
    } catch (err) {
      result.errors.push(err instanceof Error ? err.message : "tick failed");
      const { logError } = await import("@/lib/observability/logger");
      logError("responsibility.tick.failed", { responsibilityId: r.id });
    }
  }
  return result;
}
