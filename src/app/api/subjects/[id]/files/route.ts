import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { handleApi, invalid, notFound } from "@/lib/api";

const attachSchema = z.object({ fileId: z.string().min(1) });

async function ownedSubject(ownerId: string, subjectId: string) {
  const s = await db.subject.findFirst({ where: { id: subjectId, ownerId } });
  if (!s) throw notFound("Subject");
  return s;
}

export const POST = handleApi<{ id: string }>(async (req, { userId: id }, params) => {
  await ownedSubject(id, params.id);
  const parsed = attachSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw invalid("File id is required.");
  const file = await db.file.findFirst({ where: { id: parsed.data.fileId, ownerId: id, status: { not: "deleted" } } });
  if (!file) throw notFound("File");
  await db.file.update({ where: { id: file.id }, data: { subjectId: params.id } });
  return NextResponse.json({ ok: true });
});

export const DELETE = handleApi<{ id: string }>(async (req, { userId: id }, params) => {
  await ownedSubject(id, params.id);
  const fileId = new URL(req.url).searchParams.get("fileId");
  if (!fileId) throw invalid("File id is required.");
  const file = await db.file.findFirst({ where: { id: fileId, ownerId: id, subjectId: params.id } });
  if (!file) throw notFound("File");
  await db.file.update({ where: { id: fileId }, data: { subjectId: null } });
  return NextResponse.json({ ok: true });
});
