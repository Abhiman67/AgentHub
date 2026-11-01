import { NextResponse } from "next/server";
import { getDriveAuthUrl } from "@/lib/integrations/drive";
import { randomUUID } from "node:crypto";
import { handleApi, HttpError } from "@/lib/api";

// Step 1 of Drive OAuth: returns the Google consent URL (minimum scope).
export const GET = handleApi(async () => {
  try {
    return NextResponse.json({ authUrl: getDriveAuthUrl(randomUUID()) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    throw new HttpError("OAUTH_NOT_CONFIGURED", 501, "Google OAuth is not configured.");
  }
});
