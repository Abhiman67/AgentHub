import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import { z } from "zod";
import { handleApi, HttpError, invalid } from "@/lib/api";
const hash = (v: string) => createHash("sha256").update(v).digest("hex");

export const POST = handleApi(async (req, { userId }) => {
  const parsed = z.object({ token: z.string().min(32).max(200) }).safeParse(await req.json());
  if (!parsed.success) throw invalid("Invite token required");
  const invite = await db.workspaceInvite.findUnique({ where: { tokenHash: hash(parsed.data.token) } });
  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) throw new HttpError("INVITE_INVALID", 400, "Invalid or expired invitation");
  const user = await db.user.findUnique({ where: { id: userId }, select: { id: true, email: true } });
  if (invite.email !== user?.email?.toLowerCase()) throw new HttpError("FORBIDDEN", 403, "Invitation email does not match the signed-in account");
  if (!user) throw new HttpError("USER_NOT_FOUND", 404, "Account not found");
  await db.$transaction([
    db.workspaceMember.upsert({ where: { workspaceId_userId: { workspaceId: invite.workspaceId, userId: user.id } }, create: { workspaceId: invite.workspaceId, userId: user.id, role: invite.role }, update: { role: invite.role } }),
    db.workspaceInvite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } }),
  ]);
  return NextResponse.json({ ok: true, workspaceId: invite.workspaceId, role: invite.role });
});
