import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleApi, invalid } from "@/lib/api";

export const GET = handleApi(async (_req, { userId }) => {
  const notes = await db.file.findMany({ where: { ownerId: userId, mimeType: "text/markdown", status: { not: "deleted" } }, include: { outgoingLinks: { select: { toId: true, label: true } }, incomingLinks: { select: { fromId: true, label: true } } }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ notes });
});

export const POST = handleApi(async (req, { userId }) => {
  const body = await req.json().catch(() => ({})) as { title?: string; content?: string; subjectId?: string; projectId?: string; careerGoalId?: string; folder?: string; tags?: string[] };
  const title = body.title?.trim();
  if (!title || title.length > 160) throw invalid("A note title is required and must be under 160 characters.");
  const content = typeof body.content === "string" ? body.content : "";
  if (body.subjectId && !(await db.subject.findFirst({ where: { id: body.subjectId, ownerId: userId }, select: { id: true } }))) throw invalid("Subject not found.");
  if (body.projectId && !(await db.project.findFirst({ where: { id: body.projectId, ownerId: userId }, select: { id: true } }))) throw invalid("Project not found.");
  if (body.careerGoalId && !(await db.careerGoal.findFirst({ where: { id: body.careerGoalId, ownerId: userId }, select: { id: true } }))) throw invalid("Career goal not found.");
  const note = await db.file.create({ data: { ownerId: userId, name: `${title}.md`, mimeType: "text/markdown", size: Buffer.byteLength(content), status: "ready", textContent: content, storageKey: `note:${userId}:${crypto.randomUUID()}`, subjectId: body.subjectId || null, projectId: body.projectId || null, careerGoalId: body.careerGoalId || null, folder: body.folder?.slice(0, 80) || "Inbox", tags: Array.isArray(body.tags) ? body.tags.slice(0, 20).map((x) => x.slice(0, 40)) : [] } });
  const targets = [...content.matchAll(/\[\[([^\]]+)\]\]/g)].map((m) => m[1].trim()).filter(Boolean);
  const linked = await db.file.findMany({ where: { ownerId: userId, mimeType: "text/markdown", status: { not: "deleted" }, name: { in: targets.map((x) => `${x}.md`) } }, select: { id: true, name: true } });
  if (linked.length) await Promise.all(linked.filter((x) => x.id !== note.id).map((x) => db.noteLink.upsert({ where: { fromId_toId: { fromId: note.id, toId: x.id } }, create: { ownerId: userId, fromId: note.id, toId: x.id, label: x.name.replace(/\.md$/, "") }, update: { label: x.name.replace(/\.md$/, "") } })));
  return NextResponse.json({ note }, { status: 201 });
});
