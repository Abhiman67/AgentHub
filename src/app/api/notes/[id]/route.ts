import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleApi, invalid, notFound } from "@/lib/api";

export const PATCH = handleApi<{ id: string }>(async (req, { userId }, { id }) => {
  const existing = await db.file.findFirst({ where: { id, ownerId: userId, mimeType: "text/markdown", status: { not: "deleted" } } });
  if (!existing) throw notFound("Note");
  const body = await req.json().catch(() => ({})) as { title?: string; content?: string; subjectId?: string | null; projectId?: string | null; careerGoalId?: string | null; folder?: string; tags?: string[] };
  const title = body.title?.trim();
  if (title !== undefined && (!title || title.length > 160)) throw invalid("Note title must be under 160 characters.");
  const content = body.content;
  if (body.subjectId && !(await db.subject.findFirst({ where: { id: body.subjectId, ownerId: userId }, select: { id: true } }))) throw invalid("Subject not found.");
  if (body.projectId && !(await db.project.findFirst({ where: { id: body.projectId, ownerId: userId }, select: { id: true } }))) throw invalid("Project not found.");
  if (body.careerGoalId && !(await db.careerGoal.findFirst({ where: { id: body.careerGoalId, ownerId: userId }, select: { id: true } }))) throw invalid("Career goal not found.");
  if (body.content !== undefined || title !== undefined) await db.noteRevision.create({ data: { ownerId: userId, fileId: id, title: title ?? existing.name.replace(/\.md$/, ""), content: content ?? existing.textContent } });
  const note = await db.file.update({ where: { id }, data: { ...(title !== undefined ? { name: `${title}.md` } : {}), ...(content !== undefined ? { textContent: content, size: Buffer.byteLength(content) } : {}), ...(body.subjectId !== undefined ? { subjectId: body.subjectId } : {}), ...(body.projectId !== undefined ? { projectId: body.projectId } : {}), ...(body.careerGoalId !== undefined ? { careerGoalId: body.careerGoalId } : {}), ...(body.folder !== undefined ? { folder: body.folder.slice(0, 80) } : {}), ...(body.tags !== undefined ? { tags: body.tags.slice(0, 20).map((x) => x.slice(0, 40)) } : {}) } });
  if (body.content !== undefined) {
    await db.noteLink.deleteMany({ where: { ownerId: userId, fromId: id } });
    const targets = [...body.content.matchAll(/\[\[([^\]]+)\]\]/g)].map((m) => m[1].trim()).filter(Boolean);
    const linked = await db.file.findMany({ where: { ownerId: userId, mimeType: "text/markdown", status: { not: "deleted" }, name: { in: targets.map((x) => `${x}.md`) } }, select: { id: true, name: true } });
    if (linked.length) await Promise.all(linked.filter((x) => x.id !== id).map((x) => db.noteLink.upsert({ where: { fromId_toId: { fromId: id, toId: x.id } }, create: { ownerId: userId, fromId: id, toId: x.id, label: x.name.replace(/\.md$/, "") }, update: { label: x.name.replace(/\.md$/, "") } })));
  }
  return NextResponse.json({ note });
});

export const PUT = PATCH;

export const GET = handleApi<{ id: string }>(async (_req, { userId }, { id }) => {
  const note = await db.file.findFirst({ where: { id, ownerId: userId, mimeType: "text/markdown", status: { not: "deleted" } } });
  if (!note) throw notFound("Note");
  return new NextResponse(note.textContent, { headers: { "Content-Type": "text/markdown; charset=utf-8", "Content-Disposition": `attachment; filename="${note.name.replace(/"/g, "")}"` } });
});

export const DELETE = handleApi<{ id: string }>(async (_req, { userId }, { id }) => {
  const existing = await db.file.findFirst({ where: { id, ownerId: userId, mimeType: "text/markdown", status: { not: "deleted" } } });
  if (!existing) throw notFound("Note");
  await db.file.update({ where: { id }, data: { status: "deleted" } });
  return NextResponse.json({ ok: true });
});
