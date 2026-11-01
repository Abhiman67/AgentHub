import { describe, expect, it } from "vitest";
import { assertApprovable, ApprovalDecisionError, APPROVAL_TTL_MS } from "./approvals";

const base = { ownerId: "u1", status: "pending", createdAt: new Date(), expiresAt: null as Date | null };

describe("assertApprovable single-use guard", () => {
  it("allows a fresh pending approval for its owner", () => {
    expect(() => assertApprovable({ ...base }, "u1")).not.toThrow();
  });
  it("rejects already-decided approvals (no replay)", () => {
    for (const status of ["approved", "denied", "expired"]) {
      try {
        assertApprovable({ ...base, status }, "u1");
        expect.unreachable();
      } catch (e) {
        expect(e).toBeInstanceOf(ApprovalDecisionError);
        expect((e as ApprovalDecisionError).code).toBe("ALREADY_DECIDED");
      }
    }
  });
  it("rejects expired approvals via TTL and explicit expiresAt", () => {
    const old = { ...base, createdAt: new Date(Date.now() - APPROVAL_TTL_MS - 1000) };
    expect(() => assertApprovable(old, "u1")).toThrowError(/expired/i);
    const explicit = { ...base, expiresAt: new Date(Date.now() - 1000) as Date | null };
    expect(() => assertApprovable(explicit, "u1")).toThrowError(/expired/i);
  });
  it("rejects cross-user decisions", () => {
    try {
      assertApprovable({ ...base }, "u2");
      expect.unreachable();
    } catch (e) {
      expect((e as ApprovalDecisionError).code).toBe("FORBIDDEN");
    }
  });
});
