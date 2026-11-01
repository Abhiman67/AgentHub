import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..", "app");

// Every route in docs/route-inventory.md must resolve to a real file (spec §18).
const PAGES = [
  "", "agents", "how-it-works", "pricing", "login", "signup",
  "forgot-password", "privacy", "terms", "accessibility", "status",
  "security", "onboarding", "agents",
  "app", "app/today", "app/agents", "app/agents/[agentId]", "app/projects",
  "app/projects/new", "app/projects/[projectId]", "app/tasks",
  "app/files", "app/career", "app/career/[goalId]", "app/learning",
  "app/learning/[subjectId]", "app/responsibilities", "app/notifications",
  "app/approvals", "app/usage",
  "app/settings", "app/settings/profile", "app/settings/memory",
  "app/settings/privacy", "app/settings/integrations", "app/settings/audit",
];

const API_ROUTES = [
  "api/health", "api/profile", "api/tasks", "api/projects",
  "api/projects/[projectId]", "api/files", "api/files/[id]",
  "api/agents", "api/conversations", "api/conversations/[id]",
  "api/agent-runs", "api/agent-runs/[runId]",
  "api/agent-runs/[runId]/cancel", "api/agent-runs/[runId]/resume",
  "api/agent-runs/[runId]/events", "api/approvals",
  "api/approvals/[id]/[action]", "api/usage", "api/metrics",
  "api/integrations", "api/integrations/[provider]",
  "api/integrations/drive/files", "api/integrations/drive/import",
  "api/integrations/drive/connect", "api/integrations/drive/callback",
  "api/subjects", "api/subjects/[id]", "api/recommendations",
  "api/capture", "api/activity", "api/search",
  "api/responsibilities", "api/notifications",
];

describe("route inventory smoke test", () => {
  it("every inventoried page resolves", () => {
    for (const r of PAGES) {
      expect(existsSync(join(ROOT, r, "page.tsx")), `missing page: /${r}`).toBe(true);
    }
  });
  it("every inventoried API resolves", () => {
    for (const r of API_ROUTES) {
      expect(existsSync(join(ROOT, r, "route.ts")), `missing route: /${r}`).toBe(true);
    }
  });
});
