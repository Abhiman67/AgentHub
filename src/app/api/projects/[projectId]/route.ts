import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projectUpdateSchema } from "@/lib/validations";
import { handleApi, invalid, notFound } from "@/lib/api";

export const GET = handleApi<{ projectId: string }>(async (_req, { userId: id }, params) => {
  const { projectId } = params;
  const project = await db.project.findFirst({ where: { id: projectId, ownerId: id }, include: { tasks: true, milestones: { orderBy: { position: "asc" } }, risks: { orderBy: { createdAt: "desc" } } } });
  if (!project) throw notFound("Project");
  return NextResponse.json({ project });
});

export const PATCH = handleApi<{ projectId: string }>(async (req, { userId: id }, params) => {
  const { projectId } = params;
  const existing = await db.project.findFirst({ where: { id: projectId, ownerId: id } });
  if (!existing) throw notFound("Project");
  const parsed = projectUpdateSchema.safeParse(await req.json());
  if (!parsed.success) throw invalid("Invalid project update");
  const { name, description, status, linkedAgentIds, members } = parsed.data;
  if (linkedAgentIds) {
    const count = await db.agent.count({ where: { id: { in: linkedAgentIds }, ownerId: id } });
    if (count !== linkedAgentIds.length) throw invalid("Invalid agent");
  }
  const project = await db.project.update({
    where: { id: projectId },
    data: {
      ...(name ? { name: String(name).slice(0, 100) } : {}),
      ...(description !== undefined ? { description: String(description).slice(0, 2000) } : {}),
      ...(status ? { status } : {}),
      ...(linkedAgentIds !== undefined ? { linkedAgentIds } : {}),
      ...(members !== undefined ? { members } : {}),
    },
  });
  return NextResponse.json({ project });
});

export const DELETE = handleApi<{ projectId: string }>(async (_req, { userId: id }, params) => {
  const { projectId } = params;
  const existing = await db.project.findFirst({ where: { id: projectId, ownerId: id } });
  if (!existing) throw notFound("Project");
  await db.project.delete({ where: { id: projectId } });
  return NextResponse.json({ ok: true });
});
