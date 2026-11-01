import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleApi } from "@/lib/api";

export const GET = handleApi(async (req, { userId }) => {
  const url = new URL(req.url);
  const take = Math.min(Math.max(Number(url.searchParams.get("take") || 50), 1), 100);
  const cursor = url.searchParams.get("cursor");
  const events = await db.auditEvent.findMany({ where: { ownerId: userId }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: take + 1, ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}) });
  const hasMore = events.length > take;
  if (hasMore) events.pop();
  return NextResponse.json({ events, nextCursor: hasMore ? events.at(-1)?.id ?? null : null }, { headers: { "Cache-Control": "no-store" } });
});
