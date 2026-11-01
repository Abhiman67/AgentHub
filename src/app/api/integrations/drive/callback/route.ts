import { NextResponse } from "next/server";
import { exchangeDriveCode } from "@/lib/integrations/drive";
import { connectProvider } from "@/lib/integrations/accounts";
import { MIN_SCOPES } from "@/lib/integrations/scopes";
import { handleApi, HttpError, invalid } from "@/lib/api";

// Step 2 of Drive OAuth: exchanges the code, stores encrypted tokens.
export const GET = handleApi(async (req, { userId }) => {
  const code = new URL(req.url).searchParams.get("code");
  if (!code) throw invalid("Missing code.");
  try {
    const tokens = await exchangeDriveCode(code);
    await connectProvider(userId, "drive", {
      scopes: MIN_SCOPES.drive,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresInSec: tokens.expiresIn,
    });
  } catch {
    throw new HttpError("OAUTH_FAILED", 502, "Google OAuth failed or is not configured.");
  }
  return NextResponse.redirect(new URL("/app/settings/integrations?connected=drive", req.url));
});
