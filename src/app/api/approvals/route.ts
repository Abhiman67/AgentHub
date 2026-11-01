import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { approvalCreateSchema } from "@/lib/validations";
import { expireStaleApprovals } from "@/lib/approvals";
import { getUserAuditLogs } from "@/lib/audit";
import { handleApi, HttpError, invalid } from "@/lib/api";

export const GET = handleApi(async (req, { userId: id }) => {
  // 1. Automatically sweep stale approvals older than 7 days
  await expireStaleApprovals(id);

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status");
  const includeAudit = searchParams.get("includeAudit") === "true";
  const take = Math.min(Math.max(Number(searchParams.get("take") || 50), 1), 100);
  const cursor = searchParams.get("cursor");

  const statusFilter =
    statusParam && ["pending", "approved", "denied", "expired"].includes(statusParam)
      ? statusParam
      : undefined;

  const where = {
    ownerId: id,
    ...(statusFilter ? { status: statusFilter } : {}),
  };

  const [approvals, allStatusCounts, auditLogs] = await Promise.all([
    db.approval.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: take + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    }),
    db.approval.groupBy({
      by: ["status"],
      where: { ownerId: id },
      _count: { id: true },
    }),
    includeAudit ? getUserAuditLogs(id, 25) : Promise.resolve([]),
  ]);

  const hasMore = approvals.length > take;
  if (hasMore) approvals.pop();

  const stats = {
    pending: 0,
    approved: 0,
    denied: 0,
    expired: 0,
    total: 0,
  };

  for (const item of allStatusCounts) {
    if (item.status in stats) {
      stats[item.status as keyof typeof stats] = item._count.id;
    }
    stats.total += item._count.id;
  }

  return NextResponse.json({
    approvals,
    nextCursor: hasMore ? approvals.at(-1)?.id ?? null : null,
    stats,
    auditLogs,
  });
});

export const POST = handleApi(async (req, { userId: id }) => {
  const parsed = approvalCreateSchema.safeParse(await req.json());
  if (!parsed.success) throw invalid("Invalid input");
  const { agentId, title, description } = parsed.data;
  if (agentId) {
    const agent = await db.agent.findFirst({ where: { id: agentId, ownerId: id }, select: { id: true } });
    if (!agent) throw new HttpError("AGENT_NOT_FOUND", 404, "Agent not found");
  }
  const a = await db.approval.create({ data: { ownerId: id, agentId: agentId ?? "general", title, description: description ?? "" } });
  return NextResponse.json({ approval: a }, { status: 201 });
});
