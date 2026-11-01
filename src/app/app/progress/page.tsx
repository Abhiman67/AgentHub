"use client";

import { useEffect, useState } from "react";
import { ErrorState } from "@/components/states";

type Task = { status: string };
type Project = { id: string; name: string; tasks: Task[] };
type Subject = { topics: { mastery: string }[] };

export default function ProgressPage() {
  const [data, setData] = useState<{ tasks: Task[]; projects: Project[]; subjects: Subject[] } | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { void Promise.all([fetch("/api/tasks"), fetch("/api/projects"), fetch("/api/subjects")]).then(async ([t, p, s]) => { if (!t.ok || !p.ok || !s.ok) throw new Error("Could not load progress."); const [tasks, projects, subjects] = await Promise.all([t.json(), p.json(), s.json()]); setData({ tasks: tasks.tasks ?? [], projects: projects.projects ?? [], subjects: subjects.subjects ?? [] }); }).catch((e) => setError(e instanceof Error ? e.message : "Could not load progress.")); }, []);
  if (error) return <main className="p-8"><ErrorState message={error} retry={() => window.location.reload()} /></main>;
  if (!data) return <main className="p-8">Loading progress…</main>;
  const completed = data.tasks.filter((t) => t.status === "completed").length;
  const topicCount = data.subjects.reduce((sum, s) => sum + s.topics.length, 0);
  const confident = data.subjects.reduce((sum, s) => sum + s.topics.filter((t) => t.mastery === "confident").length, 0);
  return <main style={{ maxWidth: 900, margin: "0 auto", paddingBottom: 40 }}><div className="page-head"><div><h1>Progress</h1><p>Evidence from completed work and recorded mastery, without invented scores.</p></div></div><div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}><section className="panel"><span className="text-xs text-muted">Tasks completed</span><h2 style={{ fontSize: 30, margin: "8px 0 0" }}>{completed}<span style={{ fontSize: 14, color: "var(--color-muted)" }}> / {data.tasks.length}</span></h2></section><section className="panel"><span className="text-xs text-muted">Active projects</span><h2 style={{ fontSize: 30, margin: "8px 0 0" }}>{data.projects.length}</h2></section><section className="panel"><span className="text-xs text-muted">Confident topics</span><h2 style={{ fontSize: 30, margin: "8px 0 0" }}>{confident}<span style={{ fontSize: 14, color: "var(--color-muted)" }}> / {topicCount}</span></h2></section></div><section className="panel" style={{ marginTop: 16 }}><div className="panel-head"><h2>Project momentum</h2></div>{data.projects.length === 0 ? <p style={{ color: "var(--color-muted)", fontSize: 13 }}>Create a project to see progress here.</p> : data.projects.map((p) => { const done = p.tasks.filter((t) => t.status === "completed").length; const pct = p.tasks.length ? Math.round(done / p.tasks.length * 100) : 0; return <div key={p.id} style={{ marginBottom: 14 }}><div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><b>{p.name}</b><span>{pct}%</span></div><div className="bar"><i style={{ width: `${pct}%` }} /></div></div>; })}</section></main>;
}
