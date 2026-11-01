import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleApi, invalid } from "@/lib/api";

/** Unified activity feed from audit events (§5.2 recent activity). */
export const GET = handleApi(async (req, { userId: id }) => {
  const url = new URL(req.url);
  const take = Math.min(Math.max(Number(url.searchParams.get("take") || 20), 1), 50);
  const cursor = url.searchParams.get("cursor");
  if (cursor && (cursor.length < 1 || cursor.length > 64)) {
    throw invalid("Invalid pagination cursor.");
  }
  const events = await db.auditEvent.findMany({
    where: { ownerId: id },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: take + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });
  const hasMore = events.length > take;
  if (hasMore) events.pop();
  return NextResponse.json(
    { activity: events, nextCursor: hasMore ? events.at(-1)?.id ?? null : null },
    { headers: { "Cache-Control": "no-store" } }
  );
});
