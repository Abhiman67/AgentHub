import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { handleApi, invalid, notFound } from "@/lib/api";

const renameSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  position: z.number().int().min(0).max(500).optional(),
});

async function ownedTopic(ownerId: string, subjectId: string, topicId: string) {
  const s = await db.subject.findFirst({ where: { id: subjectId, ownerId } });
  if (!s) throw notFound("Subject");
  const t = await db.topic.findFirst({ where: { id: topicId, subjectId, ownerId } });
  if (!t) throw notFound("Topic");
  return t;
}

export const PATCH = handleApi<{ id: string; topicId: string }>(async (req, { userId: id }, params) => {
  await ownedTopic(id, params.id, params.topicId);
  const body = await req.json().catch(() => ({}));
  // Mastery is derived from evidence only — never directly settable.
  if (body && typeof body === "object" && "mastery" in (body as Record<string, unknown>)) {
    throw invalid("Mastery is computed from evidence and cannot be set directly.");
  }
  const parsed = renameSchema.safeParse(body);
  if (!parsed.success) throw invalid("Invalid topic update.");
  const topic = await db.topic.update({
    where: { id: params.topicId },
    data: {
      ...(parsed.data.name ? { name: parsed.data.name.slice(0, 120) } : {}),
      ...(parsed.data.position !== undefined ? { position: parsed.data.position } : {}),
    },
  });
  return NextResponse.json({ topic });
});

export const DELETE = handleApi<{ id: string; topicId: string }>(async (_req, { userId: id }, params) => {
  await ownedTopic(id, params.id, params.topicId);
  await db.topic.delete({ where: { id: params.topicId } });
  return NextResponse.json({ ok: true });
});
