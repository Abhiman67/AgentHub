import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { handleApi, invalid, notFound } from "@/lib/api";
import { ACTION_POLICIES, isValidSchedule, nextRunAfter } from "@/lib/responsibilities";

const createSchema = z.object({
  agentId: z.string().min(1),
  title: z.string().min(1).max(160),
  instruction: z.string().max(2000).optional(),
  triggerType: z.enum(["schedule", "event"]).optional(),
  triggerValue: z.string().min(1).max(40).optional(),
  scopeIds: z.array(z.string().min(1)).max(20).optional(),
  actionPolicy: z.enum(["suggest_only", "draft_only", "approval_required"]).optional(),
});

export const GET = handleApi(async (_req, { userId: id }) => {
  const routines = await db.agentResponsibility.findMany({
    where: { ownerId: id },
    include: { agent: { select: { name: true, template: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ responsibilities: routines }, { headers: { "Cache-Control": "no-store" } });
});

export const POST = handleApi(async (req, { userId: id }) => {
  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw invalid("Agent, title, and trigger are required.");
  const agent = await db.agent.findFirst({ where: { id: parsed.data.agentId, ownerId: id }, select: { id: true } });
  if (!agent) throw notFound("Agent");
  const triggerType = parsed.data.triggerType ?? "schedule";
  const triggerValue = parsed.data.triggerValue ?? "daily";
  if (triggerType === "schedule" && !isValidSchedule(triggerValue)) {
    throw invalid("Schedule must be daily, weekly, or every_Nh.");
  }
  const actionPolicy = parsed.data.actionPolicy ?? "suggest_only";
  if (!ACTION_POLICIES.includes(actionPolicy)) throw invalid("Invalid action policy.");
  const now = Date.now();
  const routine = await db.agentResponsibility.create({
    data: {
      ownerId: id, agentId: agent.id,
      title: parsed.data.title.slice(0, 160),
      instruction: parsed.data.instruction?.slice(0, 2000) ?? "",
      triggerType, triggerValue,
      scopeIds: parsed.data.scopeIds ?? [],
      actionPolicy,
      nextRunAt: triggerType === "schedule" ? new Date(nextRunAfter(triggerValue, now)!) : null,
    },
    include: { agent: { select: { name: true, template: true } } },
  });
  return NextResponse.json({ responsibility: routine }, { status: 201 });
}, {
  rateLimit: { keyPrefix: "responsibility", limit: 20 },
});
