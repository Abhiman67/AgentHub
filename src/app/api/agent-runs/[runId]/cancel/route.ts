import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { cancelRun } from "@/lib/agents/orchestrator";

export async function POST(_: Request, { params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  const s = await auth();
  if (!s?.user?.email) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Sign in required." } }, { status: 401 });
  const u = await db.user.findUnique({ where: { email: s.user.email } });
  if (!u) return NextResponse.json({ error: { code: "USER_NOT_FOUND", message: "User not found." } }, { status: 404 });
  try {
    const run = await cancelRun(runId, u.id);
    return NextResponse.json({ run }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return NextResponse.json({ error: { code: "CANCEL_FAILED", message: e instanceof Error ? e.message : "Cancel failed" } }, { status: 400 });
  }
}
