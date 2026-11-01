import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { handleApi, HttpError, invalid } from "@/lib/api";

async function owner(workspaceId: string, userId: string) {
  const membership = await db.workspaceMember.findUnique({ where: { workspaceId_userId: { workspaceId, userId } }, select: { role: true } });
  return membership?.role === "owner" ? userId : null;
}

export const PATCH = handleApi<{ workspaceId: string; memberId: string }>(async (req, { userId }, params) => {
  const { workspaceId, memberId } = params; if (!(await owner(workspaceId, userId))) throw new HttpError("FORBIDDEN", 403, "Owner access required");
  const parsed = z.object({ role: z.enum(["member", "admin"]) }).safeParse(await req.json());
  if (!parsed.success) throw invalid("Invalid role");
  const target = await db.workspaceMember.findUnique({ where: { workspaceId_userId: { workspaceId, userId: memberId } } });
  if (!target) throw new HttpError("MEMBER_NOT_FOUND", 404, "Member not found");
  if (target.role === "owner") throw invalid("The workspace owner cannot be demoted");
  const member = await db.workspaceMember.update({ where: { id: target.id }, data: { role: parsed.data.role }, include: { user: { select: { id: true, name: true, email: true } } } });
  return NextResponse.json({ member: { ...member.user, role: member.role } });
});

export const DELETE = handleApi<{ workspaceId: string; memberId: string }>(async (_, { userId }, params) => {
  const { workspaceId, memberId } = params; if (!(await owner(workspaceId, userId))) throw new HttpError("FORBIDDEN", 403, "Owner access required");
  const target = await db.workspaceMember.findUnique({ where: { workspaceId_userId: { workspaceId, userId: memberId } } });
  if (!target) throw new HttpError("MEMBER_NOT_FOUND", 404, "Member not found");
  if (target.role === "owner") throw invalid("The workspace owner cannot be removed");
  await db.workspaceMember.delete({ where: { id: target.id } });
  return NextResponse.json({ ok: true });
});
