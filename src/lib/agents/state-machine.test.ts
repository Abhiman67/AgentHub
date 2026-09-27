import { describe, expect, it } from "vitest";
import { canTransitionRun, assertRunTransition, RUN_TRANSITIONS } from "./state-machine";

describe("run state machine", () => {
  it("allows queued -> planning", () => {
    expect(canTransitionRun("queued", "planning")).toBe(true);
  });
  it("allows full happy path", () => {
    expect(canTransitionRun("planning", "running")).toBe(true);
    expect(canTransitionRun("running", "awaiting_approval")).toBe(true);
    expect(canTransitionRun("awaiting_approval", "running")).toBe(true);
    expect(canTransitionRun("running", "completed")).toBe(true);
  });
  it("allows pause/resume and cancel", () => {
    expect(canTransitionRun("running", "paused")).toBe(true);
    expect(canTransitionRun("paused", "running")).toBe(true);
    expect(canTransitionRun("running", "cancelled")).toBe(true);
    expect(canTransitionRun("awaiting_approval", "cancelled")).toBe(true);
    expect(canTransitionRun("paused", "cancelled")).toBe(true);
  });
  it("allows retry from failed", () => {
    expect(canTransitionRun("failed", "queued")).toBe(true);
  });
  it("rejects invalid transitions", () => {
    expect(canTransitionRun("queued", "completed")).toBe(false);
    expect(canTransitionRun("completed", "running")).toBe(false);
    expect(canTransitionRun("cancelled", "running")).toBe(false);
    expect(() => assertRunTransition("queued", "completed")).toThrow();
  });
  it("covers every valid transition without throw", () => {
    for (const [from, tos] of Object.entries(RUN_TRANSITIONS)) {
      for (const to of tos) {
        expect(() => assertRunTransition(from as never, to as never)).not.toThrow();
      }
    }
  });
});
