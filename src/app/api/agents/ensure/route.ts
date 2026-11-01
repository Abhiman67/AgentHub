import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { AGENT_TEMPLATES } from "@/lib/agents";
import { handleApi } from "@/lib/api";

const GOAL_MAP: Record<string, string[]> = {
  "Improve grades": ["study-coach"],
  "Complete major project": ["project-guide", "code-mentor"],
  "Find internship": ["career-scout"],
  "Prepare for placements": ["career-scout", "interview-coach"],
  "Improve coding": ["code-mentor", "project-guide"],
  "Improve communication": ["writing-buddy"],
};

export const POST = handleApi(async (req, { userId }) => {
  let goals: string[] = [];
  try {
    const body = await req.json();
    if (Array.isArray(body?.goals)) goals = body.goals;
  } catch {}
  let wanted = goals.flatMap((g) => GOAL_MAP[g] ?? []);
  if (wanted.length === 0) wanted = ["study-coach", "project-guide", "career-scout"];
  wanted = [...new Set(wanted)].slice(0, 4);
  const existing = await db.agent.findMany({ where: { ownerId: userId }, select: { template: true } });
  const have = new Set(existing.map((e) => e.template));
  const missing = AGENT_TEMPLATES.filter((t) => wanted.includes(t.template) && !have.has(t.template));
  if (missing.length > 0) {
    await db.agent.createMany({
      data: missing.map((t) => ({
        ownerId: userId, template: t.template, name: t.name, role: t.role,
        description: t.description, icon: t.icon, category: t.category, systemPrompt: t.systemPrompt,
      })),
    });
  }
  return NextResponse.json({ ok: true, activated: wanted });
});
