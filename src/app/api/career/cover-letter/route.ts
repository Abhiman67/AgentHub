import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleApi, HttpError } from "@/lib/api";

export const POST = handleApi(async (req, { userId }) => {
  const { applicationId, tone } = await req.json();
  const app = await db.application.findFirst({ where: { id: applicationId, ownerId: userId } });
  if (!app) throw new HttpError("APPLICATION_NOT_FOUND", 404, "Application not found");
  const u = await db.user.findUnique({ where: { id: userId } });
  const draft = `DRAFT — review required before sending.\n\nDear ${app.company} team,\n\nI'm ${u?.name}, applying for ${app.role}. My projects and coursework map directly to this role, and I'm excited to contribute while learning fast.\n\nTone: ${tone ?? "professional and warm"}. I'd welcome the chance to discuss fit.\n\nBest,\n${u?.name}`;
  const agent = await db.agent.findFirst({ where: { ownerId: userId, template: "career-scout" }, select: { id: true } });
  if (agent) await db.approval.create({
    data: { ownerId: userId, agentId: agent.id, title: `Cover letter for ${app.role} @ ${app.company}`, description: "Draft generated. Approve to mark reviewed — nothing is sent automatically." },
  });
  return NextResponse.json({ draft });
});
