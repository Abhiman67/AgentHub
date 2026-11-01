import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { trackUsage } from "@/lib/usage";
import { z } from "zod";
import { handleApi, HttpError, invalid } from "@/lib/api";

const createSchema = z.object({
  agentId: z.string().min(1),
  title: z.string().max(120).optional(),
  projectId: z.string().optional(),
});

export const POST = handleApi(async (req, { userId: id }) => {
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) throw invalid("agentId required");
  const { agentId, title, projectId } = parsed.data;
  const agent = await db.agent.findFirst({ where: { id: agentId, ownerId: id } });
  if (!agent) throw new HttpError("AGENT_NOT_FOUND", 404, "Agent not found");
  if (projectId) {
    const p = await db.project.findFirst({ where: { id: projectId, ownerId: id } });
    if (!p) throw new HttpError("PROJECT_NOT_FOUND", 404, "Project not found");
  }
  const conv = await db.conversation.create({ data: { userId: id, agentId, title: title ?? "New conversation", projectId: projectId || undefined } });
  await trackUsage(id, "conversation");
  return NextResponse.json({ conversation: conv }, { status: 201 });
});
