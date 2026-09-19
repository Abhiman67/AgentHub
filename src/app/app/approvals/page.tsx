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
    loadData();
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

  const filteredApprovals = useMemo(() => {
    if (!data?.approvals) return [];
    return data.approvals.filter((a) => {
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
  }, [data?.approvals, activeTab, searchQuery]);

  function renderStatusBadge(status: Approval["status"]) {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            Pending Review
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            ✓ Approved
          </span>
        );
      case "denied":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-600 dark:text-rose-400 border border-rose-500/20">
            ✕ Denied
          </span>
        );
      case "expired":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-500/10 px-2.5 py-0.5 text-xs font-semibold text-neutral-500 border border-neutral-500/20">
            ⧗ Expired (7d TTL)
          </span>
        );
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Approvals & Safety</h1>
            <span className="rounded-md bg-brand/10 text-brand px-2 py-0.5 text-xs font-semibold border border-brand/20">
              WP2 & EA4 Compliant
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">
            Human-in-the-loop governance: AI agents cannot modify your calendar, tasks, or files without your explicit approval.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-card px-3.5 py-2 text-xs font-medium text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-line bg-card p-4">
          <div className="text-xs font-medium text-muted">Pending Review</div>
          <div className="mt-1 text-2xl font-extrabold text-amber-500 flex items-center gap-2">
            {data?.stats.pending ?? 0}
            {(data?.stats.pending ?? 0) > 0 && (
              <span className="text-xs font-normal text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                Action required
              </span>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-card p-4">
          <div className="text-xs font-medium text-muted">Approved Actions</div>
          <div className="mt-1 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {data?.stats.approved ?? 0}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-card p-4">
          <div className="text-xs font-medium text-muted">Denied / Blocked</div>
          <div className="mt-1 text-2xl font-extrabold text-rose-500">
            {data?.stats.denied ?? 0}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-card p-4">
          <div className="text-xs font-medium text-muted">Safety Policy</div>
          <div className="mt-1 text-lg font-bold text-foreground flex items-center gap-1.5">
            <span className="text-emerald-500">●</span> 100% Guarded
          </div>
          <div className="text-[11px] text-muted">7-Day TTL Auto-Expiry</div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1 overflow-x-auto pb-2 sm:pb-0 border-b sm:border-b-0 border-line">
          {(
            [
              { id: "pending", label: "Pending", count: data?.stats.pending },
              { id: "all", label: "All", count: data?.stats.total },
              { id: "approved", label: "Approved", count: data?.stats.approved },
              { id: "denied", label: "Denied", count: data?.stats.denied },
              { id: "expired", label: "Expired", count: data?.stats.expired },
              { id: "audit", label: "Audit Trail", count: data?.auditLogs?.length },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                activeTab === tab.id
                  ? "bg-foreground text-background font-semibold"
                  : "text-muted hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
            >
              {tab.label}
              {typeof tab.count === "number" && (
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    activeTab === tab.id
                      ? "bg-background/20 text-background"
                      : "bg-neutral-200 dark:bg-neutral-800 text-muted"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeTab !== "audit" && (
          <div className="relative">
            <input
              type="text"
              placeholder="Search approvals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 rounded-xl border border-line bg-card px-3 py-1.5 text-xs text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
        )}
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="mt-8 rounded-2xl border border-line bg-card p-12 text-center text-sm text-muted">
          Loading approval records and safety policies...
        </div>
      )}

      {error && !loading && (
        <div className="mt-8 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-center">
          <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{error}</p>
          <button
            onClick={loadData}
            className="mt-3 rounded-xl bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Audit Trail View */}
      {!loading && !error && activeTab === "audit" && (
        <div className="mt-6 rounded-2xl border border-line bg-card overflow-hidden">
          <div className="p-4 border-b border-line bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold">Security Audit Log</h2>
              <p className="text-xs text-muted">Immutable event records capturing agent proposals, approvals, and guardrail events.</p>
            </div>
            <span className="text-xs text-muted">{data?.auditLogs?.length ?? 0} events recorded</span>
          </div>

          {!data?.auditLogs || data.auditLogs.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted">
              No audit events recorded yet. Approving or denying actions will populate this log.
            </div>
          ) : (
            <div className="divide-y divide-line text-xs">
              {data.auditLogs.map((log) => {
                let parsedMeta: Record<string, unknown> = {};
                try {
                  parsedMeta = JSON.parse(log.metadata);
                } catch {}

                return (
                  <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold uppercase tracking-wider text-[10px] rounded bg-neutral-200 dark:bg-neutral-800 px-1.5 py-0.5">
                          {log.action}
                        </span>
                        <span className="text-muted">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {parsedMeta.executionResult ? (
                        <p className="mt-1 text-foreground font-medium">{String(parsedMeta.executionResult)}</p>
                      ) : (
                        <p className="mt-1 text-muted font-mono text-[11px]">{log.metadata}</p>
                      )}
                    </div>
                    <div className="text-[11px] text-muted self-start sm:self-center">
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
            <div
              className={`rounded-xl p-3.5 text-xs font-medium flex items-center justify-between ${
                actionNotice.type === "success"
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20"
              }`}
            >
              <span>{actionNotice.msg}</span>
              <button
                onClick={() => setActionNotice(null)}
                className="opacity-70 hover:opacity-100 ml-4 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {filteredApprovals.length === 0 ? (
            <div className="rounded-3xl border border-line bg-card p-12 text-center">
              <div className="text-3xl mb-2">🛡️</div>
              <h3 className="text-base font-bold text-foreground">
                {activeTab === "pending"
                  ? "Zero pending approvals"
                  : `No ${activeTab} approvals found`}
              </h3>
              <p className="mt-1 text-xs text-muted max-w-md mx-auto">
                {activeTab === "pending"
                  ? "All clear! Your AI agents are operating safely within read-only boundaries. When an agent proposes an external action or creates tasks, it will appear here for your sign-off."
                  : "Try switching to another tab or asking an agent to plan a task."}
              </p>
              <Link
                href="/app/agents"
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-xs font-bold text-white hover:opacity-90 transition"
              >
                Open Agents Workspace
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
                  className="rounded-2xl border border-line bg-card p-5 transition hover:shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {renderStatusBadge(approval.status)}
                        <span className="text-xs text-muted font-medium">
                          Agent: <span className="text-foreground font-semibold">{approval.agentId}</span>
                        </span>
                        <span className="text-xs text-muted">·</span>
                        <span className="text-xs text-muted">
                          Created {new Date(approval.createdAt).toLocaleDateString()}
                        </span>
                        {approval.status === "pending" && (
                          <span className="rounded-md bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-[11px] font-mono text-muted">
                            TTL: {ttlRemaining}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-foreground pt-1">{approval.title}</h3>
                      <p className="text-xs text-muted leading-relaxed">{approval.description}</p>
                    </div>

                    {/* Action Controls for Pending Approvals */}
                    {approval.status === "pending" && (
                      <div className="flex items-center gap-2 self-end sm:self-start shrink-0 pt-2 sm:pt-0">
                        <button
                          onClick={() => handleAction(approval.id, "deny")}
                          disabled={isActing}
                          className="rounded-xl border border-line bg-card px-3.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 disabled:opacity-50 transition"
                        >
                          {isActing ? "Processing..." : "Deny"}
                        </button>
                        <button
                          onClick={() => handleAction(approval.id, "approve")}
                          disabled={isActing}
                          className="rounded-xl bg-brand px-4 py-1.5 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50 transition shadow-sm"
                        >
                          {isActing ? "Processing..." : "Approve Action"}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Proposed Action Inspection Details */}
                  {payload && (
                    <div className="mt-4 rounded-xl border border-line/60 bg-neutral-50/50 dark:bg-neutral-900/40 p-3.5 text-xs">
                      <div className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2">
                        Proposed System State Change:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <span className="text-muted">Action Type: </span>
                          <span className="font-mono font-semibold text-foreground">
                            {payload.type ?? "state_change"}
                          </span>
                        </div>
                        {payload.title && (
                          <div className="sm:col-span-2">
                            <span className="text-muted">Target Item: </span>
                            <span className="font-medium text-foreground">{payload.title}</span>
                          </div>
                        )}
                        {payload.priority && (
                          <div>
                            <span className="text-muted">Priority: </span>
                            <span className="capitalize font-medium text-foreground">{payload.priority}</span>
                          </div>
                        )}
                        {payload.dueDate && (
                          <div>
                            <span className="text-muted">Due Date: </span>
                            <span className="font-medium text-foreground">
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
