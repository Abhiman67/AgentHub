import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleApi, notFound } from "@/lib/api";

export const GET = handleApi<{ id: string }>(async (_req, { userId }, { id }) => {
  const note = await db.file.findFirst({ where: { id, ownerId: userId, mimeType: "text/markdown", status: { not: "deleted" } }, select: { id: true } });
  if (!note) throw notFound("Note");
  const revisions = await db.noteRevision.findMany({ where: { fileId: id, ownerId: userId }, orderBy: { createdAt: "desc" }, take: 20, select: { id: true, title: true, content: true, createdAt: true } });
  return NextResponse.json({ revisions });
});
