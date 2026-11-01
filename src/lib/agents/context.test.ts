import { describe, expect, it } from "vitest";
import { renderContextText, type BoundedContext } from "./context";

function ctxWithChunks(n: number, size: number): BoundedContext {
  return {
    profile: { institution: "Uni" },
    agent: { name: "A", role: "r", instructions: "i" },
    recentMessages: [],
    project: null,
    tasks: [],
    files: [],
    chunks: Array.from({ length: n }, (_, i) => ({ fileId: `f${i}`, fileName: "notes.txt", content: "x".repeat(size) })),
    citations: [],
  };
}

describe("context size limits", () => {
  it("bounds rendered context text", () => {
    const text = renderContextText(ctxWithChunks(50, 2000));
    expect(text.length).toBeLessThanOrEqual(3000);
  });
  it("never includes secrets in rendered text", () => {
    const text = renderContextText(ctxWithChunks(1, 100));
    expect(text).not.toContain("passwordHash");
    expect(text).not.toContain("systemPrompt");
  });
});
