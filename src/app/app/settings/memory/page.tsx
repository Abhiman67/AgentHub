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
        <Link href="/app/settings" className="button secondary sm">
          Settings
        </Link>
      </div>

      <div className="page-head" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div className="agent-icon lav" style={{ width: 44, height: 44, fontSize: 20 }}>
            ◎
          </div>
          <div>
            <h1>Agent memory and context</h1>
            <p>Control what your agents remember. You can reset an agent&apos;s memory anytime.</p>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, margin: "0 0 6px" }}>How Backoff memory works</h3>
        <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>
          Agents access your active project milestones, uploaded lecture notes, and recent conversation history to provide accurate, grounded assistance. Custom instructions never override safety and approval rules.
        </p>
      </div>

      {feedback && (
        <div className="panel" style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>{feedback}</p>
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
              <div key={a.id} className="list-row">
                <div className="grow">
                  <b style={{ fontSize: 14 }}>{a.name}</b>
                  <p style={{ fontSize: 12, color: "var(--color-muted)", margin: "2px 0 0" }}>
                    {a.role} · {a.category}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setTargetAgent(a)}
                  disabled={clearingId === a.id}
                  className="link-danger"
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
