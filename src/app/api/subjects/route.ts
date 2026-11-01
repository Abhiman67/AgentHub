import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { handleApi, invalid } from "@/lib/api";

const createSchema = z.object({
  name: z.string().min(1).max(120),
  code: z.string().max(40).optional(),
  examDate: z.string().optional().refine((v) => !v || !Number.isNaN(Date.parse(v)), "Invalid exam date"),
  topics: z.array(z.string().min(1).max(120)).max(50).optional(),
});

export const GET = handleApi(async (req, { userId: id }) => {
  const url = new URL(req.url);
  const take = Math.min(Math.max(Number(url.searchParams.get("take") || 50), 1), 100);
  const cursor = url.searchParams.get("cursor");
  const subjects = await db.subject.findMany({
    where: { ownerId: id },
    include: { topics: { orderBy: { position: "asc" } }, _count: { select: { sessions: true } } },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    take: take + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });
  const hasMore = subjects.length > take;
  if (hasMore) subjects.pop();
  return NextResponse.json({ subjects, nextCursor: hasMore ? subjects.at(-1)?.id ?? null : null });
});

export const POST = handleApi(async (req, { userId: id }) => {
  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw invalid("Subject name is required.");
  const { name, code, examDate, topics } = parsed.data;
  const subject = await db.subject.create({
    data: {
      ownerId: id, name: name.slice(0, 120), code: code?.slice(0, 40),
      examDate: examDate ? new Date(examDate) : undefined,
      topics: topics?.length
        ? { create: topics.map((t, i) => ({ ownerId: id, name: t.slice(0, 120), position: i })) }
        : undefined,
    },
    include: { topics: { orderBy: { position: "asc" } } },
  });
  return NextResponse.json({ subject }, { status: 201 });
}, {
  rateLimit: { keyPrefix: "subject", limit: 20 },
});
