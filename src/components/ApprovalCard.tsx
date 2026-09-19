"use client";
import { useState } from "react";

export function ApprovalCard({ id, title, description }: { id: string; title: string; description: string }) {
  const [state, setState] = useState("pending");
  const [resultMsg, setResultMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function decide(action: "approve" | "deny") {
    setLoading(true);
    try {
      const res = await fetch(`/api/approvals/${id}/${action}`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setState(action === "approve" ? "approved" : "denied");
        if (data.executionResult) setResultMsg(data.executionResult);
      }
    } finally {
      setLoading(false);
    }
  }

  const isApproved = state === "approved";
  const isDenied = state === "denied";

  return (
    <div
      className="rounded-2xl border p-4 transition-all"
      style={{
        background: "var(--color-card)",
        borderColor: isApproved ? "#91be89" : isDenied ? "#e09891" : "var(--color-brand)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <p className="font-bold" style={{ margin: 0 }}>{title}</p>
        <span
          className="tag"
          style={{
            background: isApproved ? "#e4f0df" : isDenied ? "#ffe0d6" : "#fff3d6",
            color: isApproved ? "#2d6325" : isDenied ? "#c0392b" : "#996200",
            fontWeight: 700,
            fontSize: 11,
          }}
        >
          {state.toUpperCase()}
        </span>
      </div>
      <p className="text-sm text-muted" style={{ marginTop: 6 }}>{description}</p>
      {resultMsg && (
        <p style={{ fontSize: 12, color: "#2d6325", fontWeight: 700, marginTop: 6 }}>✓ {resultMsg}</p>
      )}
      {state === "pending" && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => decide("approve")}
            disabled={loading}
            className="rounded-full bg-brand px-4 py-1.5 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Approving…" : "Approve"}
          </button>
          <button
            onClick={() => decide("deny")}
            disabled={loading}
            className="rounded-full border border-line px-4 py-1.5 text-xs font-bold hover:bg-neutral-100 disabled:opacity-50"
          >
            {loading ? "Processing…" : "Deny"}
          </button>
        </div>
      )}
    </div>
  );
}
