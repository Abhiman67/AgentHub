import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleApi, notFound } from "@/lib/api";

export const POST = handleApi<{ id: string }>(async (_req, { userId: id }, params) => {
  const r = await db.agentResponsibility.findFirst({ where: { id: params.id, ownerId: id } });
  if (!r) throw notFound("Responsibility");
  const routine = await db.agentResponsibility.update({ where: { id: params.id }, data: { status: "paused" } });
  return NextResponse.json({ responsibility: routine });
});
