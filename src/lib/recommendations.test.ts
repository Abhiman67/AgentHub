import { describe, expect, it } from "vitest";
import { buildRecommendations, type RecInput } from "./recommendations";

const NOW = new Date("2026-09-30T12:00:00Z").getTime();
const DAY = 86400000;

function base(over: Partial<RecInput> = {}): RecInput {
  return {
    now: NOW,
    tasks: [], projects: [], approvals: [], files: [],
    agents: [], conversationsByAgent: {}, ...over,
  };
}

describe("recommendations engine", () => {
  it("returns empty when nothing needs attention", () => {
    expect(buildRecommendations(base())).toEqual([]);
  });
  it("ranks approvals above overdue above due-soon", () => {
    const recs = buildRecommendations(base({
      tasks: [
        { id: "t1", title: "Soon", status: "todo", dueDate: new Date(NOW + DAY).toISOString(), priority: "medium" },
        { id: "t2", title: "Late", status: "todo", dueDate: new Date(NOW - DAY).toISOString(), priority: "high" },
      ],
      approvals: [{ id: "a1", title: "Approve draft" }],
    }));
    expect(recs.map((r) => r.kind)).toEqual(["approval_pending", "overdue", "due_soon"]);
  });
  it("ignores completed tasks and invalid dates", () => {
    const recs = buildRecommendations(base({
      tasks: [
        { id: "t1", title: "Done", status: "completed", dueDate: new Date(NOW - DAY).toISOString(), priority: "medium" },
        { id: "t2", title: "Bad date", status: "todo", dueDate: "not-a-date", priority: "medium" },
        { id: "t3", title: "No date", status: "todo", dueDate: null, priority: "medium" },
      ],
    }));
    expect(recs).toEqual([]);
  });
  it("flags project deadlines, failed files, idle agents with stable keys", () => {
    const recs = buildRecommendations(base({
      projects: [{ id: "p1", name: "Major", targetDate: new Date(NOW + 3 * DAY).toISOString(), status: "active" }],
      files: [{ id: "f1", name: "n.pdf", status: "failed" }],
      agents: [{ id: "g1", name: "Coach", template: "study-coach" }],
      conversationsByAgent: {},
    }));
    expect(recs.map((r) => r.key)).toEqual(["project_deadline:p1", "file_failed:f1", "idle_agent:g1"]);
  });
  it("skips agents with conversations and caps output at 10", () => {
    const tasks = Array.from({ length: 15 }, (_, i) => ({
      id: `t${i}`, title: `T${i}`, status: "todo",
      dueDate: new Date(NOW - DAY).toISOString(), priority: "medium",
    }));
    const recs = buildRecommendations(base({
      tasks,
      agents: [{ id: "g1", name: "Coach", template: "study-coach" }],
      conversationsByAgent: { g1: 2 },
    }));
    expect(recs.length).toBeLessThanOrEqual(10);
    expect(recs.some((r) => r.kind === "idle_agent")).toBe(false);
  });
});
