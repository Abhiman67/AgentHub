import type { AgentEvent } from "./types";

export function describeEvent(e: AgentEvent): string {
  switch (e.type) {
    case "run_created":
      return `Run ${e.runId} created`;
    case "plan_created":
      return `Plan with ${e.stepCount} steps`;
    case "step_started":
      return `Started: ${e.title}`;
    case "step_completed":
      return `Step done`;
    case "tool_started":
      return `Tool ${e.toolName} started`;
    case "tool_completed":
      return `Tool ${e.toolName} done`;
    case "approval_required":
      return `Approval needed`;
    case "run_completed":
      return `Run completed`;
    case "run_failed":
      return `Failed: ${e.message}`;
    default:
      return e.type;
  }
}
