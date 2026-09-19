import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { taskCreateSchema, taskUpdateSchema } from "@/lib/validations";

async function uid() {
  const s = await auth();
  if (!s?.user?.email) return null;
  const u = await db.user.findUnique({ where: { email: s.user.email } });
  return u?.id ?? null;
}

export async function GET(req: Request) {
  const id = await uid();
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const take = Math.min(Math.max(Number(searchParams.get("take") || 50), 1), 100);
  const cursor = searchParams.get("cursor");
  const tasks = await db.task.findMany({
    where: { ownerId: id, ...(projectId ? { projectId } : {}) },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: take + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });
  const hasMore = tasks.length > take;
  if (hasMore) tasks.pop();
  return NextResponse.json({ tasks, nextCursor: hasMore ? tasks.at(-1)?.id ?? null : null });
}

export async function POST(req: Request) {
  const id = await uid();
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = taskCreateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Title required" }, { status: 400 });
  const { title, projectId, dueDate, priority, agentId } = parsed.data;
  if (projectId) {
    const project = await db.project.findFirst({ where: { id: projectId, ownerId: id }, select: { id: true } });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  if (agentId) {
    const agent = await db.agent.findFirst({ where: { id: agentId, ownerId: id }, select: { id: true } });
    if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }
  const t = await db.task.create({
    data: { ownerId: id, title, projectId: projectId || undefined, dueDate: dueDate ? new Date(dueDate) : undefined, priority: priority ?? "medium", agentId: agentId || undefined },
  });
  return NextResponse.json({ task: t }, { status: 201 });
}

export async function PATCH(req: Request) {
  const id = await uid();
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = taskUpdateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { id: taskId, status, title, dueDate, priority, projectId } = parsed.data;
  const existing = await db.task.findFirst({ where: { id: taskId, ownerId: id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (projectId) {
    const project = await db.project.findFirst({ where: { id: projectId, ownerId: id }, select: { id: true } });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  const t = await db.task.update({
    where: { id: taskId },
    data: {
      ...(status !== undefined ? { status, completedAt: status === "completed" ? new Date() : null } : {}),
      ...(title !== undefined ? { title } : {}),
      ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
      ...(priority !== undefined ? { priority } : {}),
      ...(projectId !== undefined ? { projectId: projectId || null } : {}),
    },
  });
  return NextResponse.json({ task: t });
}

export async function DELETE(req: Request) {
  const id = await uid();
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get("id");
  if (!taskId) return NextResponse.json({ error: "id required" }, { status: 400 });
  const existing = await db.task.findFirst({ where: { id: taskId, ownerId: id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await db.task.delete({ where: { id: taskId } });
  return NextResponse.json({ ok: true });
}
