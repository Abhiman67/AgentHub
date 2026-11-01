"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export type Rec = {
  key: string;
  kind: string;
  title: string;
  body: string;
  reason: string;
  source: { type: string; id: string; label: string };
  href: string;
};

export function Recommendations({ compact = false }: { compact?: boolean }) {
  const [recs, setRecs] = useState<Rec[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState({ title: "", body: "" });
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/recommendations", { cache: "no-store" });
      if (res.status === 401) {
        setError("Session expired.");
        return;
      }
      if (!res.ok) throw new Error("Could not load recommendations.");
      const d = await res.json();
      setRecs(compact ? (d.priorities ?? []) : (d.recommendations ?? []));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load recommendations.");
    } finally {
      setLoading(false);
    }
  }, [compact]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function act(key: string, status: "accepted" | "dismissed", extra: Record<string, unknown> = {}) {
    setBusy(key);
    try {
      const res = await fetch("/api/recommendations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, status, ...extra }),
      });
      if (!res.ok) throw new Error("Action failed.");
      setRecs((r) => r.filter((x) => x.key !== key));
    } catch {
      setError("Action failed. Retry.");
    } finally {
      setBusy("");
      setEditing(null);
    }
  }

  if (loading) return <p style={{ fontSize: 13, color: "var(--color-muted)" }}>Finding what matters…</p>;
  if (error && recs.length === 0)
    return (
      <p style={{ fontSize: 13, color: "var(--color-muted)" }}>
        {error} <button type="button" onClick={() => void load()} style={{ textDecoration: "underline" }}>Retry</button>
      </p>
    );
  if (recs.length === 0) return <p style={{ fontSize: 13, color: "var(--color-muted)" }}>All clear. No recommendations right now.</p>;

  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }} aria-live="polite">
      {recs.map((r) => (
        <li key={r.key} className="focus">
          <div className="focus-body">
            <b>{r.title}</b>
            <p>{r.body}</p>
            <p style={{ fontSize: 11, color: "var(--color-muted)" }}>
              Why: {r.reason} · Source: {r.source.label}
            </p>
            {editing === r.key ? (
              <div style={{ display: "grid", gap: 6, marginTop: 6 }}>
                <label className="sr-only" htmlFor={`edit-title-${r.key}`}>Edit title</label>
                <input
                  id={`edit-title-${r.key}`}
                  value={draft.title}
                  onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                  style={{ fontSize: 12, padding: "6px 8px", borderRadius: 8, border: "1px solid var(--color-line)" }}
                />
                <div style={{ display: "flex", gap: 6 }}>
                  <button type="button" disabled={busy === r.key} onClick={() => void act(r.key, "accepted", { title: draft.title || undefined })} className="tag" style={{ cursor: "pointer" }}>
                    Save & accept
                  </button>
                  <button type="button" onClick={() => setEditing(null)} className="tag" style={{ cursor: "pointer" }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                <Link href={r.href} onClick={() => void act(r.key, "accepted")} className="tag" style={{ textDecoration: "none" }}>
                  Accept →
                </Link>
                <button
                  type="button"
                  disabled={busy === r.key}
                  onClick={() => {
                    setEditing(r.key);
                    setDraft({ title: r.title, body: r.body });
                  }}
                  className="tag"
                  style={{ cursor: "pointer" }}
                >
                  Edit
                </button>
                <button type="button" disabled={busy === r.key} onClick={() => void act(r.key, "dismissed", { snoozeDays: 3 })} className="tag" style={{ cursor: "pointer" }}>
                  Snooze
                </button>
                <button type="button" disabled={busy === r.key} onClick={() => void act(r.key, "dismissed")} className="tag" style={{ cursor: "pointer" }}>
                  Dismiss
                </button>
                <button type="button" disabled={busy === r.key} onClick={() => void act(r.key, "dismissed", { feedback: "incorrect" })} className="tag" style={{ cursor: "pointer" }} title="Report as incorrect">
                  Wrong?
                </button>
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
