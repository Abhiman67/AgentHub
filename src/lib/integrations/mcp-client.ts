import { db } from "@/lib/db";
import { assertScopes } from "./accounts";
import { MIN_SCOPES } from "./scopes";
import type { Capability, IntegrationAdapter, IntegrationRequest, IntegrationResult } from "./types";
import { logError } from "@/lib/observability/logger";

const TIMEOUT_MS = 15_000;

async function withTimeout<T>(fn: () => Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      fn(),
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error("Integration timed out")), TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function withRetry<T>(fn: () => Promise<T>, attempts = 2): Promise<T> {
  let last: unknown;
  for (let i = 0; i <= attempts; i++) {
    try {
      return await withTimeout(fn);
    } catch (err) {
      last = err;
      await new Promise((r) => setTimeout(r, 300 * (i + 1)));
    }
  }
  throw last;
}

function gatedAdapter(provider: string, caps: Capability[], requiredScopes: string[]): IntegrationAdapter {
  return {
    provider,
    listCapabilities: async () => caps,
    execute: async (input: IntegrationRequest, ctx?: { ownerId?: string; approvalId?: string }): Promise<IntegrationResult> => {
      const cap = caps.find((c) => c.name === input.capability);
      if (!cap) return { ok: false, error: "Capability not found" };
      try {
        // Per-user ownership + minimum scopes enforcement. Tokens are never logged.
        if (ctx?.ownerId) {
          const acct = await db.integrationAccount.findUnique({
            where: { ownerId_provider: { ownerId: ctx.ownerId, provider } },
          });
          if (!acct) return { ok: false, error: "Provider not connected" };
          let granted: string[] = [];
          try {
            granted = JSON.parse(acct.scopes || "[]");
          } catch {
            granted = [];
          }
          assertScopes(granted, requiredScopes);
          if (acct.expiresAt && acct.expiresAt.getTime() < Date.now()) return { ok: false, error: "Token expired, reconnect" };
        }
        // External writes always require an explicit approval id.
        if (cap.kind === "draft" && input.requiresExternalWrite && !ctx?.approvalId) {
          return { ok: false, error: "External write requires approval" };
        }
        return await withRetry(async () => ({ ok: true, data: { provider, capability: input.capability, mock: true } }));
      } catch (err) {
        logError("integration.failed", { provider, capability: input.capability });
        return { ok: false, error: err instanceof Error ? err.message : "Integration failed" };
      }
    },
  };
}

export const driveAdapter = gatedAdapter("drive", [{ name: "read_file", kind: "read" }], MIN_SCOPES.drive);
export const classroomAdapter = gatedAdapter("classroom", [{ name: "list_courses", kind: "read" }], MIN_SCOPES.classroom);
export const calendarAdapter = gatedAdapter(
  "calendar",
  [
    { name: "read_availability", kind: "read" },
    { name: "draft_event", kind: "draft" },
  ],
  MIN_SCOPES.calendar
);
export const githubAdapter = gatedAdapter(
  "github",
  [
    { name: "read_repo", kind: "read" },
    { name: "draft_issue", kind: "draft" },
  ],
  MIN_SCOPES.github
);
export const notionAdapter = gatedAdapter(
  "notion",
  [
    { name: "read_page", kind: "read" },
    { name: "draft_page", kind: "draft" },
  ],
  MIN_SCOPES.notion
);
export const gmailAdapter = gatedAdapter("gmail", [{ name: "draft_email", kind: "draft" }], MIN_SCOPES.gmail);

export const ADAPTERS: Record<string, IntegrationAdapter> = {
  drive: driveAdapter,
  classroom: classroomAdapter,
  calendar: calendarAdapter,
  github: githubAdapter,
  notion: notionAdapter,
  gmail: gmailAdapter,
};
