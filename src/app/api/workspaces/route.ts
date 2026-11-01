import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { handleApi, invalid } from "@/lib/api";

export const GET = handleApi(async (_, { userId }) => {
  const memberships = await db.workspaceMember.findMany({ where: { userId }, include: { workspace: { select: { id: true, name: true, createdAt: true } } }, orderBy: { createdAt: "asc" } });
  return NextResponse.json({ workspaces: memberships.map((m) => ({ ...m.workspace, role: m.role })) });
});

export const POST = handleApi(async (req, { userId }) => {
  const parsed = z.object({ name: z.string().trim().min(1).max(100) }).safeParse(await req.json());
  if (!parsed.success) throw invalid("Workspace name required");
  const workspace = await db.workspace.create({ data: { name: parsed.data.name, members: { create: { userId, role: "owner" } } }, select: { id: true, name: true, createdAt: true } });
  return NextResponse.json({ workspace: { ...workspace, role: "owner" } }, { status: 201 });
});
