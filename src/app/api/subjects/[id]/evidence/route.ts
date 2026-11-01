import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { handleApi, invalid, notFound } from "@/lib/api";
import { deriveMastery } from "@/lib/learning";

const evidenceSchema = z.object({
  topicId: z.string().min(1),
  kind: z.enum(["quiz", "flashcards", "session", "self_review"]),
  score: z.number().int().min(0).max(1000).optional(),
  total: z.number().int().min(1).max(1000).optional(),
  note: z.string().max(500).optional(),
});

export const POST = handleApi<{ id: string }>(async (req, { userId: id }, params) => {
  const subject = await db.subject.findFirst({ where: { id: params.id, ownerId: id } });
  if (!subject) throw notFound("Subject");
  const parsed = evidenceSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw invalid("Topic and evidence kind are required.");
  const topic = await db.topic.findFirst({ where: { id: parsed.data.topicId, subjectId: params.id, ownerId: id } });
  if (!topic) throw notFound("Topic");
  const evidence = await db.masteryEvidence.create({
    data: {
      ownerId: id, topicId: topic.id, kind: parsed.data.kind,
      score: parsed.data.score, total: parsed.data.total,
      note: parsed.data.note?.slice(0, 500) ?? "",
    },
  });
  // Recompute mastery from full evidence history — the only writer of mastery.
  const history = await db.masteryEvidence.findMany({ where: { topicId: topic.id }, orderBy: { createdAt: "asc" }, take: 100 });
  const mastery = deriveMastery(history.map((e) => ({ kind: e.kind, score: e.score, total: e.total, note: e.note, createdAt: e.createdAt.getTime() })));
  const updated = await db.topic.update({ where: { id: topic.id }, data: { mastery } });
  return NextResponse.json({ evidence, topic: updated }, { status: 201 });
});
