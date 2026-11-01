import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleApi } from "@/lib/api";

/** Pause every active routine (settings + routines page). Idempotent. */
export const POST = handleApi(async (_req, { userId: id }) => {
  const result = await db.agentResponsibility.updateMany({ where: { ownerId: id, status: "active" }, data: { status: "paused" } });
  return NextResponse.json({ ok: true, paused: result.count });
});
