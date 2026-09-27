import { z } from "zod";

export type ToolRisk = "read_only" | "draft_only" | "workspace_write" | "external_write" | "destructive";

export type ToolContext = {
  ownerId: string;
  agentId: string;
  runId?: string;
  stepId?: string;
};

export type AgentTool<I = unknown, O = unknown> = {
  name: string;
  description: string;
  risk: ToolRisk;
  inputSchema: z.ZodType<I>;
  execute: (input: I, ctx: ToolContext) => Promise<O>;
};
