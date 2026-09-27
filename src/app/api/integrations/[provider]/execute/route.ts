import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ADAPTERS } from "@/lib/integrations/mcp-client";

const bodySchema = z.object({
  capability: z.string().min(1).max(80),
  input: z.record(z.string(), z.unknown()).default({}),
  approvalId: z.string().min(1).optional(),
  requiresExternalWrite: z.boolean().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const s = await auth();
  if (!s?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const u = await db.user.findUnique({ where: { email: s.user.email } });
  if (!u) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const adapter = ADAPTERS[provider.toLowerCase()];
  if (!adapter) return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  if (parsed.data.requiresExternalWrite && parsed.data.approvalId) {
    const ap = await db.approval.findFirst({ where: { id: parsed.data.approvalId, ownerId: u.id, status: "approved" } });
    if (!ap) return NextResponse.json({ error: "Valid approved approval required" }, { status: 403 });
  }
  const result = await adapter.execute(
    { capability: parsed.data.capability, input: parsed.data.input, requiresExternalWrite: parsed.data.requiresExternalWrite },
    { ownerId: u.id, approvalId: parsed.data.approvalId }
  );
  if (!result.ok) return NextResponse.json({ error: result.error ?? "Integration failed" }, { status: 400 });
  return NextResponse.json({ result: result.data });
}
