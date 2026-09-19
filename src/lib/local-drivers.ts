import { spawn, type ChildProcessByStdio } from "node:child_process";
import type { Readable } from "node:stream";
import { randomUUID } from "node:crypto";
import { createInterface } from "node:readline";

export type LocalProvider = "gemini-cli" | "claude-code" | "codex-cli" | "ollama";
export type DriverEvent = { type: "text_delta"; text: string } | { type: "error"; message: string } | { type: "done" };

const COMMANDS: Record<Exclude<LocalProvider, "ollama">, string> = {
  "gemini-cli": "gemini",
  "claude-code": "claude",
  "codex-cli": "codex",
};

export function commandFor(provider: LocalProvider): string | null {
  return provider === "ollama" ? null : COMMANDS[provider];
}

/**
 * Minimal, server-only driver boundary. Provider-specific protocols must be
 * parsed inside a driver before events reach the UI. Never pass user text to a
 * shell string; spawn receives an argument array deliberately.
 */
export function startLocalCli(provider: Exclude<LocalProvider, "ollama">, prompt: string, cwd?: string) {
  const command = COMMANDS[provider];
  const child: ChildProcessByStdio<null, Readable, Readable> = spawn(command, [prompt], {
    cwd,
    shell: false,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, CI: "1" },
  });
  const turnId = randomUUID();
  const events = createInterface({ input: child.stdout });
  async function* stream(): AsyncIterable<DriverEvent> {
    for await (const line of events) {
      if (line) yield { type: "text_delta", text: `${line}\n` };
    }
    const code = await new Promise<number | null>((resolve) => child.once("close", resolve));
    if (code && code !== 0) yield { type: "error", message: `${command} exited with code ${code}` };
    else yield { type: "done" };
  }
  child.stderr.on("data", () => undefined); // Never leak provider stderr into the response.
  return { turnId, events: stream(), interrupt: () => { child.kill("SIGTERM"); } };
}
