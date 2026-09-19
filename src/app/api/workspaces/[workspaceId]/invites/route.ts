import { NextResponse } from "next/server";
import { randomBytes, createHash } from "node:crypto";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { sendWorkspaceInviteEmail } from "@/lib/email";
const hash = (v: string) => createHash("sha256").update(v).digest("hex");
export async function POST(req: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  const session = await auth(); if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { workspaceId } = await params; const actor = await db.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
  const owner = actor && await db.workspaceMember.findUnique({ where: { workspaceId_userId: { workspaceId, userId: actor.id } }, select: { role: true } });
  if (!actor || owner?.role !== "owner") return NextResponse.json({ error: "Owner access required" }, { status: 403 });
  const parsed = z.object({ email: z.string().email().max(255), role: z.enum(["member", "admin"]).default("member") }).safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  const email = parsed.data.email.toLowerCase(); const token = randomBytes(32).toString("hex");
  await db.workspaceInvite.deleteMany({ where: { workspaceId, email, acceptedAt: null } });
  const workspace = await db.workspace.findUnique({ where: { id: workspaceId }, select: { name: true } });
  await db.workspaceInvite.create({ data: { workspaceId, email, role: parsed.data.role, tokenHash: hash(token), expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } });
  const sent = await sendWorkspaceInviteEmail(email, token, new URL(req.url).origin, workspace?.name ?? "AgentHub workspace");
  if (!sent && process.env.NODE_ENV === "production") {
    await db.workspaceInvite.deleteMany({ where: { workspaceId, email, tokenHash: hash(token) } });
    return NextResponse.json({ error: "Email delivery is not configured" }, { status: 503 });
  }
  return NextResponse.json({ ok: true, ...(process.env.NODE_ENV !== "production" ? { devToken: token } : {}) }, { status: 201 });
}
