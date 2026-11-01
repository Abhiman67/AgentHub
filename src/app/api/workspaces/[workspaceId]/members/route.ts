import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { handleApi, HttpError, invalid } from "@/lib/api";

async function membership(workspaceId: string, userId: string) { return db.workspaceMember.findUnique({ where: { workspaceId_userId: { workspaceId, userId } }, select: { role: true } }); }

export const GET = handleApi<{ workspaceId: string }>(async (_, { userId }, params) => {
  const { workspaceId } = params;
  if (!(await membership(workspaceId, userId))) throw new HttpError("FORBIDDEN", 403, "Forbidden");
  const members = await db.workspaceMember.findMany({ where: { workspaceId }, include: { user: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: "asc" } });
  return NextResponse.json({ members: members.map((m) => ({ ...m.user, role: m.role })) });
});

export const POST = handleApi<{ workspaceId: string }>(async (req, { userId }, params) => {
  const { workspaceId } = params;
  if ((await membership(workspaceId, userId))?.role !== "owner") throw new HttpError("FORBIDDEN", 403, "Owner access required");
  const parsed = z.object({ email: z.string().email().max(255), role: z.enum(["member", "admin"]).default("member") }).safeParse(await req.json());
  if (!parsed.success) throw invalid("Valid email required");
  const invited = await db.user.findUnique({ where: { email: parsed.data.email.toLowerCase() }, select: { id: true, name: true, email: true } });
  if (!invited) throw new HttpError("USER_NOT_FOUND", 404, "User must register before being added");
  const member = await db.workspaceMember.upsert({ where: { workspaceId_userId: { workspaceId, userId: invited.id } }, create: { workspaceId, userId: invited.id, role: parsed.data.role }, update: { role: parsed.data.role }, include: { user: { select: { id: true, name: true, email: true } } } });
  return NextResponse.json({ member: { ...member.user, role: member.role } }, { status: 201 });
});
