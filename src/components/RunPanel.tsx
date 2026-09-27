"use client";
import { useEffect, useState } from "react";

type Step = { id: string; title: string; status: string; kind: string; description: string };
type Run = { id: string; goal: string; status: string; errorMessage?: string | null };

export function RunPanel({ agentId, conversationId, projectId }: { agentId: string; conversationId: string; projectId: string }) {
  const [goal, setGoal] = useState("");
  const [run, setRun] = useState<Run | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function refresh(id: string) {
    const res = await fetch(`/api/agent-runs/${id}`, { cache: "no-store" });
    if (!res.ok) return;
    const d = await res.json();
    setRun(d.run);
    setSteps(d.run.steps ?? []);
  }

  async function start() {
    if (!goal.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/agent-runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, goal: goal.trim(), conversationId: conversationId || undefined, projectId: projectId || undefined }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error?.message ?? "Run failed");
      setRun(d.run);
      setSteps(d.steps ?? []);
      setGoal("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Run failed");
    } finally {
      setBusy(false);
    }
  }

  async function act(path: "cancel" | "resume") {
    if (!run) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/agent-runs/${run.id}/${path}`, { method: "POST" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error?.message ?? "Action failed");
      setRun(d.run);
      if (d.steps) setSteps(d.steps);
      else await refresh(run.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!run) return;
    if (["completed", "failed", "cancelled"].includes(run.status)) return;
    const t = setInterval(() => refresh(run.id), 4000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run?.id, run?.status]);

  return (
    <div className="card" style={{ padding: 12 }} aria-live="polite">
      <h3 style={{ fontSize: 13, margin: "0 0 8px" }}>Agent runs</h3>
      <div style={{ display: "flex", gap: 6 }}>
        <label htmlFor="run-goal" className="sr-only">Goal</label>
        <input id="run-goal" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Goal e.g. Create revision tasks" style={{ flex: 1, fontSize: 12, padding: "6px 8px", borderRadius: 8, border: "1px solid var(--color-line)" }} disabled={busy} />
        <button type="button" onClick={start} disabled={busy || !goal.trim()} className="button" style={{ fontSize: 12, padding: "6px 10px" }}>Start</button>
      </div>
      {error && <div role="alert" style={{ fontSize: 12, color: "#c0392b", marginTop: 6 }}>{error} <button type="button" onClick={() => run && refresh(run.id)} style={{ textDecoration: "underline" }}>Retry</button></div>}
      {run && (
        <div style={{ marginTop: 8, fontSize: 12 }}>
          <div><b>Status:</b> {run.status}</div>
          <div style={{ color: "var(--color-muted)" }}>{run.goal}</div>
          {run.errorMessage && <div style={{ color: "#c0392b" }}>{run.errorMessage}</div>}
          <ul style={{ paddingLeft: 16, margin: "6px 0" }}>
            {steps.map((s) => (
              <li key={s.id}>{s.title} — {s.status}</li>
            ))}
          </ul>
          <div style={{ display: "flex", gap: 6 }}>
            <button type="button" onClick={() => act("resume")} disabled={busy} className="tag" style={{ cursor: "pointer" }}>Retry / Resume</button>
            <button type="button" onClick={() => act("cancel")} disabled={busy} className="tag" style={{ cursor: "pointer" }}>Cancel</button>
            <button type="button" onClick={() => refresh(run.id)} disabled={busy} className="tag" style={{ cursor: "pointer" }}>Refresh</button>
          </div>
        </div>
      )}
    </div>
  );
}
