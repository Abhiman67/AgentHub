import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleApi, notFound } from "@/lib/api";

export const GET = handleApi<{ id: string }>(async (_req, { userId: ownerId }, params) => {
  const { id } = params;
  const file = await db.file.findFirst({ where: { id, ownerId, status: { not: "deleted" } } });
  if (!file) throw notFound("File");
  return NextResponse.json({ file });
});

export const DELETE = handleApi<{ id: string }>(async (_req, { userId: ownerId }, params) => {
  const { id } = params;
  const file = await db.file.findFirst({ where: { id, ownerId, status: { not: "deleted" } } });
  if (!file) throw notFound("File");
  // Soft delete: keep the row for audit, drop bytes + chunks.
  if (file.storageKey) {
    const { objectStorage } = await import("@/lib/storage");
    await objectStorage.del(file.storageKey);
  }
  await db.fileChunk.deleteMany({ where: { fileId: id } });
  await db.file.update({ where: { id }, data: { status: "deleted", textContent: "", storageKey: null } });
  return NextResponse.json({ ok: true });
});
