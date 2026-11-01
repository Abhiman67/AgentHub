import { auth } from "@/auth";
import { db } from "@/lib/db";
import { sseEncodeRun } from "@/lib/agents/types";
import { apiError, validateRunId } from "@/lib/api-errors";

export async function GET(_: Request, { params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  if (!validateRunId(runId)) return apiError("INVALID_INPUT", "Invalid run id.", 400);
  const s = await auth();
  if (!s?.user?.email) return apiError("UNAUTHORIZED", "Sign in required.", 401);
  const u = await db.user.findUnique({ where: { email: s.user.email } });
  if (!u) return apiError("USER_NOT_FOUND", "User not found.", 404);
  const run = await db.agentRun.findFirst({ where: { id: runId, ownerId: u.id }, include: { steps: { orderBy: { sequence: "asc" } } } });
  if (!run) return apiError("RUN_NOT_FOUND", "Agent run was not found.", 404);
  // Bounded snapshot: replays current progress then closes cleanly.
  // Clients poll for active runs; terminal runs resolve on first read.
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
