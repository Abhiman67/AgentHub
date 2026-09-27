import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

async function uid() {
  const s = await auth();
  if (!s?.user?.email) return null;
  const u = await db.user.findUnique({ where: { email: s.user.email } });
  return u?.id ?? null;
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ownerId = await uid();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const file = await db.file.findFirst({ where: { id, ownerId } });
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ file });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ownerId = await uid();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const file = await db.file.findFirst({ where: { id, ownerId } });
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (file.storageKey) {
    const { objectStorage } = await import("@/lib/storage");
    await objectStorage.del(file.storageKey);
  }
  await db.file.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
