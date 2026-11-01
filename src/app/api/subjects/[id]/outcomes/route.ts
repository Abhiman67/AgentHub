import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { handleApi, invalid, notFound } from "@/lib/api";

const outcomeSchema = z.object({
  text: z.string().min(1).max(500),
  topicId: z.string().min(1).optional(),
});

async function ownedSubject(ownerId: string, subjectId: string) {
  const s = await db.subject.findFirst({ where: { id: subjectId, ownerId } });
  if (!s) throw notFound("Subject");
  return s;
}

export const POST = handleApi<{ id: string }>(async (req, { userId: id }, params) => {
  await ownedSubject(id, params.id);
  const parsed = outcomeSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw invalid("Outcome text is required.");
  if (parsed.data.topicId) {
    const t = await db.topic.findFirst({ where: { id: parsed.data.topicId, subjectId: params.id, ownerId: id } });
    if (!t) throw notFound("Topic");
  }
  const outcome = await db.learningOutcome.create({
    data: { ownerId: id, subjectId: params.id, topicId: parsed.data.topicId, text: parsed.data.text.slice(0, 500) },
  });
  return NextResponse.json({ outcome }, { status: 201 });
});

export const DELETE = handleApi<{ id: string }>(async (req, { userId: id }, params) => {
  await ownedSubject(id, params.id);
  const outcomeId = new URL(req.url).searchParams.get("id");
  if (!outcomeId) throw invalid("Outcome id is required.");
  const existing = await db.learningOutcome.findFirst({ where: { id: outcomeId, subjectId: params.id, ownerId: id } });
  if (!existing) throw notFound("Outcome");
  await db.learningOutcome.delete({ where: { id: outcomeId } });
  return NextResponse.json({ ok: true });
});
