import { describe, expect, it } from "vitest";

export const TASK_TRANSITIONS: Record<string, string[]> = {
  todo: ["in_progress", "completed", "cancelled"],
  in_progress: ["completed", "cancelled", "todo"],
  completed: ["todo"],
  cancelled: ["todo"],
};

export function canTransition(from: string, to: string): boolean {
  return TASK_TRANSITIONS[from]?.includes(to) ?? false;
}

export const FILE_TRANSITIONS: Record<string, string[]> = {
  uploading: ["processing", "failed"],
  processing: ["ready", "failed"],
  ready: ["deleted"],
  failed: ["uploading"],
  deleted: [],
};

describe("task status transitions", () => {
  it("allows todo -> in_progress -> completed", () => {
    expect(canTransition("todo", "in_progress")).toBe(true);
    expect(canTransition("in_progress", "completed")).toBe(true);
  });
  it("rejects completed -> in_progress", () => {
    expect(canTransition("completed", "in_progress")).toBe(false);
  });
});

describe("file status transitions", () => {
  it("allows uploading -> processing -> ready", () => {
    expect(FILE_TRANSITIONS["uploading"]).toContain("processing");
    expect(FILE_TRANSITIONS["processing"]).toContain("ready");
  });
});
