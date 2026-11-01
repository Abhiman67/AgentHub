import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { handleApi, invalid } from "@/lib/api";
import { buildRecommendations } from "@/lib/recommendations";

const patchSchema = z.object({
  key: z.string().min(1).max(200),
  status: z.enum(["accepted", "dismissed"]),
  title: z.string().min(1).max(200).optional(),
  body: z.string().max(1000).optional(),
  feedback: z.enum(["incorrect"]).optional(),
  snoozeDays: z.number().int().min(1).max(30).optional(),
});

export const GET = handleApi(async (_req, { userId: id }) => {
  const now = Date.now();
  const [tasks, projects, approvals, files, agents, convCounts, overrides] = await Promise.all([
    db.task.findMany({ where: { ownerId: id }, take: 100 }),
    db.project.findMany({ where: { ownerId: id }, take: 20 }),
    db.approval.findMany({ where: { ownerId: id, status: "pending" }, take: 5 }),
    db.file.findMany({ where: { ownerId: id, status: { not: "deleted" } }, take: 20 }),
    db.agent.findMany({ where: { ownerId: id }, take: 12 }),
    db.conversation.groupBy({ by: ["agentId"], where: { userId: id }, _count: { agentId: true } }),
    db.recommendation.findMany({ where: { ownerId: id } }),
  ]);
  const candidates = buildRecommendations({
    now,
    tasks: tasks.map((t) => ({ id: t.id, title: t.title, status: t.status, dueDate: t.dueDate?.toISOString() ?? null, priority: t.priority })),
    projects: projects.map((p) => ({ id: p.id, name: p.name, targetDate: p.targetDate?.toISOString() ?? null, status: p.status })),
    approvals: approvals.map((a) => ({ id: a.id, title: a.title })),
    files: files.map((f) => ({ id: f.id, name: f.name, status: f.status })),
    agents: agents.map((a) => ({ id: a.id, name: a.name, template: a.template })),
    conversationsByAgent: Object.fromEntries(convCounts.map((c) => [c.agentId, c._count.agentId])),
  });
  const byKey = new Map(overrides.map((o) => [o.key, o]));
  const recs = candidates
    .map((c) => {
      const o = byKey.get(c.key);
      if (o && (o.status !== "pending" || (o.snoozeUntil && o.snoozeUntil.getTime() > now))) {
        return null;
      }
      return { ...c, title: o?.title ?? c.title, body: o?.body ?? c.body, status: "pending" as const };
    })
    .filter((r) => r !== null);
  return NextResponse.json({ recommendations: recs, priorities: recs.slice(0, 3) }, { headers: { "Cache-Control": "no-store" } });
});

export const PATCH = handleApi(async (req, { userId: id }) => {
  const parsed = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw invalid("Invalid recommendation update.");
  const { key, status, title, body, feedback, snoozeDays } = parsed.data;
  const existing = await db.recommendation.findUnique({ where: { ownerId_key: { ownerId: id, key } } });
  if (existing && existing.status !== "pending") throw invalid("Recommendation already decided.");
  const [kind] = key.split(":");
  const rec = await db.recommendation.upsert({
    where: { ownerId_key: { ownerId: id, key } },
    create: {
      ownerId: id, key, kind: kind ?? "custom",
      title: title ?? key, body: body ?? "", status, feedback,
      snoozeUntil: snoozeDays ? new Date(Date.now() + snoozeDays * 86400000) : undefined,
    },
    update: {
      status, feedback,
      ...(title ? { title } : {}),
      ...(body !== undefined ? { body } : {}),
      ...(snoozeDays ? { snoozeUntil: new Date(Date.now() + snoozeDays * 86400000) } : {}),
    },
  });
  return NextResponse.json({ recommendation: rec }, { headers: { "Cache-Control": "no-store" } });
});
