import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const s = await auth();
  if (!s?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const u = await db.user.findUnique({ where: { email: s.user.email } });
  if (!u) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { applicationId, tone } = await req.json();
  const app = await db.application.findFirst({ where: { id: applicationId, ownerId: u.id } });
  if (!app) return NextResponse.json({ error: "Application not found" }, { status: 404 });
  const draft = `DRAFT — review required before sending.\n\nDear ${app.company} team,\n\nI'm ${u.name}, applying for ${app.role}. My projects and coursework map directly to this role, and I'm excited to contribute while learning fast.\n\nTone: ${tone ?? "professional and warm"}. I'd welcome the chance to discuss fit.\n\nBest,\n${u.name}`;
  const agent = await db.agent.findFirst({ where: { ownerId: u.id, template: "career-scout" }, select: { id: true } });
  if (agent) await db.approval.create({
    data: { ownerId: u.id, agentId: agent.id, title: `Cover letter for ${app.role} @ ${app.company}`, description: "Draft generated. Approve to mark reviewed — nothing is sent automatically." },
  });
  return NextResponse.json({ draft });
}
