import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { handleApi, invalid, notFound } from "@/lib/api";

const updateSchema = z.object({
  title: z.string().min(1).max(160).optional(),
  targetRole: z.string().max(160).optional(),
  status: z.enum(["active", "paused", "achieved", "dropped"]).optional(),
  deadline: z.string().nullable().optional().refine((v) => !v || !Number.isNaN(Date.parse(v as string)), "Invalid deadline"),
  notes: z.string().max(2000).optional(),
});

async function ownedGoal(ownerId: string, goalId: string) {
  const g = await db.careerGoal.findFirst({ where: { id: goalId, ownerId } });
  if (!g) throw notFound("Career goal");
  return g;
}

export const GET = handleApi<{ goalId: string }>(async (_req, { userId: id }, params) => {
  const goal = await ownedGoal(id, params.goalId);
  const applications = await db.application.findMany({ where: { ownerId: id }, orderBy: { createdAt: "desc" }, take: 20 });
  return NextResponse.json({ goal, applications }, { headers: { "Cache-Control": "no-store" } });
});

export const PATCH = handleApi<{ goalId: string }>(async (req, { userId: id }, params) => {
  await ownedGoal(id, params.goalId);
  const parsed = updateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw invalid("Invalid goal update.");
  const goal = await db.careerGoal.update({
    where: { id: params.goalId },
    data: {
      ...(parsed.data.title ? { title: parsed.data.title.slice(0, 160) } : {}),
      ...(parsed.data.targetRole !== undefined ? { targetRole: parsed.data.targetRole.slice(0, 160) } : {}),
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
      ...(parsed.data.deadline !== undefined ? { deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : null } : {}),
      ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes.slice(0, 2000) } : {}),
    },
  });
  return NextResponse.json({ goal });
});

export const DELETE = handleApi<{ goalId: string }>(async (_req, { userId: id }, params) => {
  await ownedGoal(id, params.goalId);
  await db.careerGoal.delete({ where: { id: params.goalId } });
  return NextResponse.json({ ok: true });
});
