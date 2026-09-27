import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { connectProvider, disconnectProvider } from "@/lib/integrations/accounts";
import { ADAPTERS } from "@/lib/integrations/mcp-client";

const connectSchema = z.object({
  scopes: z.array(z.string().max(80)).max(20).optional(),
  accessToken: z.string().max(2000).optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const s = await auth();
  if (!s?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const u = await db.user.findUnique({ where: { email: s.user.email } });
  if (!u) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!ADAPTERS[provider.toLowerCase()]) return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  const parsed = connectSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const acct = await connectProvider(u.id, provider, { scopes: parsed.data.scopes, accessToken: parsed.data.accessToken });
  return NextResponse.json({ account: { provider: acct.provider, scopes: JSON.parse(acct.scopes), updatedAt: acct.updatedAt } }, { status: 201 });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const s = await auth();
  if (!s?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const u = await db.user.findUnique({ where: { email: s.user.email } });
  if (!u) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await disconnectProvider(u.id, provider);
  return NextResponse.json({ ok: true });
}
