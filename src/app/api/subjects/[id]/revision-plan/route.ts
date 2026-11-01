import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { handleApi, invalid, notFound } from "@/lib/api";
import { planRevision, type MasteryState } from "@/lib/learning";

const planSchema = z.object({
  minutesPerDay: z.number().int().min(10).max(240).optional(),
  daysAvailable: z.number().int().min(1).max(14).optional(),
});

export const POST = handleApi<{ id: string }>(async (req, { userId: id }, params) => {
  const subject = await db.subject.findFirst({ where: { id: params.id, ownerId: id } });
  if (!subject) throw notFound("Subject");
  const parsed = planSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw invalid("Invalid plan options.");
  const topics = await db.topic.findMany({ where: { subjectId: params.id, ownerId: id }, orderBy: { position: "asc" } });
  if (topics.length === 0) throw invalid("Add topics before generating a plan.");
  const daysAvailable = parsed.data.daysAvailable ?? (
    subject.examDate ? Math.max(1, Math.min(14, Math.ceil((subject.examDate.getTime() - Date.now()) / 86400000))) : 7
  );
  const masteryById: Record<string, MasteryState> = Object.fromEntries(topics.map((t) => [t.id, t.mastery as MasteryState]));
  const plan = planRevision(topics.map((t) => t.id), masteryById, daysAvailable, parsed.data.minutesPerDay ?? 45);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Replace previously generated planned sessions to keep the plan idempotent.
  await db.revisionSession.deleteMany({ where: { subjectId: params.id, ownerId: id, status: "planned" } });
  const nameById = new Map(topics.map((t) => [t.id, t.name]));
  const sessions = await Promise.all(plan.map((s) =>
    db.revisionSession.create({
      data: {
        ownerId: id, subjectId: params.id,
        title: `${s.title}: ${s.topicIds.map((tid) => nameById.get(tid) ?? "topic").join(", ").slice(0, 120)}`,
        scheduledFor: new Date(today.getTime() + s.dayOffset * 86400000),
        durationMin: s.durationMin,
      },
    })
  ));
  return NextResponse.json({ plan, sessions }, { status: 201 });
});
