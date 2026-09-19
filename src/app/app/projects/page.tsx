"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Task = { id: string; title: string; status: string };
type Project = { id: string; name: string; description: string; type: string; tasks: Task[]; updatedAt: string };
type FileRow = { id: string; name: string; createdAt?: string };

const BAR = ["var(--color-brand)", "#86c8d2", "#a7c99d"];
const TAG_BG: Record<string, string> = { major: "#f0ece2", placement: "#dff3f5", semester: "#e4f0df", hackathon: "#ffe0d6" };

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [agents, setAgents] = useState<{ id: string; name: string }[]>([]);
  const [files, setFiles] = useState<FileRow[]>([]);
  const [name, setName] = useState("");
  const load = () => {
    fetch("/api/projects").then((r) => r.json()).then((d) => setProjects(d.projects ?? []));
    fetch("/api/agents").then((r) => r.json()).then((d) => setAgents(d.agents ?? []));
    fetch("/api/files").then((r) => r.json()).then((d) => setFiles(d.files ?? []));
  };
  useEffect(() => { load(); }, []);
  async function create() {
    if (!name.trim()) return;
    await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    setName("");
    load();
  }
  async function linkAgent(pid: string, agentId: string) {
    const proj = projects.find((p) => p.id === pid);
    const linked: string[] = JSON.parse((proj as unknown as { linkedAgentIds?: string })?.linkedAgentIds || "[]");
    if (!linked.includes(agentId)) linked.push(agentId);
    await fetch(`/api/projects/${pid}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ linkedAgentIds: linked }) });
    load();
  }
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Projects</h1>
          <p>Keep every milestone, file and agent in one focused workspace.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <label htmlFor="project-name" className="sr-only">New project name</label>
          <input id="project-name" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && create()} placeholder="New project name…" aria-label="New project name" style={{ height: 44, padding: "0 14px", border: "1px solid var(--color-line)", borderRadius: 999, background: "var(--color-card)" }} />
          <button className="button" onClick={create}>+ New project</button>
        </div>
      </div>
      {projects.length === 0 ? (
        <div className="card"><p>Add your major project and Project Guide will turn it into a milestone plan.</p></div>
      ) : (
        <div className="grid">
          {projects.map((p, i) => {
            const done = p.tasks.filter((t) => t.status === "completed").length;
            const pct = p.tasks.length ? Math.round((done / p.tasks.length) * 100) : 0;
            const remaining = p.tasks.length - done;
            return (
              <article key={p.id} className="card">
                <span className="tag" style={TAG_BG[p.type] ? { background: TAG_BG[p.type] } : {}}>{p.type || "Project"}</span>
                <h2 style={{ marginTop: 18 }}><Link href={`/app/projects/${p.id}`} style={{ textDecoration: "none" }}>{p.name}</Link></h2>
                <p>{p.description || "Add objectives and milestones with Project Guide."}</p>
                <div className="progress"><i style={{ width: `${pct}%`, background: BAR[i % BAR.length] }} /></div>
                <div className="agent-foot" style={{ marginTop: 10 }}>
                  <span>{remaining} tasks remaining</span><b>{pct}%</b>
                </div>
                <select aria-label={`Link agent to ${p.name}`} defaultValue="" onChange={(e) => e.target.value && linkAgent(p.id, e.target.value)} style={{ marginTop: 12, width: "100%", padding: 9, border: "1px solid var(--color-line)", borderRadius: 10, fontSize: 12 }}>
                  <option value="">Link an agent…</option>
                  {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </article>
            );
          })}
        </div>
      )}
      <section className="panel" style={{ marginTop: 18 }}>
        <div className="panel-head"><h2>Project activity</h2><Link href="/app/files">View timeline →</Link></div>
        {files.slice(0, 2).map((f) => (
          <div key={f.id} className="list-row">
            <div className="agent-icon yellow" style={{ margin: 0 }}>◒</div>
            <div className="grow"><b>Added {f.name}</b><small>Files & notes</small></div>
            <span className="tag">File</span>
          </div>
        ))}
        {projects.slice(0, 2).map((p) => (
          <div key={p.id} className="list-row">
            <div className="agent-icon blue" style={{ margin: 0 }}>⌘</div>
            <div className="grow"><b>{p.name}</b><small>{p.tasks.length} tasks · updated {new Date(p.updatedAt).toLocaleDateString()}</small></div>
            <span className="tag">Project</span>
          </div>
        ))}
        {projects.length === 0 && files.length === 0 && <p style={{ fontSize: 13, color: "var(--color-muted)" }}>No activity yet.</p>}
      </section>
    </>
  );
}
