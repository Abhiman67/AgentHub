import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await db.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const memberships = await db.workspaceMember.findMany({ where: { userId: user.id }, include: { workspace: { select: { id: true, name: true, createdAt: true } } }, orderBy: { createdAt: "asc" } });
  return NextResponse.json({ workspaces: memberships.map((m) => ({ ...m.workspace, role: m.role })) });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await db.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const parsed = z.object({ name: z.string().trim().min(1).max(100) }).safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Workspace name required" }, { status: 400 });
  const workspace = await db.workspace.create({ data: { name: parsed.data.name, members: { create: { userId: user.id, role: "owner" } } }, select: { id: true, name: true, createdAt: true } });
  return NextResponse.json({ workspace: { ...workspace, role: "owner" } }, { status: 201 });
}
