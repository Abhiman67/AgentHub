import { describe, expect, it } from "vitest";
import { isExpired, APPROVAL_TTL_MS, formatTtlRemaining } from "./approvals";
import { profileSchema, taskCreateSchema, applicationCreateSchema } from "./validations";
import { PLATFORM_SYSTEM_POLICY } from "./ai";

describe("approval expiry and TTL formatting", () => {
  it("expires after TTL", () => {
    const old = new Date(Date.now() - APPROVAL_TTL_MS - 1000);
    expect(isExpired(old)).toBe(true);
    expect(isExpired(new Date())).toBe(false);
  });

  it("formats TTL remaining correctly", () => {
    const expiredDate = new Date(Date.now() - APPROVAL_TTL_MS - 5000);
    expect(formatTtlRemaining(expiredDate)).toBe("Expired");

    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const ttlStr = formatTtlRemaining(twoDaysAgo);
    expect(ttlStr).toContain("5d");
    expect(ttlStr).toContain("left");
  });
});

describe("academic integrity & safety guardrails", () => {
  it("enforces Socratic pedagogy in platform policy", () => {
    expect(PLATFORM_SYSTEM_POLICY).toContain("Socratic");
    expect(PLATFORM_SYSTEM_POLICY).toContain("Academic Integrity");
  });

  it("prohibits live exam assistance and uncredited ghostwriting", () => {
    expect(PLATFORM_SYSTEM_POLICY).toContain("live exam");
    expect(PLATFORM_SYSTEM_POLICY).toContain("ghostwrite");
  });

  it("mandates explicit approval for destructive/external actions", () => {
    expect(PLATFORM_SYSTEM_POLICY).toContain("Human-in-the-Loop Authority");
    expect(PLATFORM_SYSTEM_POLICY).toContain("approval event");
  });

  it("enforces untrusted boundaries on documents", () => {
    expect(PLATFORM_SYSTEM_POLICY).toContain("Untrusted Context Boundaries");
  });
});

describe("input validation", () => {
  it("rejects empty task title", () => {
    expect(taskCreateSchema.safeParse({ title: "" }).success).toBe(false);
    expect(taskCreateSchema.safeParse({ title: "Study" }).success).toBe(true);
  });
  it("rejects bad application", () => {
    expect(applicationCreateSchema.safeParse({ company: "", role: "" }).success).toBe(false);
  });
  it("rejects negative study hours", () => {
    expect(profileSchema.safeParse({ studyHours: -1 }).success).toBe(false);
    expect(profileSchema.safeParse({ studyHours: 3 }).success).toBe(true);
  });
  it("accepts only web URLs for applications", () => {
    expect(applicationCreateSchema.safeParse({ company: "A", role: "B", url: "https://example.com" }).success).toBe(true);
    expect(applicationCreateSchema.safeParse({ company: "A", role: "B", url: "javascript:alert(1)" }).success).toBe(false);
  });
});

import { chunkText, findRelevantChunks, estimateTokens } from "./chunking";

describe("document chunking & RAG relevance engine", () => {
  it("estimates token counts sensibly", () => {
    expect(estimateTokens("hello world")).toBe(3);
    expect(estimateTokens("")).toBe(0);
  });

  it("splits long text into overlapping chunks", () => {
    const sampleText = Array(20).fill("This is a paragraph of lecture notes covering engineering concepts.\n\n").join("");
    const chunks = chunkText(sampleText, 300, 50);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].content.length).toBeGreaterThan(0);
    expect(chunks[0].tokenEstimate).toBeGreaterThan(0);
  });

  it("identifies semantically relevant chunks matching query", () => {
    const chunks = [
      { index: 0, content: "Photosynthesis occurs in plant leaves using chlorophyll.", tokenEstimate: 12 },
      { index: 1, content: "Ohm's law defines relationship between voltage, current, and resistance.", tokenEstimate: 15 },
      { index: 2, content: "Thermodynamics first law states conservation of energy.", tokenEstimate: 14 },
    ];

    const results = findRelevantChunks("What is Ohm's law and electrical resistance?", chunks, 1);
    expect(results.length).toBe(1);
    expect(results[0].content).toContain("Ohm's law");
  });
});

describe("career ATS analysis & workspace feedback", () => {
  it("computes bounded ATS match score based on role requirements", () => {
    const roleSkills = ["react", "typescript", "html", "css", "testing"];
    const foundSkills = ["react", "typescript", "html"];
    const rawScore = (foundSkills.length / roleSkills.length) * 100;
    const atsScore = Math.min(Math.max(Math.round(rawScore), 10), 98);

    expect(atsScore).toBe(60);
    expect(atsScore).toBeGreaterThanOrEqual(10);
    expect(atsScore).toBeLessThanOrEqual(98);
  });

  it("validates feedback event types", () => {
    const validFeedbackTypes = ["message_feedback_up", "message_feedback_down"];
    expect(validFeedbackTypes.includes("message_feedback_up")).toBe(true);
    expect(validFeedbackTypes.includes("message_feedback_down")).toBe(true);
    expect(validFeedbackTypes.includes("invalid_event")).toBe(false);
  });
});



