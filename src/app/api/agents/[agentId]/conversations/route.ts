import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleApi, notFound } from "@/lib/api";

export const GET = handleApi<{ agentId: string }>(async (req, { userId: id }, params) => {
  const { agentId } = params;
  const agent = await db.agent.findFirst({ where: { id: agentId, ownerId: id } });
  if (!agent) throw notFound("Agent");
  const url = new URL(req.url);
  const take = Math.min(Math.max(Number(url.searchParams.get("take") || 50), 1), 100);
  const cursor = url.searchParams.get("cursor");
  const conversations = await db.conversation.findMany({
    where: { userId: id, agentId },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    take: take + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    select: { id: true, title: true, projectId: true, updatedAt: true },
  });
  const hasMore = conversations.length > take;
  if (hasMore) conversations.pop();
  return NextResponse.json({ conversations, nextCursor: hasMore ? conversations.at(-1)?.id ?? null : null });
});
