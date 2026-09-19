"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Agent = { id: string; name: string; role: string; description: string; category: string; template: string };

const META: Record<string, [string, string]> = {
  "study-coach": ["◒", "yellow"],
  "project-guide": ["⌘", "blue"],
  "career-scout": ["↗", "green"],
  "writing-buddy": ["✎", "lav"],
  "code-mentor": ["◉", "peach"],
  "interview-coach": ["☼", "peri"],
};

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const load = () => fetch("/api/agents").then((r) => r.json()).then((d) => setAgents(d.agents ?? []));
  useEffect(() => {
    fetch("/api/agents/ensure", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) }).then(load);
  }, []);
  async function createCustom() {
    if (!name.trim() || !role.trim()) return;
    const res = await fetch("/api/agents", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ template: "custom", name, role, description: role, category: "Custom" }),
    });
    if (res.ok) {
      setName(""); setRole(""); setShowForm(false); load();
    }
  }
  const cats = ["All", "Academic", "Projects", "Career", "Productivity", "Custom"];
  const shown = agents.filter((a) => filter === "All" || a.category === filter);
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Your AI team</h1>
          <p>Specialists that remember your goals and help you keep moving.</p>
        </div>
        <button className="button" onClick={() => setShowForm(!showForm)}>+ Create custom agent</button>
      </div>
      {showForm && (
        <div className="card form-card" id="create" style={{ marginBottom: 15 }}>
          <h3>Create your own</h3>
          <p>Build a focused agent with your own role, tone and context. Custom instructions cannot override safety rules.</p>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <label htmlFor="custom-name" className="sr-only">Agent name</label>
            <input id="custom-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" aria-label="Agent name" style={{ flex: 1, height: 44, padding: "0 14px", border: "1px solid var(--color-line)", borderRadius: 12 }} />
            <label htmlFor="custom-role" className="sr-only">Agent role</label>
            <input id="custom-role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role" aria-label="Agent role" style={{ flex: 1, height: 44, padding: "0 14px", border: "1px solid var(--color-line)", borderRadius: 12 }} />
            <button onClick={createCustom} className="button">Create</button>
          </div>
        </div>
      )}
      <div className="filter-pills" role="tablist" aria-label="Agent categories">
        {cats.map((c) => (
          <button key={c} role="tab" aria-selected={filter === c} onClick={() => setFilter(c)} className={filter === c ? "on" : ""}>{c}</button>
        ))}
      </div>
      {shown.length === 0 ? (
        <div className="card"><p>Activating your starter team…</p></div>
      ) : (
        <div className="grid">
          {shown.map((a) => {
            const [icon, color] = META[a.template] ?? ["✦", "yellow"];
            return (
              <article key={a.id} className="card agent-card">
                <div className={`agent-icon ${color}`}>{icon}</div>
                <h3>{a.name}</h3>
                <p>{a.description || a.role}</p>
                <div className="agent-foot">
                  <span>{a.category}</span>
                  <Link href={`/app/agents/${a.id}`} className="status" style={{ textDecoration: "none" }}>● Open →</Link>
                </div>
              </article>
            );
          })}
          <article className="card agent-card" id="create">
            <div className="agent-icon" style={{ background: "#eeeae1" }}>+</div>
            <h3>Create your own</h3>
            <p>Build a focused agent with your own role, tone and context.</p>
            <div className="agent-foot">
              <span>Custom</span>
              <button onClick={() => setShowForm(true)} style={{ color: "var(--color-brand)", fontWeight: 750, background: "none", border: 0, cursor: "pointer" }}>Create →</button>
            </div>
          </article>
        </div>
      )}
    </>
  );
}
