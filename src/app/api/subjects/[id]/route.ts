import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { handleApi, invalid, notFound } from "@/lib/api";

const updateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  code: z.string().max(40).nullable().optional(),
  examDate: z.string().nullable().optional().refine((v) => !v || !Number.isNaN(Date.parse(v as string)), "Invalid exam date"),
});

async function ownedSubject(ownerId: string, subjectId: string) {
  const s = await db.subject.findFirst({ where: { id: subjectId, ownerId } });
  if (!s) throw notFound("Subject");
  return s;
}

export const GET = handleApi<{ id: string }>(async (_req, { userId: id }, params) => {
  await ownedSubject(id, params.id);
  const subject = await db.subject.findUniqueOrThrow({
    where: { id: params.id },
    include: {
      topics: { orderBy: { position: "asc" }, include: { evidence: { orderBy: { createdAt: "desc" }, take: 3 } } },
      outcomes: { orderBy: { createdAt: "asc" } },
      sessions: { orderBy: [{ scheduledFor: "asc" }, { createdAt: "asc" }] },
      files: { select: { id: true, name: true, status: true }, take: 20 },
    },
  });
  return NextResponse.json({ subject }, { headers: { "Cache-Control": "no-store" } });
});

export const PATCH = handleApi<{ id: string }>(async (req, { userId: id }, params) => {
  await ownedSubject(id, params.id);
  const parsed = updateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw invalid("Invalid subject update.");
  const { name, code, examDate } = parsed.data;
  const subject = await db.subject.update({
    where: { id: params.id },
    data: {
      ...(name ? { name: name.slice(0, 120) } : {}),
      ...(code !== undefined ? { code: code?.slice(0, 40) ?? null } : {}),
      ...(examDate !== undefined ? { examDate: examDate ? new Date(examDate) : null } : {}),
    },
  });
  return NextResponse.json({ subject });
});

export const DELETE = handleApi<{ id: string }>(async (_req, { userId: id }, params) => {
  await ownedSubject(id, params.id);
  await db.subject.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
});
