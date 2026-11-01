import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getOwnedRunDetail } from "@/lib/agents/run-views";
import { apiError, validateRunId } from "@/lib/api-errors";

export async function GET(_: Request, { params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  if (!validateRunId(runId)) return apiError("INVALID_INPUT", "Invalid run id.", 400);
  const s = await auth();
  if (!s?.user?.email) return apiError("UNAUTHORIZED", "Sign in required.", 401);
  const u = await db.user.findUnique({ where: { email: s.user.email } });
  if (!u) return apiError("USER_NOT_FOUND", "User not found.", 404);
  const run = await getOwnedRunDetail(u.id, runId);
  if (!run) return apiError("RUN_NOT_FOUND", "Agent run was not found.", 404);
  return NextResponse.json({ run }, { headers: { "Cache-Control": "no-store" } });
}
