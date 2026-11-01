import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { AGENT_TEMPLATES } from "@/lib/agents";
import { agentCreateSchema } from "@/lib/validations";
import { handleApi, invalid } from "@/lib/api";

export const GET = handleApi(async (_req, { userId: uid }) => {
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
});

export const POST = handleApi(async (req, { userId: uid }) => {
  const body = await req.json();
  const parsed = agentCreateSchema.safeParse(body);
  if (!parsed.success) throw invalid("Invalid input");
  const { template, name, role, description, category, systemPrompt } = parsed.data;
  if (template === "custom") {
    if (!name || !role) throw invalid("Name and role required");
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
  if (!t) throw invalid("Unknown template");
  const agent = await db.agent.upsert({
    where: { ownerId_template: { ownerId: uid, template: t.template } },
    create: { ownerId: uid, template: t.template, name: t.name, role: t.role, description: t.description, icon: t.icon, category: t.category, systemPrompt: t.systemPrompt },
    update: {},
  });
  return NextResponse.json({ agent }, { status: 201 });
});
