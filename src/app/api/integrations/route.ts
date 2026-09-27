import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { listAccounts } from "@/lib/integrations/accounts";
import { ADAPTERS } from "@/lib/integrations/mcp-client";

export async function GET() {
  const s = await auth();
  if (!s?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const u = await db.user.findUnique({ where: { email: s.user.email } });
  if (!u) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const accounts = await listAccounts(u.id);
  const providers = await Promise.all(
    Object.values(ADAPTERS).map(async (a) => ({ provider: a.provider, capabilities: await a.listCapabilities() }))
  );
  return NextResponse.json({ accounts, providers }, { headers: { "Cache-Control": "no-store" } });
}
