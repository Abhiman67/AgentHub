import { NextResponse } from "next/server";

/** Standard error envelope (§12.2). Never includes stack traces or internals. */
export function apiError(
  code: string,
  message: string,
  status: number,
  opts: { details?: unknown; retryable?: boolean; requestId?: string } = {}
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        details: opts.details ?? {},
        requestId: opts.requestId ?? crypto.randomUUID(),
        retryable: opts.retryable ?? ((status >= 500 || status === 429)),
      },
    },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

/**
 * Maps orchestrator/domain error messages to safe API error codes.
 * Unknown errors become a generic message so internals never leak.
 */
export function runError(err: unknown): { code: string; message: string; status: number } {
  const message = err instanceof Error ? err.message : "";
  if (/Run not found|Conversation not found/i.test(message)) {
    return { code: "RUN_NOT_FOUND", message: "Agent run was not found.", status: 404 };
  }
  if (/Agent not found/i.test(message)) {
    return { code: "AGENT_NOT_FOUND", message: "Agent was not found.", status: 404 };
  }
  if (/Project not found/i.test(message)) {
    return { code: "PROJECT_NOT_FOUND", message: "Project was not found.", status: 404 };
  }
  if (/File not authorized/i.test(message)) {
    return { code: "FILE_FORBIDDEN", message: "A selected file is not accessible.", status: 403 };
  }
  if (/Empty goal|Invalid run request|Invalid input/i.test(message)) {
    return { code: "INVALID_INPUT", message: "Invalid run request.", status: 400 };
  }
  if (/Approval still pending/i.test(message)) {
    return { code: "APPROVAL_PENDING", message: "An approval must be decided before resuming.", status: 409 };
  }
  if (/already completed|was cancelled|Invalid run transition/i.test(message)) {
    return { code: "RUN_NOT_RESUMABLE", message, status: 409 };
  }
  if (process.env.NODE_ENV !== "production") {
    console.warn("run API error", message);
  }
  return { code: "RUN_FAILED", message: "Could not process the run request.", status: 500 };
}

export function validateRunId(runId: string): boolean {
  return typeof runId === "string" && runId.length >= 1 && runId.length <= 64;
}
