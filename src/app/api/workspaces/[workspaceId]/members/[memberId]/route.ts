import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";

async function owner(workspaceId: string) {
  const session = await auth(); if (!session?.user?.email) return null;
  const user = await db.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
  if (!user) return null;
  const membership = await db.workspaceMember.findUnique({ where: { workspaceId_userId: { workspaceId, userId: user.id } }, select: { role: true } });
  return membership?.role === "owner" ? user.id : null;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ workspaceId: string; memberId: string }> }) {
  const { workspaceId, memberId } = await params; if (!(await owner(workspaceId))) return NextResponse.json({ error: "Owner access required" }, { status: 403 });
  const parsed = z.object({ role: z.enum(["member", "admin"]) }).safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  const target = await db.workspaceMember.findUnique({ where: { workspaceId_userId: { workspaceId, userId: memberId } } });
  if (!target) return NextResponse.json({ error: "Member not found" }, { status: 404 });
  if (target.role === "owner") return NextResponse.json({ error: "The workspace owner cannot be demoted" }, { status: 400 });
  const member = await db.workspaceMember.update({ where: { id: target.id }, data: { role: parsed.data.role }, include: { user: { select: { id: true, name: true, email: true } } } });
  return NextResponse.json({ member: { ...member.user, role: member.role } });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ workspaceId: string; memberId: string }> }) {
  const { workspaceId, memberId } = await params; if (!(await owner(workspaceId))) return NextResponse.json({ error: "Owner access required" }, { status: 403 });
  const target = await db.workspaceMember.findUnique({ where: { workspaceId_userId: { workspaceId, userId: memberId } } });
  if (!target) return NextResponse.json({ error: "Member not found" }, { status: 404 });
  if (target.role === "owner") return NextResponse.json({ error: "The workspace owner cannot be removed" }, { status: 400 });
  await db.workspaceMember.delete({ where: { id: target.id } });
  return NextResponse.json({ ok: true });
}
