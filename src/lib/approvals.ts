export const APPROVAL_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function isExpired(createdAt: Date, now = new Date()): boolean {
  return now.getTime() - createdAt.getTime() > APPROVAL_TTL_MS;
}

export function formatTtlRemaining(createdAt: Date, now = new Date()): string {
  const elapsed = now.getTime() - createdAt.getTime();
  const remaining = APPROVAL_TTL_MS - elapsed;
  if (remaining <= 0) return "Expired";
  const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
  const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  if (days > 0) return `${days}d ${hours}h left`;
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${Math.max(1, minutes)}m left`;
}

/**
 * Sweeps and marks any pending approvals older than 7 days as expired.
 * Optionally scoped to a specific user.
 */
export async function expireStaleApprovals(ownerId?: string, now = new Date()) {
  const { db } = await import("@/lib/db");
  const cutoff = new Date(now.getTime() - APPROVAL_TTL_MS);
  const where = {
    status: "pending",
    createdAt: { lte: cutoff },
    ...(ownerId ? { ownerId } : {}),
  };
  const result = await db.approval.updateMany({
    where,
    data: { status: "expired", decidedAt: now },
  });
  return result.count;
}

