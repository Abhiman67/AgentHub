"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/states";

type Subject = {
  id: string; name: string; code: string | null; examDate: string | null;
  topics: { id: string; mastery: string }[];
  _count: { sessions: number };
  daysToExam: number | null;
};

const MASTERY_LABEL: Record<string, string> = {
  unknown: "Not started", learning: "Learning", practiced: "Practiced", confident: "Confident", needs_review: "Needs review",
};

export default function LearningPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [topics, setTopics] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/subjects", { cache: "no-store" });
      if (!res.ok) throw new Error("Could not load subjects.");
      const now = Date.now();
      const rows = ((await res.json()).subjects ?? []) as Omit<Subject, "daysToExam">[];
      setSubjects(rows.map((s) => ({
        ...s,
        daysToExam: s.examDate ? Math.ceil((new Date(s.examDate).getTime() - now) / 86400000) : null,
      })));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function create() {
    if (!name.trim()) return;
    const topicNames = topics.split(",").map((t) => t.trim()).filter(Boolean);
    const res = await fetch("/api/subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), code: code.trim() || undefined, topics: topicNames.length ? topicNames : undefined }),
    });
    if (!res.ok) {
      setError("Could not create subject.");
      return;
    }
    setName("");
    setCode("");
    setTopics("");
    void load();
  }

  if (loading) return <main className="p-8"><LoadingSkeleton /></main>;
  if (error && subjects.length === 0) return <main className="p-8"><ErrorState message={error} retry={() => void load()} /></main>;

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", paddingBottom: 40 }}>
      <div className="page-head">
        <div>
          <h1>Learning</h1>
          <p>Subjects, mastery, and revision — evidence-based, never guessed.</p>
        </div>
      </div>
      <div className="panel" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 14, margin: "0 0 8px" }}>New subject</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <label className="sr-only" htmlFor="subject-name">Subject name</label>
          <input id="subject-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Data Mining" className="qa-control" style={{ flex: 2, minWidth: 160 }} />
          <label className="sr-only" htmlFor="subject-code">Subject code</label>
          <input id="subject-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code (optional)" className="qa-control" style={{ flex: 1, minWidth: 100 }} />
          <label className="sr-only" htmlFor="subject-topics">Topics</label>
          <input id="subject-topics" value={topics} onChange={(e) => setTopics(e.target.value)} placeholder="Topics, comma separated" className="qa-control" style={{ flex: 3, minWidth: 180 }} />
          <button type="button" onClick={() => void create()} disabled={!name.trim()} className="button primary sm">Add</button>
        </div>
      </div>
      {subjects.length === 0 ? (
        <EmptyState title="No subjects yet" body="Add your first subject to track mastery and generate revision plans." />
      ) : (
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
          {subjects.map((s) => {
            const confident = s.topics.filter((t) => t.mastery === "confident").length;
            const days = s.daysToExam;
            return (
              <Link key={s.id} href={`/app/learning/${s.id}`} className="card" style={{ textDecoration: "none", color: "inherit" }}>
                <h3 style={{ margin: "0 0 4px" }}>{s.name}</h3>
                <p style={{ fontSize: 12, color: "var(--color-muted)", margin: 0 }}>
                  {s.code ? `${s.code} · ` : ""}{s.topics.length} topics · {confident} confident
                </p>
                <p style={{ fontSize: 12, margin: "6px 0 0" }}>
                  {days === null ? "No exam date set" : days < 0 ? "Exam passed — archive or review" : days === 0 ? "Exam today" : `${days} days to exam`}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
