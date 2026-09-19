import { db } from "@/lib/db";

export async function trackUsage(ownerId: string, type: string) {
  try {
    await db.usageEvent.create({ data: { ownerId, type } });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") console.warn("usage track failed", err);
  }
}

export async function getUsage(ownerId: string) {
  const events = await db.usageEvent.groupBy({
    by: ["type"],
    where: { ownerId },
    _count: { type: true },
  });
  const conversations = await db.message.count({
    where: { conversation: { userId: ownerId } },
  });
  const files = await db.file.count({ where: { ownerId } });
  return {
    byType: Object.fromEntries(events.map((e: { type: string; _count: { type: number } }) => [e.type, e._count.type])),
    conversations,
    files,
  };
}
