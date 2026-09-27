import { PrismaClient } from "@prisma/client";
import { AGENT_TEMPLATES } from "../src/lib/agents";

const db = new PrismaClient();

async function main() {
  for (const t of AGENT_TEMPLATES) {
    // Global template agents use a stable ownerId so @@unique([ownerId, template]) seeds once.
    await db.agent.upsert({
      where: { ownerId_template: { ownerId: "system", template: t.template } },
      create: { ownerId: "system", template: t.template, name: t.name, role: t.role, description: t.description, icon: t.icon, category: t.category, systemPrompt: t.systemPrompt },
      update: { name: t.name, role: t.role, description: t.description, systemPrompt: t.systemPrompt },
    });
  }
  console.log(`seeded ${AGENT_TEMPLATES.length} agents`);
}

main().finally(() => db.$disconnect());
