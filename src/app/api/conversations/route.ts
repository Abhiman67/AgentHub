import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { trackUsage } from "@/lib/usage";
import { z } from "zod";

const createSchema = z.object({
  agentId: z.string().min(1),
  title: z.string().max(120).optional(),
  projectId: z.string().optional(),
});

export async function POST(req: Request) {
  const s = await auth();
  if (!s?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const u = await db.user.findUnique({ where: { email: s.user.email } });
  if (!u) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "agentId required" }, { status: 400 });
  const { agentId, title, projectId } = parsed.data;
  const agent = await db.agent.findFirst({ where: { id: agentId, ownerId: u.id } });
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  if (projectId) {
    const p = await db.project.findFirst({ where: { id: projectId, ownerId: u.id } });
    if (!p) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  const conv = await db.conversation.create({ data: { userId: u.id, agentId, title: title ?? "New conversation", projectId: projectId || undefined } });
  await trackUsage(u.id, "conversation");
  return NextResponse.json({ conversation: conv }, { status: 201 });
}
