import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";

const agentIcon: Record<string, [string, string]> = {
  "study-coach": ["◒", "yellow"],
  "project-guide": ["⌘", "blue"],
  "career-scout": ["↗", "green"],
  "writing-buddy": ["✎", "lavender"],
  "code-mentor": ["◉", "peach"],
  "interview-coach": ["☼", "peri"],
};

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

export default async function AppHome() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");
  const user = await db.user.findUnique({ where: { email: session.user.email }, include: { profile: true } });
  if (!user) redirect("/login");
  if (!user.profile?.onboardingDone) redirect("/onboarding");

  const first = user.name.split(" ")[0];
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const [tasks, projects, agents, apps, files, doneCount] = await Promise.all([
    db.task.findMany({ where: { ownerId: user.id }, orderBy: { createdAt: "desc" }, take: 20 }),
    db.project.findMany({ where: { ownerId: user.id }, include: { tasks: true }, orderBy: { updatedAt: "desc" }, take: 3 }),
    db.agent.findMany({ where: { ownerId: user.id }, orderBy: { createdAt: "asc" }, take: 6 }),
    db.application.findMany({ where: { ownerId: user.id }, take: 50 }),
    db.file.findMany({ where: { ownerId: user.id }, orderBy: { createdAt: "desc" }, take: 5 }),
    db.task.count({ where: { ownerId: user.id, status: "completed" } }),
  ]);

  const focus = tasks.filter((t) => t.status !== "completed").slice(0, 4);
  const deadlines = tasks.filter((t) => t.dueDate && t.status !== "completed").sort((a, b) => +new Date(a.dueDate!) - +new Date(b.dueDate!)).slice(0, 3);
  const interviews = apps.filter((a) => a.status === "interviewing").length;
  const soonApps = apps.filter((a) => ["applied", "interviewing"].includes(a.status)).length;

  const step1Done = files.length > 0;
  const step2Done = tasks.length > 0 || doneCount > 0;
  const step3Done = projects.length > 0;
  const stepsCompleted = (step1Done ? 1 : 0) + (step2Done ? 1 : 0) + (step3Done ? 1 : 0);

  return (
    <>
      <div className="welcome">
        <div>
          <h1>{greet}, {first} <span>✦</span></h1>
          <p>Here&apos;s what your team has been working on. You&apos;re doing great.</p>
        </div>
        <div className="date-pill">{today} ▾</div>
      </div>

      {/* 3-Step First-Run Checklist */}
      <section className="panel" style={{ margin: "16px 0", background: "linear-gradient(to right, var(--color-paper), #faf7f2)", borderRadius: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-muted)" }}>
              Workspace Setup
            </span>
            <h2 style={{ fontSize: 16, fontWeight: 800, margin: "2px 0 0" }}>Getting Started Checklist</h2>
          </div>
          <span className="tag" style={{ background: stepsCompleted === 3 ? "#e4f0df" : "#fef3c7", color: stepsCompleted === 3 ? "#2d6325" : "#92400e", fontWeight: 700, fontSize: 11 }}>
            {stepsCompleted} of 3 completed
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
          <Link href="/app/files" style={{ textDecoration: "none", color: "inherit" }}>
            <div style={{ padding: 12, borderRadius: 12, border: "1px solid var(--color-line)", background: step1Done ? "var(--color-bg)" : "white", opacity: step1Done ? 0.75 : 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14, color: step1Done ? "#2d6325" : "var(--color-muted)" }}>{step1Done ? "✓" : "○"}</span>
                <b style={{ fontSize: 13, textDecoration: step1Done ? "line-through" : "none" }}>1. Upload Course Notes</b>
              </div>
              <p style={{ fontSize: 11, color: "var(--color-muted)", margin: "4px 0 0 22px" }}>Attach lecture PDFs or slides for RAG.</p>
            </div>
          </Link>

          <Link href="/app/agents" style={{ textDecoration: "none", color: "inherit" }}>
            <div style={{ padding: 12, borderRadius: 12, border: "1px solid var(--color-line)", background: step2Done ? "var(--color-bg)" : "white", opacity: step2Done ? 0.75 : 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14, color: step2Done ? "#2d6325" : "var(--color-muted)" }}>{step2Done ? "✓" : "○"}</span>
                <b style={{ fontSize: 13, textDecoration: step2Done ? "line-through" : "none" }}>2. Consult Study Coach</b>
              </div>
              <p style={{ fontSize: 11, color: "var(--color-muted)", margin: "4px 0 0 22px" }}>Ask questions and get study plans.</p>
            </div>
          </Link>

          <Link href="/app/projects/new" style={{ textDecoration: "none", color: "inherit" }}>
            <div style={{ padding: 12, borderRadius: 12, border: "1px solid var(--color-line)", background: step3Done ? "var(--color-bg)" : "white", opacity: step3Done ? 0.75 : 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14, color: step3Done ? "#2d6325" : "var(--color-muted)" }}>{step3Done ? "✓" : "○"}</span>
                <b style={{ fontSize: 13, textDecoration: step3Done ? "line-through" : "none" }}>3. Create Major Project</b>
              </div>
              <p style={{ fontSize: 11, color: "var(--color-muted)", margin: "4px 0 0 22px" }}>Break project down into milestones.</p>
            </div>
          </Link>
        </div>
      </section>

      <section className="stats">
        <div className="stat"><div className="stat-top"><span>Study streak</span><span className="stat-icon">◒</span></div><strong>{tasks.length ? `${Math.min(tasks.length, 12)} days` : "Day 1"}</strong><small>{doneCount} tasks done</small></div>
        <div className="stat"><div className="stat-top"><span>Project progress</span><span className="stat-icon">⌘</span></div><strong>{projects.length ? `${Math.round((projects[0].tasks.filter((t) => t.status === "completed").length / Math.max(projects[0].tasks.length, 1)) * 100)}%` : "—"}</strong><small>{projects.length} projects</small></div>
        <div className="stat"><div className="stat-top"><span>Tasks completed</span><span className="stat-icon">✓</span></div><strong>{doneCount}</strong><small>{focus.length} in focus</small></div>
        <div className="stat"><div className="stat-top"><span>Career matches</span><span className="stat-icon">↗</span></div><strong>{apps.length ? `${apps.length} saved` : "0 yet"}</strong><small>{interviews} interviewing · {soonApps} active</small></div>
      </section>

      <div className="columns">
        <section className="panel">
          <div className="panel-head"><h2>Today&apos;s focus</h2><Link href="/app/tasks">View all tasks →</Link></div>
          {focus.length === 0 && <p style={{ fontSize: 13, color: "var(--color-muted)" }}>Nothing due. Add a task or ask Study Coach for a plan.</p>}
          {focus.map((t) => (
            <div key={t.id} className="focus">
              <div className={`check${t.status === "completed" ? " done" : ""}`}>{t.status === "completed" ? "✓" : ""}</div>
              <div className="focus-body"><b>{t.title}</b><p>{t.priority} priority{t.dueDate ? ` · Due ${new Date(t.dueDate).toLocaleDateString()}` : ""}</p></div>
              <div className="focus-time">{t.status}</div>
            </div>
          ))}
        </section>
        <section className="panel">
          <div className="panel-head"><h2>Your agents</h2><Link href="/app/agents">Manage →</Link></div>
          {agents.length === 0 && <p style={{ fontSize: 13, color: "var(--color-muted)" }}>No agents yet.</p>}
          {agents.slice(0, 3).map((a) => {
            const [icon, color] = agentIcon[a.template] ?? ["✦", "yellow"];
            return (
              <Link key={a.id} href={`/app/agents/${a.id}`} className="agent-row">
                <div className={`agent-icon ${color}`}>{icon}</div>
                <div><b>{a.name}</b><span>{a.role}</span></div>
                <div className="status">● Ready</div>
              </Link>
            );
          })}
          <Link href="/app/agents" className="button" style={{ width: "100%", justifyContent: "center", marginTop: 16, padding: 10, fontSize: 12 }}>+ Add an agent</Link>
        </section>
      </div>

      <div className="lower">
        <section className="panel">
          <div className="panel-head"><h2>Active projects</h2><Link href="/app/projects">View projects →</Link></div>
          {projects.length === 0 && <p style={{ fontSize: 13, color: "var(--color-muted)" }}>No projects yet — add your major project.</p>}
          {projects.map((p) => {
            const pct = p.tasks.length ? Math.round((p.tasks.filter((t) => t.status === "completed").length / p.tasks.length) * 100) : 0;
            return (
              <Link key={p.id} href={`/app/projects/${p.id}`} className="project">
                <div><h3>{p.name}</h3><p>{p.type} · {p.tasks.filter((t) => t.status !== "completed").length} tasks remaining</p><div className="bar"><i style={{ width: `${pct}%` }} /></div></div>
                <b>{pct}%</b>
              </Link>
            );
          })}
        </section>
        <section className="panel">
          <div className="panel-head"><h2>Upcoming deadlines</h2><Link href="/app/tasks">Calendar →</Link></div>
          {deadlines.length === 0 && <p style={{ fontSize: 13, color: "var(--color-muted)" }}>No dated tasks. Add due dates in the planner.</p>}
          {deadlines.map((t) => {
            const d = new Date(t.dueDate!);
            return (
              <div key={t.id} className="deadline">
                <div className="deadline-date">{MONTHS[d.getMonth()]}<br /><b>{d.getDate()}</b></div>
                <div><b>{t.title}</b><span>Due {d.toLocaleDateString()}</span></div>
              </div>
            );
          })}
        </section>
      </div>

      <section className="panel" style={{ marginTop: 18 }}>
        <div className="panel-head"><h2>Recent activity</h2><Link href="/app/files">Open files & notes →</Link></div>
        {files.length === 0 && <p style={{ fontSize: 13, color: "var(--color-muted)" }}>Upload notes and Study Coach will build your first plan here.</p>}
        {files.slice(0, 2).map((f) => (
          <div key={f.id} className="focus">
            <div className="agent-icon yellow">◒</div>
            <div className="focus-body"><b>{f.name}</b><p>{f.status} · {Math.round(f.size / 1024)} KB</p></div>
            <Link href="/app/files">Open →</Link>
          </div>
        ))}
      </section>
    </>
  );
}
