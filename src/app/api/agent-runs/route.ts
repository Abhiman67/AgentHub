import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { createRun, executeRun } from "@/lib/agents/orchestrator";
import { rateLimitDistributed } from "@/lib/rate-limit";

const bodySchema = z.object({
  agentId: z.string().min(1),
  goal: z.string().min(1).max(1000),
  conversationId: z.string().min(1).optional(),
  projectId: z.string().min(1).optional(),
  contextFileIds: z.array(z.string().min(1)).max(10).optional(),
});

function err(code: string, message: string, status: number, requestId: string) {
  return NextResponse.json({ error: { code, message, requestId } }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();
  const s = await auth();
  if (!s?.user?.email) return err("UNAUTHORIZED", "Sign in required.", 401, requestId);
  const u = await db.user.findUnique({ where: { email: s.user.email } });
  if (!u) return err("USER_NOT_FOUND", "User not found.", 404, requestId);
  if (!(await rateLimitDistributed(`agent-run:${u.id}`, 20))) return err("RATE_LIMITED", "Too many runs.", 429, requestId);
  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return err("INVALID_INPUT", "Invalid run request.", 400, requestId);
  try {
    const run = await createRun(u.id, parsed.data);
    const executed = await executeRun(run.id, u.id);
    const steps = await db.agentStep.findMany({ where: { runId: run.id }, orderBy: { sequence: "asc" } });
    return NextResponse.json({ run: executed, steps }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Run failed";
    const status = /not found|authorized/i.test(message) ? 404 : 400;
    return err("RUN_CREATE_FAILED", message, status, requestId);
  }
}

export async function GET(req: Request) {
  const requestId = crypto.randomUUID();
  const s = await auth();
  if (!s?.user?.email) return err("UNAUTHORIZED", "Sign in required.", 401, requestId);
  const u = await db.user.findUnique({ where: { email: s.user.email } });
  if (!u) return err("USER_NOT_FOUND", "User not found.", 404, requestId);
  const url = new URL(req.url);
  const take = Math.min(Math.max(Number(url.searchParams.get("take") || 20), 1), 50);
  const cursor = url.searchParams.get("cursor");
  const runs = await db.agentRun.findMany({
    where: { ownerId: u.id },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    take: take + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    include: { agent: { select: { name: true, template: true } } },
  });
  const hasMore = runs.length > take;
  if (hasMore) runs.pop();
  return NextResponse.json({ runs, nextCursor: hasMore ? runs.at(-1)?.id ?? null : null }, { headers: { "Cache-Control": "no-store" } });
}
