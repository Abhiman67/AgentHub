import { auth } from "@/auth";
import { db } from "@/lib/db";
import { sseEncodeRun } from "@/lib/agents/types";

export async function GET(_: Request, { params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  const s = await auth();
  if (!s?.user?.email) return new Response("unauthorized", { status: 401 });
  const u = await db.user.findUnique({ where: { email: s.user.email } });
  const run = await db.agentRun.findFirst({ where: { id: runId, ownerId: u?.id }, include: { steps: { orderBy: { sequence: "asc" } } } });
  if (!run) return new Response("not found", { status: 404 });
  const stream = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder();
      controller.enqueue(enc.encode(sseEncodeRun({ type: "run_created", runId: run.id })));
      controller.enqueue(enc.encode(sseEncodeRun({ type: "plan_created", runId: run.id, stepCount: run.steps.length })));
      for (const step of run.steps) {
        if (step.status === "completed") controller.enqueue(enc.encode(sseEncodeRun({ type: "step_completed", runId: run.id, stepId: step.id })));
      }
      if (run.status === "completed") controller.enqueue(enc.encode(sseEncodeRun({ type: "run_completed", runId: run.id })));
      if (run.status === "failed") controller.enqueue(enc.encode(sseEncodeRun({ type: "run_failed", runId: run.id, message: run.errorMessage ?? "Failed" })));
      controller.close();
    },
  });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-store" } });
}
