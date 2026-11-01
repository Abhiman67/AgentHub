import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { handleApi, invalid } from "@/lib/api";

export const GET = handleApi(async (req, { userId: id }) => {
  const url = new URL(req.url);
  const take = Math.min(Math.max(Number(url.searchParams.get("take") || 30), 1), 100);
  const cursor = url.searchParams.get("cursor");
  const unreadOnly = url.searchParams.get("unread") === "true";
  const notes = await db.notification.findMany({
    where: { ownerId: id, ...(unreadOnly ? { readAt: null } : {}) },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: take + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });
  const hasMore = notes.length > take;
  if (hasMore) notes.pop();
  const unread = await db.notification.count({ where: { ownerId: id, readAt: null } });
  return NextResponse.json({ notifications: notes, unread, nextCursor: hasMore ? notes.at(-1)?.id ?? null : null }, { headers: { "Cache-Control": "no-store" } });
});

const readSchema = z.object({ ids: z.array(z.string().min(1)).max(100).optional(), all: z.boolean().optional() });

export const PATCH = handleApi(async (req, { userId: id }) => {
  const parsed = readSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw invalid("Invalid update.");
  if (parsed.data.all) {
    await db.notification.updateMany({ where: { ownerId: id, readAt: null }, data: { readAt: new Date() } });
    return NextResponse.json({ ok: true });
  }
  if (!parsed.data.ids?.length) throw invalid("Provide ids or all:true.");
  await db.notification.updateMany({ where: { ownerId: id, id: { in: parsed.data.ids } }, data: { readAt: new Date() } });
  return NextResponse.json({ ok: true });
});
