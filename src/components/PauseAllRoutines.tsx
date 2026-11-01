"use client";
import { useState } from "react";

/** Settings-level kill switch for all background routines (spec §7). */
export function PauseAllRoutines() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  async function pause() {
    setBusy(true);
    try {
      const res = await fetch("/api/responsibilities/pause-all", { method: "POST" });
      const d = await res.json().catch(() => ({}));
      setMsg(res.ok ? `Paused ${d.paused ?? 0} routine(s).` : "Pause failed.");
    } catch {
      setMsg("Pause failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <span>
      <button type="button" onClick={() => void pause()} disabled={busy} className="tag" style={{ cursor: "pointer" }}>
        {busy ? "Pausing…" : "Pause all routines"}
      </button>
      {msg && <span style={{ fontSize: 11, color: "var(--color-muted)", marginLeft: 8 }}>{msg}</span>}
    </span>
  );
}
