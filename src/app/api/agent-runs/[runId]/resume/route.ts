import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { resumeRun } from "@/lib/agents/orchestrator";

export async function POST(_: Request, { params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  const s = await auth();
  if (!s?.user?.email) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Sign in required." } }, { status: 401 });
  const u = await db.user.findUnique({ where: { email: s.user.email } });
  if (!u) return NextResponse.json({ error: { code: "USER_NOT_FOUND", message: "User not found." } }, { status: 404 });
  try {
    const run = await resumeRun(runId, u.id);
    const steps = await db.agentStep.findMany({ where: { runId }, orderBy: { sequence: "asc" } });
    return NextResponse.json({ run, steps }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return NextResponse.json({ error: { code: "RESUME_FAILED", message: e instanceof Error ? e.message : "Resume failed" } }, { status: 400 });
  }
}
