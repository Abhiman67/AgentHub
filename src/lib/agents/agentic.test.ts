import { describe, expect, it } from "vitest";
import { buildPlan, validatePlan, MAX_STEPS_PER_RUN } from "./planner";
import { decidePermission } from "../tools/permissions";
import { listTools, getTool } from "../tools/registry";

describe("planner", () => {
  it("builds bounded validated plan", () => {
    const plan = buildPlan("Create revision tasks for physics");
    expect(plan.length).toBeGreaterThan(0);
    expect(plan.length).toBeLessThanOrEqual(MAX_STEPS_PER_RUN);
    expect(plan.some((s) => s.toolName === "create_task")).toBe(true);
  });
  it("rejects unknown tools", () => {
    expect(() => validatePlan([{ title: "x", description: "", kind: "tool", toolName: "rm_rf", requiresApproval: false }])).toThrow();
  });
  it("rejects oversized plans", () => {
    const big = Array.from({ length: MAX_STEPS_PER_RUN + 1 }, (_, i) => ({ title: `s${i}`, description: "", kind: "reasoning" as const, requiresApproval: false }));
    expect(() => validatePlan(big)).toThrow();
  });
});

describe("permissions", () => {
  it("allows reads, gates writes", () => {
    expect(decidePermission("read_only")).toBe("allow");
    expect(decidePermission("draft_only")).toBe("allow");
    expect(decidePermission("workspace_write")).toBe("require_approval");
    expect(decidePermission("external_write")).toBe("require_approval");
    expect(decidePermission("destructive")).toBe("require_approval");
  });
});

describe("tool registry", () => {
  it("exposes required internal tools", () => {
    const names = listTools().map((t) => t.name);
    for (const required of ["get_profile", "search_files", "create_task", "create_approval"]) {
      expect(names).toContain(required);
    }
    expect(getTool("create_task")?.risk).toBe("workspace_write");
    expect(getTool("nope")).toBeUndefined();
  });
});
