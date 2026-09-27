import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getQuota } from "@/lib/quotas";
import { objectStorage, storageKeyFor } from "@/lib/storage";
import "@/lib/jobs/processors";
import { enqueue } from "@/lib/jobs/queue";

export async function GET(req: Request) {
  const s = await auth();
  if (!s?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const u = await db.user.findUnique({ where: { email: s.user.email } });
  const url = new URL(req.url);
  const take = Math.min(Math.max(Number(url.searchParams.get("take") || 50), 1), 100);
  const cursor = url.searchParams.get("cursor");
  const files = await db.file.findMany({ where: { ownerId: u?.id }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: take + 1, ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}) });
  const hasMore = files.length > take;
  if (hasMore) files.pop();
  return NextResponse.json({ files, nextCursor: hasMore ? files.at(-1)?.id ?? null : null });
}

export async function POST(req: Request) {
  const s = await auth();
  if (!s?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const u = await db.user.findUnique({ where: { email: s.user.email } });
  if (!u) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const quota = await getQuota(u.id, "files");
  if (!quota.allowed) return NextResponse.json({ error: "File quota exceeded", quota }, { status: 402 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "Max 10MB" }, { status: 413 });

  const name = file.name.toLowerCase();
  const allowed = name.endsWith(".pdf") || name.endsWith(".txt") || name.endsWith(".md") || name.endsWith(".docx");
  if (!allowed) return NextResponse.json({ error: "PDF, TXT, MD or DOCX only" }, { status: 400 });

  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const isPdf = bytes.length >= 5 && new TextDecoder("ascii").decode(bytes.slice(0, 5)) === "%PDF-";
  const isZip = bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
  if ((name.endsWith(".pdf") && !isPdf) || (name.endsWith(".docx") && !isZip)) {
    return NextResponse.json({ error: "File contents do not match the extension" }, { status: 400 });
  }
  // AV-scan hook: provider-side scan runs here when configured; local dev records pass.
  if (process.env.AV_SCAN_URL) {
    try {
      const res = await fetch(process.env.AV_SCAN_URL, { method: "POST", body: bytes as unknown as BodyInit });
      if (!res.ok) return NextResponse.json({ error: "File rejected by malware scan" }, { status: 400 });
    } catch {
      return NextResponse.json({ error: "Scan unavailable, try again" }, { status: 503 });
    }
  }

  const tmpId = crypto.randomUUID();
  const key = storageKeyFor(u.id, tmpId, file.name);
  await objectStorage.put(key, bytes, file.type || "application/octet-stream");

  const saved = await db.file.create({
    data: {
      ownerId: u.id,
      name: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      status: "processing",
      textContent: "",
      storageKey: key,
    },
  });

  try {
    await enqueue("file.extract", { fileId: saved.id, ownerId: u.id }, { idempotencyKey: `file.extract:${saved.id}` });
  } catch (err) {
    await db.file.update({ where: { id: saved.id }, data: { status: "failed", failureReason: "EXTRACT_FAILED" } });
    if (process.env.NODE_ENV !== "production") console.warn("file pipeline failed", err);
  }
  const final = await db.file.findUnique({ where: { id: saved.id } });

  return NextResponse.json({ file: final ?? saved }, { status: 201 });
}
