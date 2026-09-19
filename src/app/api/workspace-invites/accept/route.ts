import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";
const hash = (v: string) => createHash("sha256").update(v).digest("hex");

export async function POST(req: Request) {
  const session = await auth(); if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = z.object({ token: z.string().min(32).max(200) }).safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invite token required" }, { status: 400 });
  const invite = await db.workspaceInvite.findUnique({ where: { tokenHash: hash(parsed.data.token) } });
  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) return NextResponse.json({ error: "Invalid or expired invitation" }, { status: 400 });
  if (invite.email !== session.user.email.toLowerCase()) return NextResponse.json({ error: "Invitation email does not match the signed-in account" }, { status: 403 });
  const user = await db.user.findUnique({ where: { email: session.user.email.toLowerCase() }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Account not found" }, { status: 404 });
  await db.$transaction([
    db.workspaceMember.upsert({ where: { workspaceId_userId: { workspaceId: invite.workspaceId, userId: user.id } }, create: { workspaceId: invite.workspaceId, userId: user.id, role: invite.role }, update: { role: invite.role } }),
    db.workspaceInvite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } }),
  ]);
  return NextResponse.json({ ok: true, workspaceId: invite.workspaceId, role: invite.role });
}
