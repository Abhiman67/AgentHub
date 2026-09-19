import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { extractDocxText, extractPdfText } from "@/lib/parser";
import { getQuota } from "@/lib/quotas";

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

  let text = "";
  let status = "ready";

  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const isPdf = bytes.length >= 5 && new TextDecoder("ascii").decode(bytes.slice(0, 5)) === "%PDF-";
    const isZip = bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
    if ((name.endsWith(".pdf") && !isPdf) || (name.endsWith(".docx") && !isZip)) {
      return NextResponse.json({ error: "File contents do not match the extension" }, { status: 400 });
    }
    if (name.endsWith(".txt") || name.endsWith(".md")) {
      text = new TextDecoder().decode(buffer).slice(0, 20000);
    } else if (name.endsWith(".docx")) {
      const extracted = await extractDocxText(buffer);
      if (!extracted) status = "failed";
      text = extracted.slice(0, 20000);
    } else if (name.endsWith(".pdf")) {
      const extracted = await extractPdfText(buffer);
      if (!extracted) status = "failed";
      text = extracted.slice(0, 20000);
    }
  } catch {
    text = "";
    status = "failed";
  }

  const saved = await db.file.create({
    data: {
      ownerId: u.id,
      name: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      status,
      textContent: text,
    },
  });

  return NextResponse.json({ file: saved }, { status: 201 });
}
