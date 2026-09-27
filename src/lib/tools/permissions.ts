import type { ToolRisk } from "./types";

export type PermissionDecision = "allow" | "require_approval" | "deny";

export function decidePermission(risk: ToolRisk): PermissionDecision {
  switch (risk) {
    case "read_only":
    case "draft_only":
      return "allow";
    case "workspace_write":
    case "external_write":
    case "destructive":
      return "require_approval";
    default:
      return "deny";
  }
}

export function requiresApproval(risk: ToolRisk): boolean {
  return decidePermission(risk) === "require_approval";
}
