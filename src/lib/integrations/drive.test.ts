import { describe, expect, it } from "vitest";
import { downloadDriveFile, getDriveAuthUrl, listDriveFiles, mockDriveFiles } from "./drive";

describe("drive read-only integration (Milestone 8)", () => {
  it("requires OAuth configuration for the consent URL", () => {
    delete process.env.GOOGLE_CLIENT_ID;
    expect(() => getDriveAuthUrl("state")).toThrow("not configured");
  });
  it("lists mock files for mock tokens", async () => {
    const files = await listDriveFiles("mock_test_token");
    expect(files.length).toBeGreaterThan(0);
    expect(files[0]).toHaveProperty("id");
  });
  it("downloads mock file content for import", async () => {
    const meta = mockDriveFiles()[0];
    const dl = await downloadDriveFile("mock_test_token", meta.id);
    expect(dl.name).toBe(meta.name);
    expect(dl.bytes.length).toBeGreaterThan(0);
  });
  it("rejects unknown mock file ids", async () => {
    await expect(downloadDriveFile("mock_test_token", "nope")).rejects.toThrow("not found");
  });
});
