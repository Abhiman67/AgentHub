"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ApprovalCard } from "./ApprovalCard";

type Step = {
  id: string;
  title: string;
  status: string;
  kind: string;
  description: string;
  sequence?: number;
};
type Approval = {
  id: string;
  title: string;
  description: string;
  status: string;
  risk?: string | null;
  expiresAt?: string | null;
  createdAt?: string;
  payload?: string | null;
};

function toolNameOf(a: Approval): string | undefined {
  try {
    const data = JSON.parse(a.payload ?? "{}");
    if (typeof data.toolName === "string") return data.toolName;
    if (data.type === "create_task") return "create_task";
  } catch {
    /* ignore malformed payloads */
  }
  return undefined;
}
type Run = {
  id: string;
  goal: string;
  status: string;
  currentStepIndex?: number;
  errorMessage?: string | null;
  createdAt?: string;
  updatedAt?: string;
  approvals?: Approval[];
};

const STATUS_LABEL: Record<string, string> = {
  queued: "Starting",
  planning: "Planning",
  running: "Running",
  awaiting_approval: "Waiting for approval",
  paused: "Paused",
  completed: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
};

const TERMINAL = new Set(["completed", "failed", "cancelled"]);
const CANCELLABLE = new Set(["queued", "planning", "running", "paused", "awaiting_approval"]);

async function fetchJson(url: string, init: RequestInit = {}, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    const data = await res.json().catch(() => ({}));
    return { res, data } as const;
  } finally {
    clearTimeout(timer);
  }
}

export function RunPanel({ agentId, conversationId, projectId }: { agentId: string; conversationId: string; projectId: string }) {
  const [goal, setGoal] = useState("");
  const [run, setRun] = useState<Run | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [busy, setBusy] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [unauthorized, setUnauthorized] = useState(false);
  const [pollError, setPollError] = useState("");
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  function handleAuth(res: Response): boolean {
    if (res.status === 401) {
      setUnauthorized(true);
      return true;
    }
    return false;
  }

  async function refresh(id: string) {
    try {
      const { res, data } = await fetchJson(`/api/agent-runs/${id}`, {}, 15000);
      if (handleAuth(res)) return;
      if (!res.ok) throw new Error(data.error?.message ?? "Could not load the run.");
      setRun(data.run);
      setSteps(data.run.steps ?? []);
      setPollError("");
    } catch (e) {
      if ((e as Error).name === "AbortError") setPollError("Update timed out.");
      else setPollError(e instanceof Error ? e.message : "Update failed.");
    }
  }

  async function start() {
    if (!goal.trim() || busy || starting) return;
    setStarting(true);
    setBusy(true);
    setError("");
    setUnauthorized(false);
    try {
      const { res, data } = await fetchJson("/api/agent-runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, goal: goal.trim(), conversationId: conversationId || undefined, projectId: projectId || undefined }),
      });
      if (handleAuth(res)) return;
      if (!res.ok) throw new Error(data.error?.message ?? "Run failed");
      setRun(data.run);
      setSteps(data.steps ?? []);
      setGoal("");
      // POST returns no approvals; load them for the approval-required state.
      await refresh(data.run.id);
    } catch (e) {
      if ((e as Error).name === "AbortError") setError("Request timed out. Retry.");
      else setError(e instanceof Error ? e.message : "Run failed");
    } finally {
      setStarting(false);
      setBusy(false);
    }
  }

  async function act(path: "cancel" | "resume") {
    if (!run || busy) return;
    setBusy(true);
    setError("");
    try {
      const { res, data } = await fetchJson(`/api/agent-runs/${run.id}/${path}`, { method: "POST" });
      if (handleAuth(res)) return;
      if (!res.ok) throw new Error(data.error?.message ?? "Action failed");
      setRun(data.run);
      if (data.steps) setSteps(data.steps);
      else await refresh(run.id);
    } catch (e) {
      if ((e as Error).name === "AbortError") setError("Request timed out. Retry.");
      else setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
    if (!run || TERMINAL.has(run.status)) return;
    pollTimer.current = setInterval(() => {
      void refresh(run.id);
    }, 4000);
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
      pollTimer.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run?.id, run?.status]);

  const status = run?.status ?? "none";
  const showRetry = status === "failed";
  // Resume only for paused runs or runs whose approval was just decided
  // (awaiting_approval with no pending approval left).
  const pendingApproval = (run?.approvals ?? []).some((a) => a.status === "pending");
  const showResume = status === "paused" || (status === "awaiting_approval" && !pendingApproval);
  const showCancel = CANCELLABLE.has(status);
  const showRefresh = !!run && !TERMINAL.has(status);
  const currentSeq = run?.currentStepIndex;

  return (
    <div className="card" style={{ padding: 12 }} aria-live="polite">
      <h3 style={{ fontSize: 13, margin: "0 0 8px" }}>Agent runs</h3>
      {unauthorized ? (
        <p style={{ fontSize: 12 }}>
          Session expired. <Link href="/login">Sign in again</Link>.
        </p>
      ) : (
        <div style={{ display: "flex", gap: 6 }}>
          <label htmlFor="run-goal" className="sr-only">Goal</label>
          <input
            id="run-goal"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void start();
            }}
            placeholder="Goal e.g. Create revision tasks"
            style={{ flex: 1, fontSize: 12, padding: "6px 8px", borderRadius: 8, border: "1px solid var(--color-line)" }}
            disabled={busy || starting}
          />
          <button type="button" onClick={() => void start()} disabled={busy || starting || !goal.trim()} className="button" style={{ fontSize: 12, padding: "6px 10px" }}>
            {starting ? "Starting…" : "Start"}
          </button>
        </div>
      )}
      {error && (
        <div role="alert" style={{ fontSize: 12, color: "#c0392b", marginTop: 6 }}>
          {error}{" "}
          <button type="button" onClick={() => (run ? void refresh(run.id) : void start())} style={{ textDecoration: "underline", background: "none", border: 0, cursor: "pointer", color: "inherit" }}>
            Retry
          </button>
        </div>
      )}
      {!run && !starting && !error && <p style={{ fontSize: 12, color: "var(--color-muted)", margin: "8px 0 0" }}>No run yet. Enter a goal to start.</p>}
      {starting && !run && <p role="status" style={{ fontSize: 12, margin: "8px 0 0" }}>Starting…</p>}
      {run && (
        <div style={{ marginTop: 8, fontSize: 12 }}>
          <div role="status">
            <b>Status:</b> {STATUS_LABEL[status] ?? status}
          </div>
          <div style={{ color: "var(--color-muted)" }}>{run.goal}</div>
          {run.createdAt && (
            <div style={{ color: "var(--color-muted)", fontSize: 11 }}>
              Started {new Date(run.createdAt).toLocaleString()}
              {run.updatedAt ? ` · Updated ${new Date(run.updatedAt).toLocaleString()}` : ""}
            </div>
          )}
          {run.errorMessage && (
            <div role="alert" style={{ color: "#c0392b" }}>{run.errorMessage}</div>
          )}
          {status === "awaiting_approval" && (
            <div style={{ marginTop: 6, padding: 8, borderRadius: 8, background: "#fff3d6", fontWeight: 700 }}>
              Waiting for approval — review below, then the run resumes automatically.
            </div>
          )}
          <ol style={{ paddingLeft: 18, margin: "6px 0" }}>
            {steps.map((s, i) => {
              const isCurrent = s.status === "running" || s.status === "awaiting_approval" || (currentSeq !== undefined && (s.sequence ?? i) === currentSeq && !TERMINAL.has(status));
              return (
                <li key={s.id} aria-current={isCurrent ? "step" : undefined} style={{ fontWeight: isCurrent ? 800 : 400 }}>
                  {s.title} — {STATUS_LABEL[s.status] ?? s.status}
                  {isCurrent && " ← current"}
                </li>
              );
            })}
          </ol>
          {(run.approvals ?? []).filter((a) => a.status === "pending").map((a) => (
            <div key={a.id} style={{ marginTop: 8 }}>
              <ApprovalCard
                id={a.id}
                title={a.title}
                description={a.description}
                toolName={toolNameOf(a)}
                risk={a.risk ?? undefined}
                expiresAt={a.expiresAt ?? undefined}
                onDecided={() => void refresh(run.id)}
              />
            </div>
          ))}
          {pollError && (
            <div role="alert" style={{ fontSize: 12, color: "#c0392b" }}>
              Live update failed: {pollError}{" "}
              <button type="button" onClick={() => void refresh(run.id)} style={{ textDecoration: "underline", background: "none", border: 0, cursor: "pointer", color: "inherit" }}>
                Retry
              </button>
            </div>
          )}
          <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
            {showRetry && (
              <button type="button" onClick={() => void act("resume")} disabled={busy} className="tag" style={{ cursor: "pointer" }}>Retry</button>
            )}
            {showResume && (
              <button type="button" onClick={() => void act("resume")} disabled={busy} className="tag" style={{ cursor: "pointer" }}>Resume</button>
            )}
            {showCancel && (
              <button type="button" onClick={() => void act("cancel")} disabled={busy} className="tag" style={{ cursor: "pointer" }}>Cancel</button>
            )}
            {showRefresh && (
              <button type="button" onClick={() => void refresh(run.id)} disabled={busy} className="tag" style={{ cursor: "pointer" }}>Refresh</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
