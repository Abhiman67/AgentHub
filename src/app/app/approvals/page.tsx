"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { formatTtlRemaining } from "@/lib/approvals";

type Approval = {
  id: string;
  agentId: string;
  title: string;
  description: string;
  payload: string;
  status: "pending" | "approved" | "denied" | "expired";
  createdAt: string;
  decidedAt: string | null;
};

type AuditLog = {
  id: string;
  action: string;
  metadata: string;
  createdAt: string;
};

type ApprovalsResponse = {
  approvals: Approval[];
  stats: {
    pending: number;
    approved: number;
    denied: number;
    expired: number;
    total: number;
  };
  auditLogs: AuditLog[];
};

export default function ApprovalsPage() {
  const [data, setData] = useState<ApprovalsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"pending" | "all" | "approved" | "denied" | "expired" | "audit">("pending");
  const [actingId, setActingId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{ id: string; msg: string; type: "success" | "error" } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  async function loadData() {
    setError("");
    try {
      const res = await fetch("/api/approvals?includeAudit=true", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load approvals");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load approvals");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, []);

  async function handleAction(id: string, action: "approve" | "deny") {
    setActingId(id);
    setActionNotice(null);
    try {
      const res = await fetch(`/api/approvals/${id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `Failed to ${action} approval`);

      setActionNotice({
        id,
        msg: json.executionResult || `Approval successfully ${action === "approve" ? "granted" : "denied"}.`,
        type: "success",
      });

      // Optimistically update local approval status
      setData((prev) => {
        if (!prev) return prev;
        const updated = prev.approvals.map((a) =>
          a.id === id ? { ...a, status: (action === "approve" ? "approved" : "denied") as Approval["status"], decidedAt: new Date().toISOString() } : a
        );
        const newStats = { ...prev.stats };
        if (newStats.pending > 0) newStats.pending--;
        if (action === "approve") newStats.approved++;
        else newStats.denied++;

        return {
          ...prev,
          approvals: updated,
          stats: newStats,
        };
      });
    } catch (err) {
      setActionNotice({
        id,
        msg: err instanceof Error ? err.message : `Failed to ${action}`,
        type: "error",
      });
    } finally {
      setActingId(null);
    }
  }

  const approvals = data?.approvals;
  const filteredApprovals = useMemo(() => {
    if (!approvals) return [];
    return approvals.filter((a) => {
      const matchesTab = activeTab === "all" ? true : a.status === activeTab;
      if (!matchesTab) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.agentId.toLowerCase().includes(q)
      );
    });
  }, [approvals, activeTab, searchQuery]);

  function renderStatusBadge(status: Approval["status"]) {
    switch (status) {
      case "pending":
        return <span className="tag">Pending review</span>;
      case "approved":
        return <span className="tag">Approved</span>;
      case "denied":
        return <span className="tag">Denied</span>;
      case "expired":
        return <span className="tag">Expired (7d TTL)</span>;
    }
  }

  function parsePayload(payloadStr: string) {
    try {
      return JSON.parse(payloadStr);
    } catch {
      return null;
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="page-head">
        <div>
          <h1>Approvals and safety</h1>
          <p>
            Human-in-the-loop governance: AI agents cannot modify your calendar, tasks, or files without your explicit approval.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={loadData}
            disabled={loading}
            className="button secondary sm"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="card">
          <div className="text-xs font-medium text-muted">Pending review</div>
          <div className="mt-1 text-2xl font-extrabold flex items-center gap-2">
            {data?.stats.pending ?? 0}
            {(data?.stats.pending ?? 0) > 0 && (
              <span className="tag">
                Action required
              </span>
            )}
          </div>
        </div>

        <div className="card">
          <div className="text-xs font-medium text-muted">Approved actions</div>
          <div className="mt-1 text-2xl font-extrabold">
            {data?.stats.approved ?? 0}
          </div>
        </div>

        <div className="card">
          <div className="text-xs font-medium text-muted">Denied / blocked</div>
          <div className="mt-1 text-2xl font-extrabold">
            {data?.stats.denied ?? 0}
          </div>
        </div>

        <div className="card">
          <div className="text-xs font-medium text-muted">Safety policy</div>
          <div className="mt-1 text-lg font-bold flex items-center gap-1.5">
            100% guarded
          </div>
          <div className="text-[11px] text-muted">7-day TTL auto-expiry</div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="filter-pills" role="tablist" aria-label="Approval filters" style={{ marginBottom: 0 }}>
          {(
            [
              { id: "pending", label: "Pending", count: data?.stats.pending },
              { id: "all", label: "All", count: data?.stats.total },
              { id: "approved", label: "Approved", count: data?.stats.approved },
              { id: "denied", label: "Denied", count: data?.stats.denied },
              { id: "expired", label: "Expired", count: data?.stats.expired },
              { id: "audit", label: "Audit trail", count: data?.auditLogs?.length },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={activeTab === tab.id ? "on" : ""}
            >
              {tab.label}
              {typeof tab.count === "number" && ` (${tab.count})`}
            </button>
          ))}
        </div>

        {activeTab !== "audit" && (
          <div className="relative">
            <label htmlFor="approval-search" className="sr-only">Search approvals</label>
            <input
              id="approval-search"
              type="text"
              placeholder="Search approvals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="qa-control"
            />
          </div>
        )}
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="panel" style={{ marginTop: 32, textAlign: "center" }}>
          <p className="text-sm text-muted">Loading approval records and safety policies...</p>
        </div>
      )}

      {error && !loading && (
        <div className="panel" style={{ marginTop: 32, textAlign: "center" }}>
          <p className="text-sm font-medium">{error}</p>
          <button
            onClick={loadData}
            className="button primary sm"
            style={{ marginTop: 12 }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Audit Trail View */}
      {!loading && !error && activeTab === "audit" && (
        <div className="panel" style={{ marginTop: 24, padding: 0, overflow: "hidden" }}>
          <div className="panel-head" style={{ padding: "16px 16px 0" }}>
            <div>
              <h2>Security audit log</h2>
              <p className="text-xs text-muted">Immutable event records capturing agent proposals, approvals, and guardrail events.</p>
            </div>
            <span className="tag">{data?.auditLogs?.length ?? 0} events</span>
          </div>

          {!data?.auditLogs || data.auditLogs.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center" }}>
              <p className="text-sm text-muted">
                No audit events recorded yet. Approving or denying actions will populate this log.
              </p>
            </div>
          ) : (
            <div style={{ marginTop: 8 }}>
              {data.auditLogs.map((log) => {
                let parsedMeta: Record<string, unknown> = {};
                try {
                  parsedMeta = JSON.parse(log.metadata);
                } catch {}

                return (
                  <div key={log.id} className="list-row" style={{ padding: "16px" }}>
                    <div className="grow">
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span className="tag">
                          {log.action}
                        </span>
                        <span className="text-muted" style={{ fontSize: 12 }}>
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {parsedMeta.executionResult ? (
                        <p className="mt-1 font-medium" style={{ fontSize: 12 }}>{String(parsedMeta.executionResult)}</p>
                      ) : (
                        <p className="mt-1 text-muted" style={{ fontSize: 11 }}>{log.metadata}</p>
                      )}
                    </div>
                    <div className="text-[11px] text-muted">
                      ID: {log.id.slice(-8)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Approvals Card List View */}
      {!loading && !error && activeTab !== "audit" && (
        <div className="mt-6 space-y-4">
          {actionNotice && (
            <div className="panel" style={{ padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{actionNotice.msg}</span>
                <button
                  type="button"
                  onClick={() => setActionNotice(null)}
                  className="tag"
                  aria-label="Dismiss notice"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {filteredApprovals.length === 0 ? (
            <div className="card" style={{ padding: 48, textAlign: "center" }}>
              <h3 className="text-base font-bold">
                {activeTab === "pending"
                  ? "Zero pending approvals"
                  : `No ${activeTab} approvals found`}
              </h3>
              <p className="mt-1 text-xs text-muted" style={{ maxWidth: 448, margin: "4px auto 0" }}>
                {activeTab === "pending"
                  ? "All clear! Your AI agents are operating safely within read-only boundaries. When an agent proposes an external action or creates tasks, it will appear here for your sign-off."
                  : "Try switching to another tab or asking an agent to plan a task."}
              </p>
              <Link
                href="/app/agents"
                className="button primary sm"
                style={{ marginTop: 16 }}
              >
                Open agents workspace
              </Link>
            </div>
          ) : (
            filteredApprovals.map((approval) => {
              const payload = parsePayload(approval.payload);
              const ttlRemaining = formatTtlRemaining(new Date(approval.createdAt));
              const isActing = actingId === approval.id;

              return (
                <div
                  key={approval.id}
                  className="card"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {renderStatusBadge(approval.status)}
                        <span className="text-xs text-muted font-medium">
                          Agent: <span className="font-semibold">{approval.agentId}</span>
                        </span>
                        <span className="text-xs text-muted">·</span>
                        <span className="text-xs text-muted">
                          Created {new Date(approval.createdAt).toLocaleDateString()}
                        </span>
                        {approval.status === "pending" && (
                          <span className="tag">
                            TTL: {ttlRemaining}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold pt-1">{approval.title}</h3>
                      <p className="text-xs text-muted leading-relaxed">{approval.description}</p>
                    </div>

                    {/* Action Controls for Pending Approvals */}
                    {approval.status === "pending" && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => handleAction(approval.id, "deny")}
                          disabled={isActing}
                          className="button secondary sm"
                        >
                          {isActing ? "Processing..." : "Deny"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAction(approval.id, "approve")}
                          disabled={isActing}
                          className="button primary sm"
                        >
                          {isActing ? "Processing..." : "Approve action"}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Proposed Action Inspection Details */}
                  {payload && (
                    <div className="card" style={{ marginTop: 16, background: "var(--color-paper)" }}>
                      <div className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2">
                        Proposed system state change:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2" style={{ fontSize: 12 }}>
                        <div>
                          <span className="text-muted">Action type: </span>
                          <span className="font-semibold">
                            {payload.type ?? "state_change"}
                          </span>
                        </div>
                        {payload.title && (
                          <div className="sm:col-span-2">
                            <span className="text-muted">Target item: </span>
                            <span className="font-medium">{payload.title}</span>
                          </div>
                        )}
                        {payload.priority && (
                          <div>
                            <span className="text-muted">Priority: </span>
                            <span className="capitalize font-medium">{payload.priority}</span>
                          </div>
                        )}
                        {payload.dueDate && (
                          <div>
                            <span className="text-muted">Due date: </span>
                            <span className="font-medium">
                              {new Date(payload.dueDate).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Decision metadata if resolved */}
                  {approval.decidedAt && (
                    <div className="mt-3 text-[11px] text-muted">
                      Decision finalized on {new Date(approval.decidedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </main>
  );
}
