import { db } from "@/lib/db";
import { chunkText, findRelevantChunks } from "@/lib/chunking";

export type RunContextInput = {
  userId: string;
  agentId: string;
  conversationId?: string;
  projectId?: string;
  fileIds?: string[];
  currentGoal: string;
};

export type BoundedContext = {
  profile: Record<string, unknown>;
  agent: { name: string; role: string; instructions: string };
  recentMessages: { role: string; content: string }[];
  project: Record<string, unknown> | null;
  tasks: { id: string; title: string; status: string }[];
  files: { id: string; name: string }[];
  chunks: { fileId: string; fileName: string; content: string }[];
  citations: { sourceId: string; label: string }[];
};

const MAX_CONTEXT_CHARS = 3000;

export async function buildBoundedContext(input: RunContextInput): Promise<BoundedContext> {
  const [profile, agent, conversation, project] = await Promise.all([
    db.profile.findUnique({ where: { userId: input.userId } }),
    db.agent.findFirst({ where: { id: input.agentId, ownerId: input.userId }, select: { name: true, role: true, systemPrompt: true } }),
    input.conversationId
      ? db.conversation.findFirst({
          where: { id: input.conversationId, userId: input.userId },
          include: { messages: { orderBy: { createdAt: "asc" }, take: 20 } },
        })
      : Promise.resolve(null),
    input.projectId
      ? db.project.findFirst({ where: { id: input.projectId, ownerId: input.userId }, include: { tasks: { take: 10 } } })
      : Promise.resolve(null),
  ]);

  if (!agent) throw new Error("Agent not found");

  const files = await db.file.findMany({
    where: {
      ownerId: input.userId,
      status: "ready",
      ...(input.fileIds?.length ? { id: { in: input.fileIds.slice(0, 10) } } : {}),
    },
    take: 10,
  });

  const ownedFileIds = new Set(files.map((f) => f.id));
  for (const fid of input.fileIds ?? []) {
    if (!ownedFileIds.has(fid)) throw new Error("File not authorized");
  }

  const allChunks: { fileId: string; fileName: string; index: number; content: string; tokenEstimate: number }[] = [];
  for (const f of files) {
    if (!f.textContent) continue;
    for (const c of chunkText(f.textContent, 600, 100)) {
      allChunks.push({ ...c, fileId: f.id, fileName: f.name });
    }
  }
  const top = findRelevantChunks(input.currentGoal, allChunks, 5);
  const citations = Array.from(
    new Map(top.filter((c) => c.fileId && c.fileName).map((c) => [c.fileId as string, { sourceId: c.fileId as string, label: c.fileName as string }])).values()
  ).slice(0, 3);

  let used = 0;
  const chunks: BoundedContext["chunks"] = [];
  for (const c of top as { fileId: string; fileName: string; content: string }[]) {
    if (used + c.content.length > MAX_CONTEXT_CHARS) break;
    used += c.content.length;
    chunks.push({ fileId: c.fileId, fileName: c.fileName, content: c.content.slice(0, 800) });
  }

  return {
    profile: {
      institution: profile?.institution ?? null,
      degree: profile?.degree ?? null,
      careerTarget: profile?.careerTarget ?? null,
      subjects: safeJson(profile?.subjects),
    },
    agent: { name: agent.name, role: agent.role, instructions: agent.systemPrompt.slice(0, 1000) },
    recentMessages: (conversation?.messages ?? []).map((m) => ({ role: m.role, content: m.content.slice(0, 500) })),
    project: project ? { id: project.id, name: project.name, status: project.status } : null,
    tasks: (project?.tasks ?? []).map((t) => ({ id: t.id, title: t.title, status: t.status })),
    files: files.slice(0, 5).map((f) => ({ id: f.id, name: f.name })),
    chunks,
    citations,
  };
}

function safeJson(raw: string | null | undefined): unknown {
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function renderContextText(ctx: BoundedContext): string {
  const parts = [
    `Profile: ${JSON.stringify(ctx.profile).slice(0, 500)}`,
    ctx.project ? `Project: ${JSON.stringify(ctx.project)} Tasks: ${ctx.tasks.map((t) => `${t.title}[${t.status}]`).join("; ").slice(0, 500)}` : "",
    ctx.chunks.map((c) => `[${c.fileName}] ${c.content}`).join("\n").slice(0, 2000),
  ];
  return parts.filter(Boolean).join("\n").slice(0, MAX_CONTEXT_CHARS);
}
