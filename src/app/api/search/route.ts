import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleApi, invalid } from "@/lib/api";

/**
 * Workspace search (spec §8/§12): tasks, projects, subjects, goals, and
 * ready files by substring match. Owner-scoped, bounded, no vector index
 * required (pgvector path documented separately).
 */
export const GET = handleApi(async (req, { userId: id }) => {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2 || q.length > 200) throw invalid("Search query must be 2–200 characters.");
  const like = { contains: q };
  const [tasks, projects, subjects, goals, files] = await Promise.all([
    db.task.findMany({ where: { ownerId: id, title: like }, select: { id: true, title: true, status: true }, take: 10 }),
    db.project.findMany({ where: { ownerId: id, name: like }, select: { id: true, name: true, status: true }, take: 10 }),
    db.subject.findMany({ where: { ownerId: id, name: like }, select: { id: true, name: true }, take: 10 }),
    db.careerGoal.findMany({ where: { ownerId: id, title: like }, select: { id: true, title: true, status: true }, take: 10 }),
    db.file.findMany({ where: { ownerId: id, status: { not: "deleted" }, name: like }, select: { id: true, name: true, status: true }, take: 10 }),
  ]);
  return NextResponse.json({ tasks, projects, subjects, goals, files }, { headers: { "Cache-Control": "no-store" } });
});
