import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message, requestId: crypto.randomUUID() } }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(_: Request, { params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  const s = await auth();
  if (!s?.user?.email) return err("UNAUTHORIZED", "Sign in required.", 401);
  const u = await db.user.findUnique({ where: { email: s.user.email } });
  const run = await db.agentRun.findFirst({
    where: { id: runId, ownerId: u?.id },
    include: {
      steps: { orderBy: { sequence: "asc" } },
      toolCalls: { orderBy: { createdAt: "asc" } },
      approvals: { orderBy: { createdAt: "desc" }, take: 10 },
      agent: { select: { name: true, template: true, role: true } },
    },
  });
  if (!run) return err("RUN_NOT_FOUND", "Agent run was not found.", 404);
  return NextResponse.json({ run }, { headers: { "Cache-Control": "no-store" } });
}
