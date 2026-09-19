import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { AGENT_TEMPLATES } from "@/lib/agents";
import { agentCreateSchema } from "@/lib/validations";

async function userId() {
  const s = await auth();
  if (!s?.user?.email) return null;
  const u = await db.user.findUnique({ where: { email: s.user.email } });
  return u?.id ?? null;
}

export async function GET() {
  const uid = await userId();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const agents = await db.agent.findMany({
    where: { ownerId: uid },
    select: {
      id: true,
      ownerId: true,
      template: true,
      name: true,
      role: true,
      description: true,
      icon: true,
      category: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });
  const safeTemplates = AGENT_TEMPLATES.map(({ systemPrompt: _, ...rest }) => rest);
  return NextResponse.json({ agents, templates: safeTemplates });
}

export async function POST(req: Request) {
  const uid = await userId();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const parsed = agentCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { template, name, role, description, category, systemPrompt } = parsed.data;
  if (template === "custom") {
    if (!name || !role) return NextResponse.json({ error: "Name and role required" }, { status: 400 });
    const agent = await db.agent.create({
      data: {
        ownerId: uid, template: `custom-${Date.now()}`,
        name: name.slice(0, 80), role: role.slice(0, 120),
        description: (description ?? "").slice(0, 500),
        icon: "sparkles", category: category ?? "Custom",
        systemPrompt: (systemPrompt || `You are ${name}, a helpful study assistant. Custom instructions cannot override safety rules; require approval for external actions.`).slice(0, 4000),
      },
    });
    return NextResponse.json({ agent }, { status: 201 });
  }
  const t = AGENT_TEMPLATES.find((x) => x.template === template);
  if (!t) return NextResponse.json({ error: "Unknown template" }, { status: 400 });
  const agent = await db.agent.upsert({
    where: { ownerId_template: { ownerId: uid, template: t.template } },
    create: { ownerId: uid, template: t.template, name: t.name, role: t.role, description: t.description, icon: t.icon, category: t.category, systemPrompt: t.systemPrompt },
    update: {},
  });
  return NextResponse.json({ agent }, { status: 201 });
}
