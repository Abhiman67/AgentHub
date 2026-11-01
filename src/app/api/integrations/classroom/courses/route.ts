import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleApi, HttpError } from "@/lib/api";
import { decryptToken } from "@/lib/integrations/crypto";
import { isMockToken, listClassroomCourses } from "@/lib/integrations/classroom";

export const GET = handleApi(async (_, { userId }) => {
  const account = await db.integrationAccount.findUnique({
    where: { ownerId_provider: { ownerId: userId, provider: "classroom" } },
  });
  if (!account?.accessTokenEncrypted) {
    throw new HttpError("CLASSROOM_NOT_CONNECTED", 404, "Google Classroom is not connected.");
  }
  if (account.expiresAt && account.expiresAt.getTime() < Date.now()) {
    throw new HttpError("TOKEN_EXPIRED", 401, "Classroom access expired. Reconnect to sync courses.");
  }

  const token = decryptToken(account.accessTokenEncrypted);
  const courses = await listClassroomCourses(token);
  return NextResponse.json({ courses, demo: isMockToken(token) }, { headers: { "Cache-Control": "no-store" } });
});
