import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { handleApi, invalid, notFound } from "@/lib/api";
import { ACTION_POLICIES, isValidSchedule } from "@/lib/responsibilities";

const updateSchema = z.object({
  title: z.string().min(1).max(160).optional(),
  instruction: z.string().max(2000).optional(),
  triggerValue: z.string().min(1).max(40).optional(),
  actionPolicy: z.enum(["suggest_only", "draft_only", "approval_required"]).optional(),
  status: z.enum(["active", "paused", "archived"]).optional(),
});

async function ownedRoutine(ownerId: string, routineId: string) {
  const r = await db.agentResponsibility.findFirst({ where: { id: routineId, ownerId } });
  if (!r) throw notFound("Responsibility");
  return r;
}

export const PATCH = handleApi<{ id: string }>(async (req, { userId: id }, params) => {
  await ownedRoutine(id, params.id);
  const parsed = updateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw invalid("Invalid responsibility update.");
  if (parsed.data.triggerValue && !isValidSchedule(parsed.data.triggerValue)) {
    throw invalid("Schedule must be daily, weekly, or every_Nh.");
  }
  if (parsed.data.actionPolicy && !ACTION_POLICIES.includes(parsed.data.actionPolicy)) {
    throw invalid("Invalid action policy.");
  }
  const routine = await db.agentResponsibility.update({
    where: { id: params.id },
    data: {
      ...(parsed.data.title ? { title: parsed.data.title.slice(0, 160) } : {}),
      ...(parsed.data.instruction !== undefined ? { instruction: parsed.data.instruction.slice(0, 2000) } : {}),
      ...(parsed.data.triggerValue ? { triggerValue: parsed.data.triggerValue, nextRunAt: new Date(Date.now() + 24 * 3600000) } : {}),
      ...(parsed.data.actionPolicy ? { actionPolicy: parsed.data.actionPolicy } : {}),
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
    },
    include: { agent: { select: { name: true, template: true } } },
  });
  return NextResponse.json({ responsibility: routine });
});

export const DELETE = handleApi<{ id: string }>(async (_req, { userId: id }, params) => {
  await ownedRoutine(id, params.id);
  await db.agentResponsibility.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
});
