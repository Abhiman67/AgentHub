import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { handleApi, invalid } from "@/lib/api";

const createSchema = z.object({
  title: z.string().min(1).max(160),
  targetRole: z.string().max(160).optional(),
  deadline: z.string().optional().refine((v) => !v || !Number.isNaN(Date.parse(v)), "Invalid deadline"),
  notes: z.string().max(2000).optional(),
});

export const GET = handleApi(async (req, { userId: id }) => {
  const url = new URL(req.url);
  const take = Math.min(Math.max(Number(url.searchParams.get("take") || 50), 1), 100);
  const cursor = url.searchParams.get("cursor");
  const goals = await db.careerGoal.findMany({
    where: { ownerId: id },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    take: take + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });
  const hasMore = goals.length > take;
  if (hasMore) goals.pop();
  return NextResponse.json({ goals, nextCursor: hasMore ? goals.at(-1)?.id ?? null : null });
});

export const POST = handleApi(async (req, { userId: id }) => {
  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw invalid("Goal title is required.");
  const goal = await db.careerGoal.create({
    data: {
      ownerId: id, title: parsed.data.title.slice(0, 160),
      targetRole: parsed.data.targetRole?.slice(0, 160) ?? "",
      deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : undefined,
      notes: parsed.data.notes?.slice(0, 2000) ?? "",
    },
  });
  return NextResponse.json({ goal }, { status: 201 });
});
