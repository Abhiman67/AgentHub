import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { taskCreateSchema, taskUpdateSchema } from "@/lib/validations";
import { handleApi, invalid, notFound } from "@/lib/api";

export const GET = handleApi(async (req, { userId: id }) => {
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
});

export const POST = handleApi(async (req, { userId: id }) => {
  const parsed = taskCreateSchema.safeParse(await req.json());
  if (!parsed.success) throw invalid("Title required");
  const { title, projectId, subjectId, milestoneId, dueDate, priority, agentId } = parsed.data;
  if (projectId) {
    const project = await db.project.findFirst({ where: { id: projectId, ownerId: id }, select: { id: true } });
    if (!project) throw notFound("Project");
  }
  if (subjectId) {
    const subject = await db.subject.findFirst({ where: { id: subjectId, ownerId: id }, select: { id: true } });
    if (!subject) throw notFound("Course");
  }
  if (milestoneId) {
    const milestone = await db.milestone.findFirst({ where: { id: milestoneId, ownerId: id }, select: { id: true, projectId: true } });
    if (!milestone) throw notFound("Milestone");
    if (projectId && milestone.projectId !== projectId) throw invalid("Milestone does not belong to the project.");
  }
  if (agentId) {
    const agent = await db.agent.findFirst({ where: { id: agentId, ownerId: id }, select: { id: true } });
    if (!agent) throw notFound("Agent");
  }
  const t = await db.task.create({
    data: { ownerId: id, title, projectId: projectId || undefined, subjectId: subjectId || undefined, milestoneId: milestoneId || undefined, dueDate: dueDate ? new Date(dueDate) : undefined, priority: priority ?? "medium", agentId: agentId || undefined },
  });
  return NextResponse.json({ task: t }, { status: 201 });
});

export const PATCH = handleApi(async (req, { userId: id }) => {
  const parsed = taskUpdateSchema.safeParse(await req.json());
  if (!parsed.success) throw invalid("Invalid input");
  const { id: taskId, status, title, dueDate, priority, projectId, subjectId, milestoneId } = parsed.data;
  const existing = await db.task.findFirst({ where: { id: taskId, ownerId: id } });
  if (!existing) throw notFound("Task");
  if (projectId) {
    const project = await db.project.findFirst({ where: { id: projectId, ownerId: id }, select: { id: true } });
    if (!project) throw notFound("Project");
  }
  if (subjectId) {
    const subject = await db.subject.findFirst({ where: { id: subjectId, ownerId: id }, select: { id: true } });
    if (!subject) throw notFound("Course");
  }
  if (milestoneId) {
    const milestone = await db.milestone.findFirst({ where: { id: milestoneId, ownerId: id }, select: { id: true, projectId: true } });
    if (!milestone) throw notFound("Milestone");
    const effectiveProject = projectId ?? existing.projectId;
    if (effectiveProject && milestone.projectId !== effectiveProject) throw invalid("Milestone does not belong to the project.");
  }
  const t = await db.task.update({
    where: { id: taskId },
    data: {
      ...(status !== undefined ? { status, completedAt: status === "completed" ? new Date() : null } : {}),
      ...(title !== undefined ? { title } : {}),
      ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
      ...(priority !== undefined ? { priority } : {}),
      ...(projectId !== undefined ? { projectId: projectId || null } : {}),
      ...(subjectId !== undefined ? { subjectId: subjectId || null } : {}),
      ...(milestoneId !== undefined ? { milestoneId: milestoneId || null } : {}),
    },
  });
  return NextResponse.json({ task: t });
});

export const DELETE = handleApi(async (req, { userId: id }) => {
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get("id");
  if (!taskId) throw invalid("id required");
  const existing = await db.task.findFirst({ where: { id: taskId, ownerId: id } });
  if (!existing) throw notFound("Task");
  await db.task.delete({ where: { id: taskId } });
  return NextResponse.json({ ok: true });
});
