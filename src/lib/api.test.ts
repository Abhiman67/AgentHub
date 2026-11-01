import { describe, expect, it, afterEach } from "vitest";
import { getEnv, resetEnvCache } from "./env";
import { HttpError, invalid, notFound, unauthorized } from "./http-error";

describe("env validation", () => {
  afterEach(() => resetEnvCache());
  it("accepts a minimal valid env", () => {
    expect(getEnv({ DATABASE_URL: "file:./dev.db", AUTH_SECRET: "secret" }).DATABASE_URL).toBe("file:./dev.db");
  });
  it("rejects missing required vars", () => {
    expect(() => getEnv({})).toThrow("Invalid environment");
  });
  it("rejects redis mode without REDIS_URL", () => {
    expect(() => getEnv({ DATABASE_URL: "x", AUTH_SECRET: "y", JOB_EXECUTION_MODE: "redis" })).toThrow("REDIS_URL");
  });
});

describe("HttpError helpers", () => {
  it("builds standard errors", () => {
    expect(unauthorized().status).toBe(401);
    expect(notFound("Task").message).toContain("Task");
    expect(invalid().code).toBe("INVALID_INPUT");
    expect(new HttpError("X", 500, "boom").retryable).toBe(false);
  });
});
