import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getQuota } from "@/lib/quotas";
import { objectStorage, storageKeyFor } from "@/lib/storage";
import "@/lib/jobs/processors";
import { enqueue } from "@/lib/jobs/queue";
import { HttpError, handleApi, invalid } from "@/lib/api";

export const GET = handleApi(async (req, { userId: id }) => {
  const url = new URL(req.url);
  const take = Math.min(Math.max(Number(url.searchParams.get("take") || 50), 1), 100);
  const cursor = url.searchParams.get("cursor");
  const files = await db.file.findMany({ where: { ownerId: id, status: { not: "deleted" } }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: take + 1, ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}) });
  const hasMore = files.length > take;
  if (hasMore) files.pop();
  return NextResponse.json({ files, nextCursor: hasMore ? files.at(-1)?.id ?? null : null });
});

export const POST = handleApi(async (req, { userId: id }) => {
  const quota = await getQuota(id, "files");
  if (!quota.allowed) throw new HttpError("QUOTA_EXCEEDED", 402, "File quota exceeded", false, { quota });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) throw invalid("No file");
  if (file.size > 10 * 1024 * 1024) throw new HttpError("FILE_TOO_LARGE", 413, "Max 10MB");

  const name = file.name.toLowerCase();
  const allowed = name.endsWith(".pdf") || name.endsWith(".txt") || name.endsWith(".md") || name.endsWith(".docx");
  if (!allowed) throw invalid("PDF, TXT, MD or DOCX only");

  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const isPdf = bytes.length >= 5 && new TextDecoder("ascii").decode(bytes.slice(0, 5)) === "%PDF-";
  const isZip = bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
  if ((name.endsWith(".pdf") && !isPdf) || (name.endsWith(".docx") && !isZip)) {
    throw invalid("File contents do not match the extension");
  }
  // AV-scan hook: provider-side scan runs here when configured; local dev records pass.
  if (process.env.AV_SCAN_URL) {
    try {
      const res = await fetch(process.env.AV_SCAN_URL, { method: "POST", body: bytes as unknown as BodyInit });
      if (!res.ok) throw invalid("File rejected by malware scan");
    } catch (e) {
      if (e instanceof HttpError) throw e;
      throw new HttpError("SCAN_UNAVAILABLE", 503, "Scan unavailable, try again", true);
    }
  }

  const tmpId = crypto.randomUUID();
  const key = storageKeyFor(id, tmpId, file.name);
  await objectStorage.put(key, bytes, file.type || "application/octet-stream");

  const saved = await db.file.create({
    data: {
      ownerId: id,
      name: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      status: "uploaded",
      textContent: "",
      storageKey: key,
    },
  });

  try {
    await enqueue("file.extract", { fileId: saved.id, ownerId: id }, { idempotencyKey: `file.extract:${saved.id}` });
  } catch (err) {
    await db.file.update({ where: { id: saved.id }, data: { status: "failed", failureReason: "EXTRACT_FAILED" } });
    if (process.env.NODE_ENV !== "production") console.warn("file pipeline failed", err);
  }
  const final = await db.file.findUnique({ where: { id: saved.id } });

  return NextResponse.json({ file: final ?? saved }, { status: 201 });
}, {
  rateLimit: { keyPrefix: "upload", limit: 10 },
});
