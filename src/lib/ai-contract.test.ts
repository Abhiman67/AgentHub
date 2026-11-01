import { describe, expect, it } from "vitest";
import { mockStream, PLATFORM_SYSTEM_POLICY } from "./ai";

async function collect(system: string, message: string): Promise<string> {
  let text = "";
  for await (const e of mockStream({ system, history: [], message })) {
    if (e.type === "message_delta") text += e.text;
  }
  return text;
}

describe("agent response contract (§6.2)", () => {
  it("ends mock answers with assumptions, confidence, and next step", async () => {
    const text = await collect("You are Study Coach.", "Explain joins");
    expect(text).toContain("**Assumptions:**");
    expect(text).toContain("**Confidence:**");
    expect(text).toContain("**Next step:**");
  });
  it("requires the contract in the platform policy for real providers", () => {
    expect(PLATFORM_SYSTEM_POLICY).toContain("RESPONSE CONTRACT");
    expect(PLATFORM_SYSTEM_POLICY).toContain("Confidence:");
  });
});
