"use client";
import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import { ErrorState } from "@/components/states";
import { ConfirmDialog } from "@/components/Dialog";
import { useRouter } from "next/navigation";

type Goal = {
  id: string; title: string; targetRole: string; status: string;
  deadline: string | null; notes: string;
};
type Application = { id: string; company: string; role: string; status: string };

const STATUSES = ["active", "paused", "achieved", "dropped"] as const;

export default function GoalPage({ params }: { params: Promise<{ goalId: string }> }) {
  const { goalId } = use(params);
  const router = useRouter();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/career/goals/${goalId}`, { cache: "no-store" });
      if (res.status === 404) throw new Error("Goal not found.");
      if (!res.ok) throw new Error("Could not load goal.");
      const d = await res.json();
      setGoal(d.goal);
      setNotes(d.goal.notes ?? "");
      setApps(d.applications ?? []);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed.");
    } finally {
      setLoading(false);
    }
  }, [goalId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function patch(body: Record<string, unknown>) {
    const res = await fetch(`/api/career/goals/${goalId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("Update failed.");
    void load();
  }

  async function saveNotes() {
    setSaving(true);
    try {
      await patch({ notes });
    } catch {
      setError("Could not save notes.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    await fetch(`/api/career/goals/${goalId}`, { method: "DELETE" });
    router.push("/app/career");
  }

  if (loading) return <main className="p-8">Loading goal…</main>;
  if (error || !goal)
    return (
      <main className="p-8">
        <ErrorState message={error || "Goal not found."} retry={() => void load()} />
        <p style={{ marginTop: 12 }}><Link href="/app/career">← Career center</Link></p>
      </main>
    );

  const related = apps.filter((a) => goal.targetRole && a.role.toLowerCase().includes(goal.targetRole.toLowerCase()));

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", paddingBottom: 40 }}>
      <p><Link href="/app/career">← Career center</Link></p>
      <div className="page-head">
        <div>
          <h1>{goal.title}</h1>
          <p>{goal.targetRole || "No target role"}{goal.deadline ? ` · Due ${new Date(goal.deadline).toLocaleDateString()}` : ""}</p>
        </div>
        <span className="tag">{goal.status}</span>
      </div>

      <section className="panel" style={{ marginBottom: 16 }}>
        <div className="panel-head"><h2>Status</h2></div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {STATUSES.map((s) => (
            <button
              key={s} type="button" onClick={() => void patch({ status: s }).catch(() => setError("Update failed."))}
              aria-pressed={goal.status === s} className={`subject-chip ${goal.status === s ? "active" : ""}`}
            >
              {s}
            </button>
          ))}
        </div>
      </section>

      <section className="panel" style={{ marginBottom: 16 }}>
        <div className="panel-head"><h2>Preparation notes</h2></div>
        <label className="sr-only" htmlFor="goal-notes">Preparation notes</label>
        <textarea
          id="goal-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4}
          placeholder="Skills to build, people to talk to, deadlines…"
          className="qa-control"
          style={{ width: "100%", height: "auto", minHeight: 96 }}
        />
        <button type="button" onClick={() => void saveNotes()} disabled={saving} className="button primary sm" style={{ marginTop: 8 }}>
          {saving ? "Saving…" : "Save notes"}
        </button>
      </section>

      <section className="panel" style={{ marginBottom: 16 }}>
        <div className="panel-head"><h2>Related applications</h2><Link href="/app/career">Tracker →</Link></div>
        {related.length === 0 && <p style={{ fontSize: 13, color: "var(--color-muted)" }}>No applications match this target role yet.</p>}
        {related.map((a) => (
          <div key={a.id} className="focus">
            <div className="focus-body"><b>{a.role} @ {a.company}</b><p>{a.status}</p></div>
          </div>
        ))}
      </section>

      <button type="button" onClick={() => setConfirmDelete(true)} className="link-danger">
        Delete goal
      </button>
      <ConfirmDialog
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => void remove()}
        title={`Delete "${goal.title}"?`}
        description="This removes the goal and its notes. Applications are kept."
        confirmText="Delete goal"
        cancelText="Cancel"
        variant="danger"
      />
    </main>
  );
}
