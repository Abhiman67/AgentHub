"use client";
import Link from "next/link";
import { useState } from "react";

export function QuickCapture({ onCaptured }: { onCaptured?: () => void }) {
  const [text, setText] = useState("");
  const [kind, setKind] = useState<"task" | "note">("task");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function submit() {
    if (!text.trim() || busy) return;
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, text: text.trim() }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error?.message ?? "Capture failed.");
      setText("");
      setMsg(kind === "task" ? "Task added to your planner." : "Note saved and indexing.");
      onCaptured?.();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Capture failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        {(["task", "note"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            aria-pressed={kind === k}
            className="tag"
            style={{ cursor: "pointer", fontWeight: kind === k ? 800 : 400 }}
          >
            {k === "task" ? "Task" : "Note"}
          </button>
        ))}
        <span style={{ fontSize: 11, color: "var(--color-muted)", alignSelf: "center" }}>
          Files → <Link href="/app/files">upload</Link> · Goals → <Link href="/app/projects/new">new project</Link>
        </span>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <label htmlFor="quick-capture" className="sr-only">Quick capture</label>
        <input
          id="quick-capture"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void submit();
          }}
          placeholder={kind === "task" ? "Capture a task…" : "Jot a note…"}
          disabled={busy}
          style={{ flex: 1, fontSize: 13, padding: "8px 12px", borderRadius: 10, border: "1px solid var(--color-line)", background: "var(--color-card)" }}
        />
        <button type="button" onClick={() => void submit()} disabled={busy || !text.trim()} className="button" style={{ fontSize: 12, padding: "8px 14px" }}>
          {busy ? "Saving…" : "Capture"}
        </button>
      </div>
      {msg && (
        <p role="status" style={{ fontSize: 12, color: "var(--color-muted)", margin: "6px 0 0" }}>
          {msg}
        </p>
      )}
    </div>
  );
}
