import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { cancelRun } from "@/lib/agents/orchestrator";
import { apiError, runError, validateRunId } from "@/lib/api-errors";

export async function POST(_: Request, { params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  if (!validateRunId(runId)) return apiError("INVALID_INPUT", "Invalid run id.", 400);
  const s = await auth();
  if (!s?.user?.email) return apiError("UNAUTHORIZED", "Sign in required.", 401);
  const u = await db.user.findUnique({ where: { email: s.user.email } });
  if (!u) return apiError("USER_NOT_FOUND", "User not found.", 404);
  try {
    const run = await cancelRun(runId, u.id);
    return NextResponse.json({ run }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    const message = e instanceof Error ? e.message : "";
    if (/Run not found/i.test(message)) return apiError("RUN_NOT_FOUND", "Agent run was not found.", 404);
    if (/Invalid run transition/i.test(message)) return apiError("RUN_NOT_CANCELLABLE", "This run can no longer be cancelled.", 409);
    const mapped = runError(e);
    return apiError(mapped.code, mapped.message, mapped.status);
  }
}
