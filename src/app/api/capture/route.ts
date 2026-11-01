import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { handleApi, invalid, notFound } from "@/lib/api";
import { taskCreateSchema } from "@/lib/validations";
import { objectStorage, storageKeyFor } from "@/lib/storage";
import "@/lib/jobs/processors";
import { enqueue } from "@/lib/jobs/queue";

/**
 * Quick capture (§5.2): one endpoint for task + note. File uploads live on
 * /app/files, new goals/projects on /app/projects/new — the capture UI
 * links there instead of duplicating those flows.
 */
const captureSchema = z.object({
  kind: z.enum(["task", "note"]),
  text: z.string().min(1).max(2000),
  dueDate: z.string().optional(),
});

export const POST = handleApi(async (req, { userId: id }) => {
  const parsed = captureSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw invalid("Text is required.");
  const { kind, text, dueDate } = parsed.data;

  if (kind === "task") {
    const t = taskCreateSchema.safeParse({ title: text.slice(0, 200), dueDate });
    if (!t.success) throw invalid("Could not create task from that text.");
    const task = await db.task.create({
      data: { ownerId: id, title: t.data.title, dueDate: t.data.dueDate ? new Date(t.data.dueDate) : undefined },
    });
    return NextResponse.json({ captured: { kind, id: task.id }, task }, { status: 201 });
  }

  const name = `Quick note ${new Date().toLocaleString()}.md`;
  const bytes = new TextEncoder().encode(text.slice(0, 20000));
  const key = storageKeyFor(id, crypto.randomUUID(), name);
  await objectStorage.put(key, bytes, "text/markdown");
  const saved = await db.file.create({
    data: { ownerId: id, name, mimeType: "text/markdown", size: bytes.length, status: "uploaded", textContent: "", storageKey: key },
  });
  try {
    await enqueue("file.extract", { fileId: saved.id, ownerId: id }, { idempotencyKey: `file.extract:${saved.id}` });
  } catch {
    await db.file.update({ where: { id: saved.id }, data: { status: "failed", failureReason: "EXTRACT_FAILED" } });
    throw invalid("Note saved but processing failed. Retry from Files.");
  }
  const file = await db.file.findUnique({ where: { id: saved.id } });
  if (!file) throw notFound("File");
  return NextResponse.json({ captured: { kind, id: file.id }, file }, { status: 201 });
}, {
  rateLimit: { keyPrefix: "capture", limit: 30 },
});
