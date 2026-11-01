"use client";
import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/states";
import Dropdown from "@/components/Dropdown";

type Topic = { id: string; name: string; mastery: string; position: number };
type Outcome = { id: string; text: string };
type Session = { id: string; title: string; scheduledFor: string | null; durationMin: number; status: string };
type SubjectFile = { id: string; name: string; status: string };
type Subject = {
  id: string; name: string; code: string | null; examDate: string | null;
  topics: Topic[]; outcomes: Outcome[]; sessions: Session[]; files: SubjectFile[];
};

const MASTERY_STYLE: Record<string, string> = {
  unknown: "#9a978f", learning: "#0ea5c6", practiced: "#c95938", confident: "#2d6325", needs_review: "#c0392b",
};

export default function SubjectPage({ params }: { params: Promise<{ subjectId: string }> }) {
  const { subjectId } = use(params);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newTopics, setNewTopics] = useState("");
  const [newOutcome, setNewOutcome] = useState("");
  const [quiz, setQuiz] = useState<Record<string, { score: string; total: string }>>({});

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/subjects/${subjectId}`, { cache: "no-store" });
      if (res.status === 404) throw new Error("Subject not found.");
      if (!res.ok) throw new Error("Could not load subject.");
      setSubject((await res.json()).subject);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed.");
    } finally {
      setLoading(false);
    }
  }, [subjectId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function post(path: string, body: unknown, method = "POST") {
    const res = await fetch(path, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.error?.message ?? "Action failed.");
    }
    return res.json();
  }

  async function addTopics() {
    const names = newTopics.split(",").map((t) => t.trim()).filter(Boolean);
    if (!names.length) return;
    await post(`/api/subjects/${subjectId}/topics`, { names });
    setNewTopics("");
    void load();
  }

  async function recordEvidence(topicId: string, kind: string, score?: string, total?: string, note?: string) {
    await post(`/api/subjects/${subjectId}/evidence`, {
      topicId, kind,
      ...(score !== undefined && score !== "" ? { score: Number(score), total: Number(total) || 100 } : {}),
      ...(note ? { note } : {}),
    });
    void load();
  }

  async function generatePlan() {
    await post(`/api/subjects/${subjectId}/revision-plan`, {});
    void load();
  }

  async function setSession(id: string, status: string) {
    await post(`/api/subjects/${subjectId}/sessions`, { id, status }, "PATCH");
    void load();
  }

  async function detachFile(fileId: string) {
    await fetch(`/api/subjects/${subjectId}/files?fileId=${fileId}`, { method: "DELETE" });
    void load();
  }

  if (loading) return <main className="p-8"><LoadingSkeleton /></main>;
  if (error || !subject)
    return (
      <main className="p-8">
        <ErrorState message={error || "Subject not found."} retry={() => void load()} />
        <p style={{ marginTop: 12 }}><Link href="/app/learning">← All subjects</Link></p>
      </main>
    );

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", paddingBottom: 40 }}>
      <p><Link href="/app/learning">← All subjects</Link></p>
      <div className="page-head">
        <div>
          <h1>{subject.name}</h1>
          <p>{subject.code ?? "No code"} · {subject.examDate ? `Exam ${new Date(subject.examDate).toLocaleDateString()}` : "No exam date"} · {subject.topics.length} topics</p>
        </div>
        <Link className="button" href="/app/agents">Ask Study Coach →</Link>
      </div>

      <section className="panel" style={{ marginBottom: 16 }}>
        <div className="panel-head"><h2>Topics & mastery</h2><span style={{ fontSize: 11, color: "var(--color-muted)" }}>Mastery comes from evidence only</span></div>
        {subject.topics.length === 0 && <p style={{ fontSize: 13, color: "var(--color-muted)" }}>No topics yet — add them below.</p>}
        {subject.topics.map((t) => (
          <div key={t.id} className="focus">
            <div className="focus-body">
              <b>{t.name}</b>
              <p><span className="tag" style={{ background: `${MASTERY_STYLE[t.mastery] ?? "#999"}22`, color: MASTERY_STYLE[t.mastery] ?? "#666" }}>{t.mastery.replace(/_/g, " ")}</span></p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                <button type="button" className="tag" onClick={() => void recordEvidence(t.id, "self_review", undefined, undefined, "feeling confident now")}>I know this ✓</button>
                <button type="button" className="tag" onClick={() => void recordEvidence(t.id, "self_review", undefined, undefined, "still weak here")}>Still weak</button>
                <button
                  type="button" className="tag"
                  onClick={() => {
                    const s = quiz[t.id]?.score ?? "";
                    const tot = quiz[t.id]?.total ?? "100";
                    if (s === "") return;
                    void recordEvidence(t.id, "quiz", s, tot);
                  }}
                >
                  Log quiz:
                </button>
                <label className="sr-only" htmlFor={`score-${t.id}`}>Quiz score</label>
                <input
                  id={`score-${t.id}`} placeholder="score/total" value={quiz[t.id] ? `${quiz[t.id].score}/${quiz[t.id].total}` : ""}
                  onChange={(e) => {
                    const [s = "", tot = "100"] = e.target.value.split("/");
                    setQuiz((q) => ({ ...q, [t.id]: { score: s.replace(/\D/g, ""), total: tot.replace(/\D/g, "") || "100" } }));
                  }}
                  className="qa-control"
                  style={{ width: 90 }}
                />
              </div>
            </div>
          </div>
        ))}
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <label className="sr-only" htmlFor="new-topics">New topics</label>
          <input id="new-topics" value={newTopics} onChange={(e) => setNewTopics(e.target.value)} placeholder="Add topics, comma separated" className="qa-control" style={{ flex: 1 }} />
          <button type="button" onClick={() => void addTopics().catch(() => setError("Could not add topics."))} className="button sm">Add</button>
        </div>
      </section>

      <section className="panel" style={{ marginBottom: 16 }}>
        <div className="panel-head"><h2>Revision plan</h2><button type="button" onClick={() => void generatePlan().catch(() => setError("Add topics first."))} className="button sm">Generate plan</button></div>
        {subject.sessions.length === 0 && <p style={{ fontSize: 13, color: "var(--color-muted)" }}>No sessions yet. Generate a plan — weakest topics first.</p>}
        {subject.sessions.map((s) => (
          <div key={s.id} className="focus">
            <div className="focus-body"><b>{s.title}</b><p>{s.scheduledFor ? new Date(s.scheduledFor).toLocaleDateString() : "Unscheduled"} · {s.durationMin} min · {s.status}</p></div>
            {s.status === "planned" && (
              <div style={{ display: "flex", gap: 6 }}>
                <button type="button" className="tag" onClick={() => void setSession(s.id, "done").catch(() => setError("Update failed."))}>Done</button>
                <button type="button" className="tag" onClick={() => void setSession(s.id, "skipped").catch(() => setError("Update failed."))}>Skip</button>
              </div>
            )}
          </div>
        ))}
      </section>

      <section className="panel" style={{ marginBottom: 16 }}>
        <div className="panel-head"><h2>Outcomes</h2></div>
        {subject.outcomes.length === 0 && <p style={{ fontSize: 13, color: "var(--color-muted)" }}>No learning outcomes recorded.</p>}
        {subject.outcomes.map((o) => (
          <p key={o.id} style={{ fontSize: 13, margin: "4px 0" }}>• {o.text}</p>
        ))}
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <label className="sr-only" htmlFor="new-outcome">New outcome</label>
          <input id="new-outcome" value={newOutcome} onChange={(e) => setNewOutcome(e.target.value)} placeholder="e.g. Explain normalization up to 3NF" className="qa-control" style={{ flex: 1 }} />
          <button
            type="button" className="button sm"
            onClick={() => {
              if (!newOutcome.trim()) return;
              void post(`/api/subjects/${subjectId}/outcomes`, { text: newOutcome.trim() }).then(() => {
                setNewOutcome("");
                load();
              }).catch(() => setError("Could not add outcome."));
            }}
          >
            Add
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head"><h2>Source materials</h2><Link href="/app/files">Manage files →</Link></div>
        {subject.files.length === 0 && <p style={{ fontSize: 13, color: "var(--color-muted)" }}>No files attached. Attach notes from Files to ground revision in your material.</p>}
        {subject.files.map((f) => (
          <div key={f.id} className="focus">
            <div className="focus-body"><b>{f.name}</b><p>{f.status}</p></div>
            <button type="button" className="tag" onClick={() => void detachFile(f.id)}>Detach</button>
          </div>
        ))}
        <AttachFile subjectId={subjectId} attached={new Set(subject.files.map((f) => f.id))} onDone={() => void load()} />
      </section>
      {error && <p role="alert" style={{ color: "#c0392b", fontSize: 13, marginTop: 12 }}>{error}</p>}
    </main>
  );
}

function AttachFile({ subjectId, attached, onDone }: { subjectId: string; attached: Set<string>; onDone: () => void }) {
  const [files, setFiles] = useState<{ id: string; name: string }[]>([]);
  const [pick, setPick] = useState("");
  useEffect(() => {
    fetch("/api/files").then((r) => r.json()).then((d) => setFiles(d.files ?? [])).catch(() => undefined);
  }, []);
  const options = files.filter((f) => !attached.has(f.id));
  if (options.length === 0) return null;
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
      <Dropdown
        value={pick}
        options={[{ value: "", label: "Attach a file…" }, ...options.map((f) => ({ value: f.id, label: f.name }))]}
        onChange={setPick}
        label="Attach a file"
      />
      <button
        type="button" className="button sm" disabled={!pick}
        onClick={() => {
          fetch(`/api/subjects/${subjectId}/files`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileId: pick }) }).then(() => {
            setPick("");
            onDone();
          });
        }}
      >
        Attach
      </button>
    </div>
  );
}
