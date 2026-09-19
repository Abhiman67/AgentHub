import { db } from "@/lib/db";

export type AuditAction =
  | "approval_approve"
  | "approval_deny"
  | "approval_expire"
  | "task_create"
  | "file_delete"
  | "profile_update"
  | "academic_policy_check";

export async function audit(ownerId: string | null, action: AuditAction | string, metadata: Record<string, unknown> = {}) {
  try {
    await db.auditEvent.create({ data: { ownerId, action, metadata: JSON.stringify(metadata).slice(0, 4000) } });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn("audit event failed", error);
  }
}

export async function getUserAuditLogs(ownerId: string, take = 50) {
  return db.auditEvent.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(take, 1), 100),
  });
}

