"use client";
import { useState } from "react";

type Props = {
  id: string;
  title: string;
  description: string;
  /** Human-readable action, e.g. "create_task". Shown, never executed blindly. */
  toolName?: string;
  risk?: string;
  expiresAt?: string | null;
  initialStatus?: string;
  onDecided?: (status: "approved" | "denied") => void;
};

function expiryLabel(expiresAt?: string | null): string | null {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Expired";
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  if (days > 0) return `Expires in ${days}d ${hours}h`;
  if (hours > 0) return `Expires in ${hours}h`;
  return "Expires in under an hour";
}

export function ApprovalCard({ id, title, description, toolName, risk, expiresAt, initialStatus, onDecided }: Props) {
  const [state, setState] = useState(initialStatus ?? "pending");
  const [resultMsg, setResultMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function decide(action: "approve" | "deny") {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch(`/api/approvals/${id}/${action}`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const next = action === "approve" ? "approved" : "denied";
        setState(next);
        if (data.executionResult) setResultMsg(data.executionResult);
        onDecided?.(next);
      } else {
        // 409 replay / 410 expired / 403 forbidden: reflect terminal state.
        const approval = data.approval;
        if (approval?.status && approval.status !== "pending") setState(approval.status);
        else if (res.status === 410) setState("expired");
        setErrorMsg(data.error ?? data.approval?.status ?? "Decision failed. Retry.");
      }
    } catch {
      setErrorMsg("Network failed. Retry.");
    } finally {
      setLoading(false);
    }
  }

  const isApproved = state === "approved";
  const isDenied = state === "denied";
  const expiry = expiryLabel(expiresAt);
  const isExpired = state === "expired" || expiry === "Expired";
  const decided = isApproved || isDenied || isExpired;

  return (
    <div
      className="rounded-2xl border p-4 transition-all"
      style={{
        background: "var(--color-card)",
        borderColor: isApproved ? "#91be89" : isDenied || isExpired ? "#e09891" : "var(--color-brand)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <p className="font-bold" style={{ margin: 0 }}>{title}</p>
        <span
          className="tag"
          style={{
            background: isApproved ? "#e4f0df" : isDenied || isExpired ? "#ffe0d6" : "#fff3d6",
            color: isApproved ? "#2d6325" : isDenied || isExpired ? "#c0392b" : "#996200",
            fontWeight: 700,
            fontSize: 11,
          }}
        >
          {isExpired && state === "pending" ? "EXPIRED" : state.toUpperCase()}
        </span>
      </div>
      <p className="text-sm text-muted" style={{ marginTop: 6 }}>{description}</p>
      {(toolName || risk || expiry) && (
        <dl style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 12, margin: "8px 0 0" }}>
          {toolName && (
            <div><dt style={{ display: "inline", color: "var(--color-muted)" }}>Action: </dt><dd style={{ display: "inline", margin: 0, fontWeight: 700 }}>{toolName}</dd></div>
          )}
          {risk && (
            <div><dt style={{ display: "inline", color: "var(--color-muted)" }}>Risk: </dt><dd style={{ display: "inline", margin: 0, fontWeight: 700 }}>{risk.replace(/_/g, " ")}</dd></div>
          )}
          {expiry && (
            <div><dt style={{ display: "inline", color: "var(--color-muted)" }}></dt><dd style={{ display: "inline", margin: 0 }}>{expiry}</dd></div>
          )}
        </dl>
      )}
      {(toolName || risk) && (
        <details style={{ fontSize: 12, marginTop: 6 }}>
          <summary style={{ cursor: "pointer" }}>Why am I seeing this?</summary>
          <p style={{ color: "var(--color-muted)" }}>
            This action changes your workspace{toolName ? ` via ${toolName}` : ""} and needs your explicit approval before it runs. Nothing has been changed yet.
          </p>
        </details>
      )}
      {resultMsg && (
        <p style={{ fontSize: 12, color: "#2d6325", fontWeight: 700, marginTop: 6 }}>✓ {resultMsg}</p>
      )}
      {errorMsg && !decided && (
        <p role="alert" style={{ fontSize: 12, color: "#c0392b", marginTop: 6 }}>{errorMsg}</p>
      )}
      {state === "pending" && !isExpired && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => void decide("approve")}
            disabled={loading}
            className="rounded-full bg-brand px-4 py-1.5 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Approving…" : "Approve"}
          </button>
          <button
            onClick={() => void decide("deny")}
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
