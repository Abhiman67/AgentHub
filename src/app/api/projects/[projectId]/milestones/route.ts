import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { handleApi, invalid, notFound } from "@/lib/api";

const createSchema = z.object({
  title: z.string().min(1).max(160),
  dueDate: z.string().optional().refine((v) => !v || !Number.isNaN(Date.parse(v)), "Invalid due date"),
});

const updateSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(160).optional(),
  status: z.enum(["todo", "in_progress", "completed", "cancelled"]).optional(),
  dueDate: z.string().nullable().optional().refine((v) => !v || !Number.isNaN(Date.parse(v as string)), "Invalid due date"),
});

async function ownedProject(ownerId: string, projectId: string) {
  const p = await db.project.findFirst({ where: { id: projectId, ownerId } });
  if (!p) throw notFound("Project");
  return p;
}

export const GET = handleApi<{ projectId: string }>(async (_req, { userId: id }, params) => {
  await ownedProject(id, params.projectId);
  const milestones = await db.milestone.findMany({
    where: { projectId: params.projectId, ownerId: id },
    include: { tasks: { select: { id: true, status: true } } },
    orderBy: { position: "asc" },
  });
  return NextResponse.json({ milestones }, { headers: { "Cache-Control": "no-store" } });
});

export const POST = handleApi<{ projectId: string }>(async (req, { userId: id }, params) => {
  await ownedProject(id, params.projectId);
  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw invalid("Milestone title is required.");
  const position = await db.milestone.count({ where: { projectId: params.projectId } });
  const milestone = await db.milestone.create({
    data: {
      ownerId: id, projectId: params.projectId, title: parsed.data.title.slice(0, 160),
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined, position,
    },
  });
  return NextResponse.json({ milestone }, { status: 201 });
});

export const PATCH = handleApi<{ projectId: string }>(async (req, { userId: id }, params) => {
  await ownedProject(id, params.projectId);
  const parsed = updateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw invalid("Invalid milestone update.");
  const existing = await db.milestone.findFirst({ where: { id: parsed.data.id, projectId: params.projectId, ownerId: id } });
  if (!existing) throw notFound("Milestone");
  const milestone = await db.milestone.update({
    where: { id: parsed.data.id },
    data: {
      ...(parsed.data.title ? { title: parsed.data.title.slice(0, 160) } : {}),
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
      ...(parsed.data.dueDate !== undefined ? { dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null } : {}),
    },
  });
  return NextResponse.json({ milestone });
});

export const DELETE = handleApi<{ projectId: string }>(async (req, { userId: id }, params) => {
  await ownedProject(id, params.projectId);
  const milestoneId = new URL(req.url).searchParams.get("id");
  if (!milestoneId) throw invalid("Milestone id is required.");
  const existing = await db.milestone.findFirst({ where: { id: milestoneId, projectId: params.projectId, ownerId: id } });
  if (!existing) throw notFound("Milestone");
  await db.milestone.delete({ where: { id: milestoneId } });
  return NextResponse.json({ ok: true });
});
