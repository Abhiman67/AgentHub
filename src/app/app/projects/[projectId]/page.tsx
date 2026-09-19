"use client";
import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/Dialog";

type Task = { id: string; title: string; status: string; priority: string };
type Agent = { id: string; name: string; template: string };
type Project = {
  id: string;
  name: string;
  description: string;
  type: string;
  status: string;
  linkedAgentIds: string;
  members: string;
  tasks: Task[];
};

export default function ProjectDetailPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [pRes, aRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch("/api/agents"),
      ]);
      if (pRes.ok) {
        const pData = await pRes.json();
        setProject(pData.project);
      }
      if (aRes.ok) {
        const aData = await aRes.json();
        setAgents(aData.agents ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  async function toggleTask(t: Task) {
    const nextStatus = t.status === "completed" ? "todo" : "completed";
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: t.id, status: nextStatus }),
    });
    load();
  }

  async function addTask() {
    if (!newTaskTitle.trim()) return;
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTaskTitle,
        projectId,
        priority: "medium",
      }),
    });
    setNewTaskTitle("");
    load();
  }

  async function updateStatus(status: string) {
    await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function handleConfirmDelete() {
    setDeleting(true);
    try {
      await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
      router.push("/app/projects");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-8 animate-pulse">
        <div className="h-4 w-28 bg-neutral-200 dark:bg-neutral-800 rounded mb-6" />
        <div className="h-8 w-64 bg-neutral-200 dark:bg-neutral-800 rounded mb-3" />
        <div className="h-4 w-48 bg-neutral-200 dark:bg-neutral-800 rounded mb-8" />
        <div className="rounded-3xl border border-line bg-card p-6 h-64" />
      </main>
    );
  }
  if (!project) {
    return (
      <main className="mx-auto max-w-md p-12 text-center">
        <div className="text-3xl mb-2">▣</div>
        <h2 className="text-lg font-bold">Project not found</h2>
        <p className="text-sm text-muted mt-1">This project may have been removed or archived.</p>
        <Link href="/app/projects" className="button primary mt-4 inline-flex" style={{ display: "inline-flex" }}>
          Back to Projects
        </Link>
      </main>
    );
  }

  const agentMap = new Map<string, string>();
  agents.forEach((a) => {
    agentMap.set(a.id, a.name);
    agentMap.set(a.template, a.name);
  });

  const linked: string[] = JSON.parse(project.linkedAgentIds || "[]");
  const linkedNames = linked.map((id) => agentMap.get(id) || id);
  const tasks = project.tasks ?? [];
  const done = tasks.filter((t) => t.status === "completed");
  const todo = tasks.filter((t) => t.status !== "completed");
  const pct = tasks.length ? Math.round((done.length / tasks.length) * 100) : 0;

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <Link href="/app/projects" className="text-sm underline">← Back to projects</Link>
        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          style={{ background: "none", border: 0, color: "#c0392b", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
        >
          Delete project
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
        <div>
          <h1 className="text-3xl font-extrabold" style={{ margin: 0 }}>{project.name}</h1>
          <p className="text-sm text-muted" style={{ marginTop: 4 }}>
            {project.type} · {tasks.length} tasks total ({done.length} completed)
          </p>
        </div>

        <select
          value={project.status}
          onChange={(e) => updateStatus(e.target.value)}
          aria-label="Project status"
          style={{
            padding: "6px 12px",
            borderRadius: 999,
            border: "1px solid var(--color-line)",
            background: "var(--color-card)",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div style={{ marginTop: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
          <span>Overall Progress</span>
          <span>{pct}%</span>
        </div>
        <div style={{ width: "100%", height: 8, background: "var(--color-line)", borderRadius: 999, overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: "var(--color-brand)", transition: "width 0.3s ease" }} />
        </div>
      </div>

      <p className="mt-4 text-sm" style={{ color: "var(--color-ink)", lineHeight: 1.6 }}>
        {project.description || "No description set. Ask Project Guide to help outline your milestone objectives."}
      </p>

      <section className="mt-6 rounded-3xl border border-line bg-card p-5">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <p className="font-bold" style={{ margin: 0 }}>Project Milestones & Tasks</p>
          <span className="tag" style={{ fontSize: 11 }}>{todo.length} remaining</span>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <input
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            placeholder="Add milestone task to this project…"
            style={{ flex: 1, height: 38, padding: "0 12px", borderRadius: 10, border: "1px solid var(--color-line)", fontSize: 13 }}
          />
          <button onClick={addTask} className="button" style={{ height: 38, padding: "0 14px", fontSize: 12 }}>
            + Add
          </button>
        </div>

        {tasks.length === 0 ? (
          <p className="text-sm text-muted">No milestones yet. Add one above or ask Project Guide.</p>
        ) : (
          <div className="space-y-2">
            {tasks.map((t) => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: "1px solid var(--color-line)" }}>
                <button
                  onClick={() => toggleTask(t)}
                  className={`check${t.status === "completed" ? " done" : ""}`}
                  style={{ cursor: "pointer", background: "none", width: 20, height: 20, fontSize: 11 }}
                >
                  {t.status === "completed" ? "✓" : ""}
                </button>
                <span style={{ fontSize: 13, textDecoration: t.status === "completed" ? "line-through" : "none", color: t.status === "completed" ? "var(--color-muted)" : "inherit" }}>
                  {t.title}
                </span>
                <span className="tag" style={{ marginLeft: "auto", fontSize: 10 }}>
                  {t.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="mt-4 rounded-3xl border border-line bg-card p-5">
        <p className="font-bold">Linked agents</p>
        <p className="text-sm text-muted">
          {linkedNames.length ? linkedNames.join(", ") : "No agents linked yet. Link Project Guide or Code Mentor from the Projects directory."}
        </p>
      </div>

      <ConfirmDialog
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title={`Delete "${project.name}"?`}
        description="Are you sure you want to delete this project? All associated milestones, checklists, and agent bindings will be permanently deleted."
        confirmText="Delete Project"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
      />
    </main>
  );
}
