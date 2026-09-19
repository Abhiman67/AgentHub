"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ConfirmDialog } from "@/components/Dialog";

type Agent = { id: string; name: string; role: string; category: string };

export default function MemorySettings() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [clearingId, setClearingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string>("");
  const [targetAgent, setTargetAgent] = useState<Agent | null>(null);

  useEffect(() => {
    fetch("/api/agents")
      .then((r) => r.json())
      .then((d) => setAgents(d.agents ?? []));
  }, []);

  async function handleConfirmClear() {
    if (!targetAgent) return;
    const agentId = targetAgent.id;
    const agentName = targetAgent.name;
    setClearingId(agentId);
    setFeedback("");
    try {
      const list = await fetch(`/api/agents/${agentId}/conversations`).then((r) => r.json());
      const convs = list.conversations ?? [];
      for (const c of convs) {
        await fetch(`/api/conversations/${c.id}`, { method: "DELETE" });
      }
      setFeedback(`Memory and conversation history cleared for ${agentName}.`);
      setTargetAgent(null);
    } finally {
      setClearingId(null);
    }
  }

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", paddingBottom: 40 }}>
      {/* Settings Breadcrumb */}
      <div style={{ marginBottom: 18 }}>
        <Link
          href="/app/settings"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12.5,
            fontWeight: 700,
            color: "var(--color-muted)",
            textDecoration: "none",
            padding: "5px 12px",
            background: "var(--color-paper)",
            border: "1px solid var(--color-line)",
            borderRadius: 8,
            transition: "all 0.12s ease",
          }}
        >
          <span>‹</span> Settings
        </Link>
      </div>

      <div className="page-head" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div className="agent-icon lav" style={{ width: 44, height: 44, fontSize: 20 }}>
            ◎
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 24 }}>Agent Memory & Context</h1>
            <p style={{ margin: "4px 0 0" }}>Control what your agents remember. You can reset an agent&apos;s memory anytime.</p>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 20, background: "var(--color-paper)" }}>
        <h3 style={{ fontSize: 14, margin: "0 0 6px" }}>How AgentHub Memory Works</h3>
        <p style={{ fontSize: 13, color: "var(--color-ink)", lineHeight: 1.6, margin: 0 }}>
          Agents access your active project milestones, uploaded lecture notes, and recent conversation history to provide accurate, grounded assistance. Custom instructions never override safety and approval rules.
        </p>
      </div>

      {feedback && (
        <div style={{ padding: 12, borderRadius: 12, background: "#f0f8ed", border: "1px solid #c0e3ba", marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: "#2d6325", fontWeight: 700, margin: 0 }}>✓ {feedback}</p>
        </div>
      )}

      <div className="panel">
        <div className="panel-head" style={{ marginBottom: 14 }}>
          <h2>Active Agents</h2>
          <span className="tag">{agents.length} configured</span>
        </div>

        {agents.length === 0 ? (
          <p className="text-sm text-muted">No agents found.</p>
        ) : (
          <div className="space-y-3">
            {agents.map((a) => (
              <div
                key={a.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 0",
                  borderBottom: "1px solid var(--color-line)",
                }}
              >
                <div>
                  <b style={{ fontSize: 14 }}>{a.name}</b>
                  <p style={{ fontSize: 12, color: "var(--color-muted)", margin: "2px 0 0" }}>
                    {a.role} · {a.category}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setTargetAgent(a)}
                  disabled={clearingId === a.id}
                  className="tag"
                  style={{
                    cursor: "pointer",
                    border: "1px solid var(--color-line)",
                    padding: "6px 12px",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#c0392b",
                  }}
                >
                  {clearingId === a.id ? "Clearing…" : "Clear history"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={Boolean(targetAgent)}
        onClose={() => setTargetAgent(null)}
        onConfirm={handleConfirmClear}
        title={`Reset memory for ${targetAgent?.name}?`}
        description={`Are you sure you want to delete all stored conversations, past reflections, and context for ${targetAgent?.name}? This agent will restart with fresh memory.`}
        confirmText="Clear Memory"
        cancelText="Cancel"
        variant="danger"
        loading={Boolean(clearingId)}
      />
    </main>
  );
}
