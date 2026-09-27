import { registerHandler } from "./queue";
import { db } from "@/lib/db";
import { chunkText, formatForPgvector } from "@/lib/chunking";
import { extractDocxText, extractPdfText } from "@/lib/parser";
import { objectStorage } from "@/lib/storage";
import { logError, logInfo } from "@/lib/observability/logger";

function failReason(code: string) {
  return code;
}

registerHandler("usage.aggregate", async () => {
  await db.usageEvent.count();
});

// file.extract: read bytes from object storage, extract text, then chain chunk.
registerHandler("file.extract", async (job) => {
  const { fileId, ownerId } = job.payload as { fileId: string; ownerId: string };
  const file = await db.file.findFirst({ where: { id: fileId, ownerId } });
  if (!file) throw new Error("File not found");
  try {
    await db.file.update({ where: { id: fileId }, data: { status: "processing" } });
    let bytes: Uint8Array | null = null;
    if (file.storageKey) bytes = await objectStorage.get(file.storageKey);
    // Fallback to inline textContent for rows created before the storage path.
    let text = file.textContent || "";
    if (bytes && bytes.length > 0) {
      const name = file.name.toLowerCase();
      if (name.endsWith(".txt") || name.endsWith(".md")) {
        text = new TextDecoder().decode(bytes).slice(0, 20000);
      } else if (name.endsWith(".docx")) {
        text = (await extractDocxText(bytes.buffer as ArrayBuffer)).slice(0, 20000);
      } else if (name.endsWith(".pdf")) {
        text = (await extractPdfText(bytes.buffer as ArrayBuffer)).slice(0, 20000);
      }
    }
    if (!text.trim()) {
      await db.file.update({ where: { id: fileId }, data: { status: "failed", failureReason: failReason("EMPTY_TEXT") } });
      return;
    }
    await db.file.update({ where: { id: fileId }, data: { textContent: text } });
    const { enqueue } = await import("./queue");
    await enqueue("file.chunk", { fileId, ownerId }, { idempotencyKey: `file.chunk:${fileId}` });
  } catch (err) {
    logError("file.extract.failed", { fileId });
    await db.file.update({ where: { id: fileId }, data: { status: "failed", failureReason: failReason("EXTRACT_FAILED") } });
    throw err;
  }
});

// file.chunk: split text into bounded chunks, replace FileChunk rows, chain embed.
registerHandler("file.chunk", async (job) => {
  const { fileId, ownerId } = job.payload as { fileId: string; ownerId: string };
  const file = await db.file.findFirst({ where: { id: fileId, ownerId } });
  if (!file) throw new Error("File not found");
  const chunks = chunkText(file.textContent || "", 800, 120).slice(0, 50);
  if (!chunks.length) {
    await db.file.update({ where: { id: fileId }, data: { status: "failed", failureReason: failReason("EMPTY_TEXT") } });
    return;
  }
  await db.fileChunk.deleteMany({ where: { fileId } });
  for (const c of chunks) {
    await db.fileChunk.create({ data: { fileId, ownerId, index: c.index, content: c.content.slice(0, 4000) } });
  }
  logInfo("file.chunked", { fileId, chunks: chunks.length });
  const { enqueue } = await import("./queue");
  await enqueue("file.embed", { fileId, ownerId }, { idempotencyKey: `file.embed:${fileId}` });
});

// file.embed: deterministic local embedding stub; validates pgvector payload, marks ready.
registerHandler("file.embed", async (job) => {
  const { fileId, ownerId } = job.payload as { fileId: string; ownerId: string };
  const chunks = await db.fileChunk.findMany({ where: { fileId, ownerId }, orderBy: { index: "asc" }, take: 50 });
  if (!chunks.length) {
    await db.file.update({ where: { id: fileId }, data: { status: "failed", failureReason: failReason("NO_CHUNKS") } });
    return;
  }
  for (const c of chunks) {
    const embedding = pseudoEmbedding(c.content);
    formatForPgvector({ index: c.index, content: c.content, tokenEstimate: c.content.length / 4 }, embedding);
  }
  await db.file.update({ where: { id: fileId }, data: { status: "ready", failureReason: null } });
  logInfo("file.ready", { fileId, chunks: chunks.length });
});

export function pseudoEmbedding(text: string, dims = 16): number[] {
  const out = new Array<number>(dims).fill(0);
  for (let i = 0; i < text.length; i++) out[i % dims] += text.charCodeAt(i) % 97;
  const norm = Math.sqrt(out.reduce((a, b) => a + b * b, 0)) || 1;
  return out.map((v) => Number((v / norm).toFixed(6)));
}

registerHandler("agent.run", async (job) => {
  const { executeRun } = await import("@/lib/agents/orchestrator");
  const { runId, ownerId } = job.payload as { runId: string; ownerId: string };
  if (!runId || !ownerId) throw new Error("Invalid agent.run payload");
  await executeRun(runId, ownerId);
});

registerHandler("agent.resume", async (job) => {
  const { resumeRun } = await import("@/lib/agents/orchestrator");
  const { runId, ownerId } = job.payload as { runId: string; ownerId: string };
  await resumeRun(runId, ownerId);
});

registerHandler("agent.retry", async (job) => {
  const { resumeRun } = await import("@/lib/agents/orchestrator");
  const { runId, ownerId } = job.payload as { runId: string; ownerId: string };
  await resumeRun(runId, ownerId);
});

export {};
