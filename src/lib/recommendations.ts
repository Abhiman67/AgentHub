/**
 * Rule-based recommendations (master spec §5.2). Pure function of workspace
 * state — deterministic, testable, no LLM. Each candidate has a stable key
 * so interactions (accept/dismiss/snooze) persist by key.
 */
export type RecInput = {
  now: number;
  tasks: { id: string; title: string; status: string; dueDate: string | null; priority: string }[];
  projects: { id: string; name: string; targetDate: string | null; status: string }[];
  approvals: { id: string; title: string }[];
  files: { id: string; name: string; status: string }[];
  agents: { id: string; name: string; template: string }[];
  conversationsByAgent: Record<string, number>;
};

export type RecCandidate = {
  key: string;
  kind: "overdue" | "due_soon" | "approval_pending" | "project_deadline" | "file_failed" | "idle_agent";
  title: string;
  body: string;
  reason: string;
  source: { type: string; id: string; label: string };
  href: string;
  rank: number;
};

const DAY = 24 * 60 * 60 * 1000;

export function buildRecommendations(input: RecInput): RecCandidate[] {
  const out: RecCandidate[] = [];
  const { now } = input;

  for (const a of input.approvals.slice(0, 5)) {
    out.push({
      key: `approval_pending:${a.id}`,
      kind: "approval_pending",
      title: `Review: ${a.title.slice(0, 80)}`,
      body: "An agent is waiting for your decision. Nothing runs until you approve or deny.",
      reason: "Agent requests need a human decision before execution.",
      source: { type: "approval", id: a.id, label: a.title },
      href: "/app/approvals",
      rank: 0,
    });
  }

  for (const t of input.tasks.filter((t) => t.status !== "completed" && t.status !== "cancelled")) {
    if (!t.dueDate) continue;
    const due = new Date(t.dueDate).getTime();
    if (Number.isNaN(due)) continue;
    if (due < now) {
      out.push({
        key: `overdue:${t.id}`,
        kind: "overdue",
        title: `Overdue: ${t.title.slice(0, 80)}`,
        body: `Was due ${new Date(due).toLocaleDateString()}. Reschedule or complete it to keep momentum.`,
        reason: "Due date passed with the task still open.",
        source: { type: "task", id: t.id, label: t.title },
        href: "/app/tasks",
        rank: 1,
      });
    } else if (due - now <= 3 * DAY) {
      out.push({
        key: `due_soon:${t.id}`,
        kind: "due_soon",
        title: `Due soon: ${t.title.slice(0, 80)}`,
        body: `Due ${new Date(due).toLocaleDateString()}. Start early — even 25 minutes helps.`,
        reason: "Due within 3 days.",
        source: { type: "task", id: t.id, label: t.title },
        href: "/app/tasks",
        rank: 2,
      });
    }
  }

  for (const p of input.projects.filter((p) => p.status === "active" && p.targetDate)) {
    const target = new Date(p.targetDate as string).getTime();
    if (!Number.isNaN(target) && target - now <= 7 * DAY) {
      out.push({
        key: `project_deadline:${p.id}`,
        kind: "project_deadline",
        title: `${p.name.slice(0, 60)} deadline approaching`,
        body: `Target ${new Date(target).toLocaleDateString()}. Ask Project Guide to trim scope if at risk.`,
        reason: "Active project target within 7 days.",
        source: { type: "project", id: p.id, label: p.name },
        href: `/app/projects/${p.id}`,
        rank: 3,
      });
    }
  }

  for (const f of input.files.filter((f) => f.status === "failed").slice(0, 3)) {
    out.push({
      key: `file_failed:${f.id}`,
      kind: "file_failed",
      title: `Couldn't read ${f.name.slice(0, 60)}`,
      body: "Re-upload as TXT/Markdown or retry processing from Files.",
      reason: "File extraction failed; the file is not searchable yet.",
      source: { type: "file", id: f.id, label: f.name },
      href: "/app/files",
      rank: 4,
    });
  }

  for (const a of input.agents) {
    if ((input.conversationsByAgent[a.id] ?? 0) === 0) {
      out.push({
        key: `idle_agent:${a.id}`,
        kind: "idle_agent",
        title: `Meet ${a.name}`,
        body: "You haven't chatted yet. Start with a suggested prompt — it takes a minute.",
        reason: "Agent added but never opened.",
        source: { type: "agent", id: a.id, label: a.name },
        href: `/app/agents/${a.id}`,
        rank: 5,
      });
    }
  }

  return out.sort((x, y) => x.rank - y.rank || x.key.localeCompare(y.key)).slice(0, 10);
}
