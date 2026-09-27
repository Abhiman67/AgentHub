import { TOOL_MAP } from "./internal";
import type { AgentTool } from "./types";

export function getTool(name: string): AgentTool<unknown, unknown> | undefined {
  return TOOL_MAP.get(name) as AgentTool<unknown, unknown> | undefined;
}

export function listTools(): { name: string; description: string; risk: string }[] {
  return [...TOOL_MAP.values()].map((t) => ({ name: t.name, description: t.description, risk: t.risk }));
}

export function assertKnownTool(name: string): void {
  if (!TOOL_MAP.has(name)) throw new Error(`Unknown tool: ${name}`);
}
