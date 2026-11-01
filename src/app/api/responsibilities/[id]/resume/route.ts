import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleApi, notFound } from "@/lib/api";
import { nextRunAfter } from "@/lib/responsibilities";

export const POST = handleApi<{ id: string }>(async (_req, { userId: id }, params) => {
  const r = await db.agentResponsibility.findFirst({ where: { id: params.id, ownerId: id } });
  if (!r) throw notFound("Responsibility");
  const routine = await db.agentResponsibility.update({
    where: { id: params.id },
    data: {
      status: "active",
      ...(r.triggerType === "schedule" ? { nextRunAt: new Date(nextRunAfter(r.triggerValue, Date.now()) ?? Date.now() + 86400000) } : {}),
    },
  });
  return NextResponse.json({ responsibility: routine });
});
