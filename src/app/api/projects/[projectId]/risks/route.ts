import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { handleApi, invalid, notFound } from "@/lib/api";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  severity: z.enum(["low", "medium", "high"]).optional(),
  note: z.string().max(1000).optional(),
});

const updateSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200).optional(),
  severity: z.enum(["low", "medium", "high"]).optional(),
  status: z.enum(["open", "mitigating", "resolved", "accepted"]).optional(),
  note: z.string().max(1000).optional(),
});

async function ownedProject(ownerId: string, projectId: string) {
  const p = await db.project.findFirst({ where: { id: projectId, ownerId } });
  if (!p) throw notFound("Project");
  return p;
}

export const GET = handleApi<{ projectId: string }>(async (_req, { userId: id }, params) => {
  await ownedProject(id, params.projectId);
  const risks = await db.projectRisk.findMany({ where: { projectId: params.projectId, ownerId: id }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ risks }, { headers: { "Cache-Control": "no-store" } });
});

export const POST = handleApi<{ projectId: string }>(async (req, { userId: id }, params) => {
  await ownedProject(id, params.projectId);
  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw invalid("Risk title is required.");
  const risk = await db.projectRisk.create({
    data: {
      ownerId: id, projectId: params.projectId, title: parsed.data.title.slice(0, 200),
      severity: parsed.data.severity ?? "medium", note: parsed.data.note?.slice(0, 1000) ?? "",
    },
  });
  return NextResponse.json({ risk }, { status: 201 });
});

export const PATCH = handleApi<{ projectId: string }>(async (req, { userId: id }, params) => {
  await ownedProject(id, params.projectId);
  const parsed = updateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw invalid("Invalid risk update.");
  const existing = await db.projectRisk.findFirst({ where: { id: parsed.data.id, projectId: params.projectId, ownerId: id } });
  if (!existing) throw notFound("Risk");
  const risk = await db.projectRisk.update({
    where: { id: parsed.data.id },
    data: {
      ...(parsed.data.title ? { title: parsed.data.title.slice(0, 200) } : {}),
      ...(parsed.data.severity ? { severity: parsed.data.severity } : {}),
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
      ...(parsed.data.note !== undefined ? { note: parsed.data.note.slice(0, 1000) } : {}),
    },
  });
  return NextResponse.json({ risk });
});

export const DELETE = handleApi<{ projectId: string }>(async (req, { userId: id }, params) => {
  await ownedProject(id, params.projectId);
  const riskId = new URL(req.url).searchParams.get("id");
  if (!riskId) throw invalid("Risk id is required.");
  const existing = await db.projectRisk.findFirst({ where: { id: riskId, projectId: params.projectId, ownerId: id } });
  if (!existing) throw notFound("Risk");
  await db.projectRisk.delete({ where: { id: riskId } });
  return NextResponse.json({ ok: true });
});
