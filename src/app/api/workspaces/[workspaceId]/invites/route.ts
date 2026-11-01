import { NextResponse } from "next/server";
import { randomBytes, createHash } from "node:crypto";
import { db } from "@/lib/db";
import { z } from "zod";
import { sendWorkspaceInviteEmail } from "@/lib/email";
import { handleApi, HttpError, invalid } from "@/lib/api";
const hash = (v: string) => createHash("sha256").update(v).digest("hex");
export const POST = handleApi<{ workspaceId: string }>(async (req, { userId }, params) => {
  const { workspaceId } = params;
  const owner = await db.workspaceMember.findUnique({ where: { workspaceId_userId: { workspaceId, userId } }, select: { role: true } });
  if (owner?.role !== "owner") throw new HttpError("FORBIDDEN", 403, "Owner access required");
  const parsed = z.object({ email: z.string().email().max(255), role: z.enum(["member", "admin"]).default("member") }).safeParse(await req.json());
  if (!parsed.success) throw invalid("Valid email required");
  const email = parsed.data.email.toLowerCase(); const token = randomBytes(32).toString("hex");
  await db.workspaceInvite.deleteMany({ where: { workspaceId, email, acceptedAt: null } });
  const workspace = await db.workspace.findUnique({ where: { id: workspaceId }, select: { name: true } });
  await db.workspaceInvite.create({ data: { workspaceId, email, role: parsed.data.role, tokenHash: hash(token), expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } });
  const sent = await sendWorkspaceInviteEmail(email, token, new URL(req.url).origin, workspace?.name ?? "Backoff workspace");
  if (!sent && process.env.NODE_ENV === "production") {
    await db.workspaceInvite.deleteMany({ where: { workspaceId, email, tokenHash: hash(token) } });
    throw new HttpError("EMAIL_NOT_CONFIGURED", 503, "Email delivery is not configured");
  }
  return NextResponse.json({ ok: true, ...(process.env.NODE_ENV !== "production" ? { devToken: token } : {}) }, { status: 201 });
});
