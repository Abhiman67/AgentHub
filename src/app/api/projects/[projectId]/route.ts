import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { projectUpdateSchema } from "@/lib/validations";

async function uid() {
  const s = await auth();
  if (!s?.user?.email) return null;
  const u = await db.user.findUnique({ where: { email: s.user.email } });
  return u?.id ?? null;
}

export async function GET(_: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const id = await uid();
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const project = await db.project.findFirst({ where: { id: projectId, ownerId: id }, include: { tasks: true } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ project });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const id = await uid();
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const existing = await db.project.findFirst({ where: { id: projectId, ownerId: id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const parsed = projectUpdateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid project update" }, { status: 400 });
  const { name, description, status, linkedAgentIds, members } = parsed.data;
  if (linkedAgentIds) {
    const count = await db.agent.count({ where: { id: { in: linkedAgentIds }, ownerId: id } });
    if (count !== linkedAgentIds.length) return NextResponse.json({ error: "Invalid agent" }, { status: 400 });
  }
  const project = await db.project.update({
    where: { id: projectId },
    data: {
      ...(name ? { name: String(name).slice(0, 100) } : {}),
      ...(description !== undefined ? { description: String(description).slice(0, 2000) } : {}),
      ...(status ? { status } : {}),
      ...(linkedAgentIds !== undefined ? { linkedAgentIds: JSON.stringify(linkedAgentIds) } : {}),
      ...(members !== undefined ? { members: JSON.stringify(members) } : {}),
    },
  });
  return NextResponse.json({ project });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const id = await uid();
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const existing = await db.project.findFirst({ where: { id: projectId, ownerId: id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await db.project.delete({ where: { id: projectId } });
  return NextResponse.json({ ok: true });
}
