import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { projectSchema } from "@/lib/validations";

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
  const projects = await db.project.findMany({ where: { ownerId: id }, include: { tasks: { take: 100 } }, orderBy: [{ updatedAt: "desc" }, { id: "desc" }], take: take + 1, ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}) });
  const hasMore = projects.length > take;
  if (hasMore) projects.pop();
  return NextResponse.json({ projects, nextCursor: hasMore ? projects.at(-1)?.id ?? null : null });
}

export async function POST(req: Request) {
  const id = await uid();
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const parsed = projectSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Name required" }, { status: 400 });
  const { name, description, type, targetDate } = parsed.data;
  const p = await db.project.create({
    data: { ownerId: id, name, description: description ?? "", type: type ?? "major", targetDate: targetDate ? new Date(targetDate) : undefined },
  });
  return NextResponse.json({ project: p }, { status: 201 });
}
