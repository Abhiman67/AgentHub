import { db } from "@/lib/db";
import { MIN_SCOPES } from "./scopes";
import { encryptToken } from "./crypto";

export async function connectProvider(ownerId: string, provider: string, opts: { scopes?: string[]; accessToken?: string; refreshToken?: string; expiresInSec?: number } = {}) {
  const p = provider.toLowerCase();
  if (!MIN_SCOPES[p]) throw new Error("Unknown provider");
  const scopes = Array.from(new Set([...MIN_SCOPES[p], ...(opts.scopes ?? [])]));
  // Mock OAuth exchange: in production this validates an OAuth code with the provider.
  const accessToken = opts.accessToken ?? `mock_${p}_${Date.now()}`;
  return db.integrationAccount.upsert({
    where: { ownerId_provider: { ownerId, provider: p } },
    create: {
      ownerId,
      provider: p,
      scopes: JSON.stringify(scopes),
      accessTokenEncrypted: encryptToken(accessToken),
      refreshTokenEncrypted: opts.refreshToken ? encryptToken(opts.refreshToken) : null,
      expiresAt: opts.expiresInSec ? new Date(Date.now() + opts.expiresInSec * 1000) : null,
    },
    update: {
      scopes: JSON.stringify(scopes),
      accessTokenEncrypted: encryptToken(accessToken),
      ...(opts.refreshToken ? { refreshTokenEncrypted: encryptToken(opts.refreshToken) } : {}),
    },
  });
}

export async function disconnectProvider(ownerId: string, provider: string) {
  await db.integrationAccount.deleteMany({ where: { ownerId, provider: provider.toLowerCase() } });
}

export async function listAccounts(ownerId: string) {
  const rows = await db.integrationAccount.findMany({ where: { ownerId }, orderBy: { provider: "asc" } });
  return rows.map((r) => ({ provider: r.provider, scopes: safeArr(r.scopes), expiresAt: r.expiresAt, updatedAt: r.updatedAt }));
}

function safeArr(raw: string): string[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

export function assertScopes(granted: string[], required: string[]) {
  for (const s of required) {
    if (!granted.includes(s)) throw new Error(`Missing scope: ${s}`);
  }
}
