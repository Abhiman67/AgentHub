import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { resumeRun } from "@/lib/agents/orchestrator";
import { getOwnedRunSteps } from "@/lib/agents/run-views";
import { apiError, runError, validateRunId } from "@/lib/api-errors";

export async function POST(_: Request, { params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  if (!validateRunId(runId)) return apiError("INVALID_INPUT", "Invalid run id.", 400);
  const s = await auth();
  if (!s?.user?.email) return apiError("UNAUTHORIZED", "Sign in required.", 401);
  const u = await db.user.findUnique({ where: { email: s.user.email } });
  if (!u) return apiError("USER_NOT_FOUND", "User not found.", 404);
  try {
    const run = await resumeRun(runId, u.id);
    const steps = await getOwnedRunSteps(runId);
    return NextResponse.json({ run, steps }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    const mapped = runError(e);
    return apiError(mapped.code, mapped.message, mapped.status);
  }
}
