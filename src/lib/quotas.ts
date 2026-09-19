import { db } from "@/lib/db";

// Centralized entitlement defaults. Replace the plan lookup with billing-backed
// entitlements when a payment provider is connected.
export const PLAN_LIMITS = {
  free: { messages: 100, files: 25 },
  pro: { messages: 2000, files: 500 },
} as const;

export async function getQuota(ownerId: string, kind: "messages" | "files") {
  const subscription = await db.subscription.findUnique({ where: { userId: ownerId }, select: { plan: true, status: true } });
  const plan = subscription?.status === "active" && subscription.plan === "pro" ? "pro" : "free";
  const limit = PLAN_LIMITS[plan][kind];
  const used = kind === "messages"
    ? await db.usageEvent.count({ where: { ownerId, type: "message" } })
    : await db.file.count({ where: { ownerId } });
  return { plan, used, limit, remaining: Math.max(0, limit - used), allowed: used < limit };
}
