import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { createRun, executeRun } from "@/lib/agents/orchestrator";
import { getOwnedRunSteps } from "@/lib/agents/run-views";
import { apiError, runError } from "@/lib/api-errors";
import { rateLimitDistributed } from "@/lib/rate-limit";

const bodySchema = z.object({
  agentId: z.string().min(1).max(64),
  goal: z.string().min(1).max(1000),
  conversationId: z.string().min(1).max(64).optional(),
  projectId: z.string().min(1).max(64).optional(),
  contextFileIds: z.array(z.string().min(1).max(64)).max(10).optional(),
});

export async function POST(req: Request) {
  const s = await auth();
  if (!s?.user?.email) return apiError("UNAUTHORIZED", "Sign in required.", 401);
  const u = await db.user.findUnique({ where: { email: s.user.email } });
  if (!u) return apiError("USER_NOT_FOUND", "User not found.", 404);
  if (!(await rateLimitDistributed(`agent-run:${u.id}`, 20))) return apiError("RATE_LIMITED", "Too many runs.", 429);
  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return apiError("INVALID_INPUT", "Invalid run request.", 400);
  try {
    const run = await createRun(u.id, parsed.data);
    const executed = await executeRun(run.id, u.id);
    const steps = await getOwnedRunSteps(run.id);
    return NextResponse.json({ run: executed, steps }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    const mapped = runError(e);
    return apiError(mapped.code, mapped.message, mapped.status);
  }
}

export async function GET(req: Request) {
  const s = await auth();
  if (!s?.user?.email) return apiError("UNAUTHORIZED", "Sign in required.", 401);
  const u = await db.user.findUnique({ where: { email: s.user.email } });
  if (!u) return apiError("USER_NOT_FOUND", "User not found.", 404);
  const url = new URL(req.url);
  const take = Math.min(Math.max(Number(url.searchParams.get("take") || 20), 1), 50);
  const cursor = url.searchParams.get("cursor");
  if (cursor && (cursor.length < 1 || cursor.length > 64)) return apiError("INVALID_INPUT", "Invalid pagination cursor.", 400);
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
