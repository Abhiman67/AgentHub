import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { approvalCreateSchema } from "@/lib/validations";
import { isExpired, expireStaleApprovals } from "@/lib/approvals";
import { getUserAuditLogs } from "@/lib/audit";

async function uid() {
  const s = await auth();
  if (!s?.user?.email) return null;
  const u = await db.user.findUnique({ where: { email: s.user.email } });
  return u?.id ?? null;
}

export async function GET(req: Request) {
  const id = await uid();
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
}

export async function POST(req: Request) {
  const id = await uid();
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = approvalCreateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { agentId, title, description } = parsed.data;
  if (agentId) {
    const agent = await db.agent.findFirst({ where: { id: agentId, ownerId: id }, select: { id: true } });
    if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }
  const a = await db.approval.create({ data: { ownerId: id, agentId: agentId ?? "general", title, description: description ?? "" } });
  return NextResponse.json({ approval: a }, { status: 201 });
}
