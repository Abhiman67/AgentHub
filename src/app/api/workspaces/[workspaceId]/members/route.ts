import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";

async function actor(email: string) { return db.user.findUnique({ where: { email }, select: { id: true } }); }
async function membership(workspaceId: string, userId: string) { return db.workspaceMember.findUnique({ where: { workspaceId_userId: { workspaceId, userId } }, select: { role: true } }); }

export async function GET(_: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  const session = await auth(); if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await actor(session.user.email); const { workspaceId } = await params;
  if (!user || !(await membership(workspaceId, user.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const members = await db.workspaceMember.findMany({ where: { workspaceId }, include: { user: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: "asc" } });
  return NextResponse.json({ members: members.map((m) => ({ ...m.user, role: m.role })) });
}

export async function POST(req: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  const session = await auth(); if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await actor(session.user.email); const { workspaceId } = await params;
  if (!user || (await membership(workspaceId, user.id))?.role !== "owner") return NextResponse.json({ error: "Owner access required" }, { status: 403 });
  const parsed = z.object({ email: z.string().email().max(255), role: z.enum(["member", "admin"]).default("member") }).safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  const invited = await db.user.findUnique({ where: { email: parsed.data.email.toLowerCase() }, select: { id: true, name: true, email: true } });
  if (!invited) return NextResponse.json({ error: "User must register before being added" }, { status: 404 });
  const member = await db.workspaceMember.upsert({ where: { workspaceId_userId: { workspaceId, userId: invited.id } }, create: { workspaceId, userId: invited.id, role: parsed.data.role }, update: { role: parsed.data.role }, include: { user: { select: { id: true, name: true, email: true } } } });
  return NextResponse.json({ member: { ...member.user, role: member.role } }, { status: 201 });
}
