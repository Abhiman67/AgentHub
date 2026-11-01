import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { listDriveFiles } from "@/lib/integrations/drive";
import { decryptToken } from "@/lib/integrations/crypto";
import { handleApi, HttpError } from "@/lib/api";

async function driveToken(ownerId: string): Promise<string> {
  const acct = await db.integrationAccount.findUnique({ where: { ownerId_provider: { ownerId, provider: "drive" } } });
  if (!acct?.accessTokenEncrypted) throw new HttpError("DRIVE_NOT_CONNECTED", 404, "Drive not connected.");
  if (acct.expiresAt && acct.expiresAt.getTime() < Date.now()) throw new HttpError("TOKEN_EXPIRED", 401, "Token expired, reconnect");
  return decryptToken(acct.accessTokenEncrypted);
}

export const GET = handleApi(async (_, { userId: ownerId }) => {
  try {
    const files = await listDriveFiles(await driveToken(ownerId));
    return NextResponse.json({ files }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    if (e instanceof HttpError) throw e;
    throw new HttpError("DRIVE_LIST_FAILED", 502, e instanceof Error ? e.message : "Drive list failed.");
  }
});
