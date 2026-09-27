import { z } from "zod";
import type { PlanStep } from "./types";

export const MAX_STEPS_PER_RUN = 8;
export const MAX_TOOL_CALLS_PER_STEP = 1;

const planStepSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(1000).default(""),
  kind: z.enum(["reasoning", "retrieval", "tool", "draft", "approval"]),
  toolName: z.string().max(60).optional(),
  requiresApproval: z.boolean().default(false),
  input: z.record(z.string(), z.unknown()).optional(),
});

const planSchema = z.array(planStepSchema).min(1).max(MAX_STEPS_PER_RUN);

const KNOWN_TOOLS = new Set([
  "get_profile",
  "search_files",
  "get_file_metadata",
  "get_project",
  "get_project_tasks",
  "create_task",
  "update_task",
  "create_project",
  "update_project",
  "attach_file_to_project",
  "create_draft",
  "create_approval",
]);

function templateForGoal(goal: string): PlanStep[] {
  const g = goal.toLowerCase();
  if (/task|todo|plan|remind|schedule|study plan/.test(g)) {
    return [
      { title: "Understand goal", description: "Parse the student goal and constraints.", kind: "reasoning", requiresApproval: false },
      { title: "Gather context", description: "Load profile, project and file context.", kind: "retrieval", requiresApproval: false },
      {
        title: "Draft task",
        description: "Prepare a task draft for approval.",
        kind: "tool",
        toolName: "create_task",
        requiresApproval: true,
        input: { title: goal.slice(0, 120) },
      },
    ];
  }
  if (/project|milestone|scope|hackathon/.test(g)) {
    return [
      { title: "Understand scope", description: "Clarify project scope.", kind: "reasoning", requiresApproval: false },
      { title: "Load project", description: "Read linked project and tasks.", kind: "retrieval", requiresApproval: false },
      {
        title: "Propose task",
        description: "Create next milestone task.",
        kind: "tool",
        toolName: "create_task",
        requiresApproval: true,
        input: { title: goal.slice(0, 120) },
      },
    ];
  }
  return [
    { title: "Understand request", description: "Break down the goal.", kind: "reasoning", requiresApproval: false },
    { title: "Retrieve context", description: "Load relevant workspace context.", kind: "retrieval", requiresApproval: false },
    {
      title: "Propose next action",
      description: "Draft a concrete next step.",
      kind: "tool",
      toolName: "create_task",
      requiresApproval: true,
      input: { title: goal.slice(0, 120) },
    },
  ];
}

export function buildPlan(goal: string): PlanStep[] {
  const steps = templateForGoal(goal).slice(0, MAX_STEPS_PER_RUN);
  const parsed = planSchema.parse(steps);
  for (const s of parsed) {
    if (s.kind === "tool") {
      if (!s.toolName || !KNOWN_TOOLS.has(s.toolName)) {
        throw new Error(`Unknown tool: ${s.toolName}`);
      }
    }
  }
  return parsed;
}

export function validatePlan(input: unknown): PlanStep[] {
  const parsed = planSchema.parse(input);
  for (const s of parsed) {
    if (s.kind === "tool" && (!s.toolName || !KNOWN_TOOLS.has(s.toolName))) {
      throw new Error(`Unknown tool: ${s.toolName}`);
    }
  }
  return parsed;
}
