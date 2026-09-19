import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { applicationCreateSchema, applicationUpdateSchema } from "@/lib/validations";

async function uid() {
  const s = await auth();
  if (!s?.user?.email) return null;
  const u = await db.user.findUnique({ where: { email: s.user.email } });
  return u?.id ?? null;
}

export async function GET(req: Request) {
  const id = await uid();
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const take = Math.min(Math.max(Number(url.searchParams.get("take") || 50), 1), 100);
  const cursor = url.searchParams.get("cursor");
  const apps = await db.application.findMany({ where: { ownerId: id }, orderBy: [{ updatedAt: "desc" }, { id: "desc" }], take: take + 1, ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}) });
  const hasMore = apps.length > take;
  if (hasMore) apps.pop();
  return NextResponse.json({ applications: apps, nextCursor: hasMore ? apps.at(-1)?.id ?? null : null });
}

export async function POST(req: Request) {
  const id = await uid();
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = applicationCreateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Company and role required" }, { status: 400 });
  const { company, role, url, status, notes } = parsed.data;
  const app = await db.application.create({
    data: { ownerId: id, company, role, url: url ?? "", status: status ?? "saved", notes: notes ?? "" },
  });
  return NextResponse.json({ application: app }, { status: 201 });
}

export async function PATCH(req: Request) {
  const id = await uid();
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = applicationUpdateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid application update" }, { status: 400 });
  const { id: appId, status, notes } = parsed.data;
  const existing = await db.application.findFirst({ where: { id: appId, ownerId: id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const app = await db.application.update({ where: { id: appId }, data: { ...(status ? { status } : {}), ...(notes !== undefined ? { notes } : {}) } });
  return NextResponse.json({ application: app });
}

export async function DELETE(req: Request) {
  const id = await uid();
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const appId = searchParams.get("id");
  if (!appId) return NextResponse.json({ error: "id required" }, { status: 400 });
  const existing = await db.application.findFirst({ where: { id: appId, ownerId: id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await db.application.delete({ where: { id: appId } });
  return NextResponse.json({ ok: true });
}
