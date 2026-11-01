import { describe, expect, it } from "vitest";
import { runError, validateRunId } from "./api-errors";
import { stepSummarySelect, toolCallSummarySelect } from "./agents/run-views";

describe("run API error contract", () => {
  it("uses the standard shape fields via mapping", () => {
    expect(runError(new Error("Run not found"))).toMatchObject({ code: "RUN_NOT_FOUND", status: 404 });
    expect(runError(new Error("Agent not found"))).toMatchObject({ code: "AGENT_NOT_FOUND", status: 404 });
    expect(runError(new Error("Project not found"))).toMatchObject({ code: "PROJECT_NOT_FOUND", status: 404 });
    expect(runError(new Error("File not authorized"))).toMatchObject({ code: "FILE_FORBIDDEN", status: 403 });
    expect(runError(new Error("Approval still pending"))).toMatchObject({ code: "APPROVAL_PENDING", status: 409 });
    expect(runError(new Error("Run already completed."))).toMatchObject({ code: "RUN_NOT_RESUMABLE", status: 409 });
  });
  it("never leaks unknown internals", () => {
    const mapped = runError(new Error("PrismaClientKnownRequestError P2002 unique constraint failed"));
    expect(mapped.code).toBe("RUN_FAILED");
    expect(mapped.message).not.toContain("Prisma");
    expect(mapped.status).toBe(500);
  });
  it("validates run ids", () => {
    expect(validateRunId("")).toBe(false);
    expect(validateRunId("x".repeat(65))).toBe(false);
    expect(validateRunId("cm123abc")).toBe(true);
  });
});

describe("safe run views", () => {
  it("excludes raw tool input/output from step summaries", () => {
    expect(stepSummarySelect).not.toHaveProperty("input");
    expect(stepSummarySelect).not.toHaveProperty("output");
    expect(stepSummarySelect).toHaveProperty("status");
  });
  it("excludes raw input/output from tool-call summaries", () => {
    expect(toolCallSummarySelect).not.toHaveProperty("input");
    expect(toolCallSummarySelect).not.toHaveProperty("output");
    expect(toolCallSummarySelect).toHaveProperty("toolName");
  });
});
