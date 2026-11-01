import { describe, expect, it } from "vitest";
import { deriveMastery, planRevision } from "./learning";

describe("deriveMastery (evidence-only)", () => {
  it("is unknown with no evidence", () => {
    expect(deriveMastery([])).toBe("unknown");
  });
  it("grades quiz scores into learning/practiced", () => {
    const q = (s: number) => ({ kind: "quiz", score: s, total: 100, note: "", createdAt: 1 });
    expect(deriveMastery([q(40)])).toBe("learning");
    expect(deriveMastery([q(65)])).toBe("practiced");
    expect(deriveMastery([q(90)])).toBe("practiced");
  });
  it("requires repeated strong evidence for confident", () => {
    const q = (s: number, t: number) => ({ kind: "quiz", score: s, total: 100, note: "", createdAt: t });
    expect(deriveMastery([q(90, 1), q(85, 2)])).toBe("confident");
    expect(deriveMastery([q(40, 1), q(90, 2)])).toBe("practiced");
  });
  it("honors self-review signals", () => {
    expect(deriveMastery([{ kind: "self_review", score: null, total: null, note: "still weak on joins", createdAt: 1 }])).toBe("needs_review");
    expect(deriveMastery([{ kind: "self_review", score: null, total: null, note: "feeling confident now", createdAt: 1 }])).toBe("confident");
  });
  it("marks session attendance as learning", () => {
    expect(deriveMastery([{ kind: "session", score: null, total: null, note: "", createdAt: 1 }])).toBe("learning");
  });
});

describe("planRevision", () => {
  it("orders weakest topics first across days", () => {
    const sessions = planRevision(["a", "b", "c"], { a: "confident", b: "unknown", c: "practiced" }, 2);
    expect(sessions).toHaveLength(2);
    expect(sessions[0].topicIds).toContain("b");
  });
  it("returns empty for no topics or no days", () => {
    expect(planRevision([], {}, 7)).toEqual([]);
    expect(planRevision(["a"], {}, 0)).toEqual([]);
  });
});
