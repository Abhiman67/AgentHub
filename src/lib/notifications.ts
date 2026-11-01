import { db } from "@/lib/db";

export type NotifyInput = {
  kind: string;
  title: string;
  body?: string;
  link?: string;
  /** Grouping key: repeat notifications with the same key update the one
   *  unread row instead of spamming. Pass null for one-off notifications. */
  groupedKey?: string | null;
};

const MAX_PER_KIND_PER_DAY = 5;

/**
 * Grouped, rate-limited notifications (spec §7: grouped + rate limited).
 * Returns the notification row, or null when dropped by the rate cap.
 */
export async function notify(ownerId: string, input: NotifyInput) {
  const since = new Date(Date.now() - 24 * 3600000);
  const todayCount = await db.notification.count({
    where: { ownerId, kind: input.kind, createdAt: { gte: since } },
  });
  if (todayCount >= MAX_PER_KIND_PER_DAY) {
    const { logInfo } = await import("@/lib/observability/logger");
    logInfo("notification.rate_limited", { ownerId, kind: input.kind });
    return null;
  }
  if (input.groupedKey) {
    const existing = await db.notification.findFirst({
      where: { ownerId, groupedKey: input.groupedKey, readAt: null },
      orderBy: { createdAt: "desc" },
    });
    if (existing) {
      return db.notification.update({
        where: { id: existing.id },
        data: { title: input.title.slice(0, 200), body: (input.body ?? "").slice(0, 1000), link: input.link ?? "", createdAt: new Date() },
      });
    }
  }
  return db.notification.create({
    data: {
      ownerId, kind: input.kind,
      title: input.title.slice(0, 200), body: (input.body ?? "").slice(0, 1000),
      link: input.link ?? "", groupedKey: input.groupedKey ?? null,
    },
  });
}
