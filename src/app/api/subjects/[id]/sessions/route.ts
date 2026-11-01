import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { handleApi, invalid, notFound } from "@/lib/api";

const sessionSchema = z.object({
  title: z.string().min(1).max(160),
  scheduledFor: z.string().optional().refine((v) => !v || !Number.isNaN(Date.parse(v)), "Invalid date"),
  durationMin: z.number().int().min(5).max(240).optional(),
});

const statusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["planned", "done", "skipped"]),
});

async function ownedSubject(ownerId: string, subjectId: string) {
  const s = await db.subject.findFirst({ where: { id: subjectId, ownerId } });
  if (!s) throw notFound("Subject");
  return s;
}

export const POST = handleApi<{ id: string }>(async (req, { userId: id }, params) => {
  await ownedSubject(id, params.id);
  const parsed = sessionSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw invalid("Session title is required.");
  const session = await db.revisionSession.create({
    data: {
      ownerId: id, subjectId: params.id,
      title: parsed.data.title.slice(0, 160),
      scheduledFor: parsed.data.scheduledFor ? new Date(parsed.data.scheduledFor) : undefined,
      durationMin: parsed.data.durationMin ?? 30,
    },
  });
  return NextResponse.json({ session }, { status: 201 });
});

export const PATCH = handleApi<{ id: string }>(async (req, { userId: id }, params) => {
  await ownedSubject(id, params.id);
  const parsed = statusSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw invalid("Invalid session update.");
  const existing = await db.revisionSession.findFirst({ where: { id: parsed.data.id, subjectId: params.id, ownerId: id } });
  if (!existing) throw notFound("Session");
  const session = await db.revisionSession.update({ where: { id: parsed.data.id }, data: { status: parsed.data.status } });
  return NextResponse.json({ session });
});
