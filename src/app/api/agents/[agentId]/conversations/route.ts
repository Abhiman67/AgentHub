import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

async function uid() {
  const s = await auth();
  if (!s?.user?.email) return null;
  const u = await db.user.findUnique({ where: { email: s.user.email } });
  return u?.id ?? null;
}

export async function GET(req: Request, { params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = await params;
  const id = await uid();
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const agent = await db.agent.findFirst({ where: { id: agentId, ownerId: id } });
  if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 });
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
}
