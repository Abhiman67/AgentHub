import { NextResponse } from "next/server";
import { z } from "zod";
import { connectProvider, disconnectProvider } from "@/lib/integrations/accounts";
import { ADAPTERS } from "@/lib/integrations/mcp-client";
import { handleApi, HttpError, invalid } from "@/lib/api";

const connectSchema = z.object({
  scopes: z.array(z.string().max(80)).max(20).optional(),
  accessToken: z.string().max(2000).optional(),
});

export const POST = handleApi<{ provider: string }>(async (req, { userId }, params) => {
  const { provider } = params;
  if (!ADAPTERS[provider.toLowerCase()]) throw new HttpError("UNKNOWN_PROVIDER", 400, "Unknown provider");
  const parsed = connectSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw invalid("Invalid input");
  const acct = await connectProvider(userId, provider, { scopes: parsed.data.scopes, accessToken: parsed.data.accessToken });
  const scopes = Array.isArray(acct.scopes) ? acct.scopes : [];
  return NextResponse.json({ account: { provider: acct.provider, scopes, updatedAt: acct.updatedAt } }, { status: 201 });
});

export const DELETE = handleApi<{ provider: string }>(async (_, { userId }, params) => {
  const { provider } = params;
  await disconnectProvider(userId, provider);
  return NextResponse.json({ ok: true });
});
