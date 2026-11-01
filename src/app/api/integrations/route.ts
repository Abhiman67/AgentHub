import { NextResponse } from "next/server";
import { listAccounts } from "@/lib/integrations/accounts";
import { ADAPTERS } from "@/lib/integrations/mcp-client";
import { handleApi } from "@/lib/api";

export const GET = handleApi(async (_, { userId }) => {
  const accounts = await listAccounts(userId);
  const providers = await Promise.all(
    Object.values(ADAPTERS).map(async (a) => ({ provider: a.provider, capabilities: await a.listCapabilities() }))
  );
  return NextResponse.json({ accounts, providers }, { headers: { "Cache-Control": "no-store" } });
});
