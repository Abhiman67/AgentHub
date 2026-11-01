import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { handleApi, invalid, notFound } from "@/lib/api";

async function ownedSubject(ownerId: string, subjectId: string) {
  const s = await db.subject.findFirst({ where: { id: subjectId, ownerId } });
  if (!s) throw notFound("Subject");
  return s;
}

const bulkSchema = z.object({ names: z.array(z.string().min(1).max(120)).min(1).max(50) });

export const POST = handleApi<{ id: string }>(async (req, { userId: id }, params) => {
  await ownedSubject(id, params.id);
  const parsed = bulkSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw invalid("Provide 1–50 topic names.");
  const base = await db.topic.count({ where: { subjectId: params.id } });
  await db.topic.createMany({
    data: parsed.data.names.map((n, i) => ({ ownerId: id, subjectId: params.id, name: n.slice(0, 120), position: base + i })),
  });
  const topics = await db.topic.findMany({ where: { subjectId: params.id }, orderBy: { position: "asc" } });
  return NextResponse.json({ topics }, { status: 201 });
});
