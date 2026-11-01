import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { ClassroomDashboard } from "@/components/ClassroomDashboard";
import { QuickCapture } from "@/components/QuickCapture";
import { Recommendations } from "@/components/Recommendations";

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

  const [tasks, projects, agents, apps, files, notes, doneCount, pendingApprovals, activity] = await Promise.all([
    db.task.findMany({ where: { ownerId: user.id }, orderBy: { createdAt: "desc" }, take: 20 }),
    db.project.findMany({ where: { ownerId: user.id }, include: { tasks: true }, orderBy: { updatedAt: "desc" }, take: 3 }),
    db.agent.findMany({ where: { ownerId: user.id }, orderBy: { createdAt: "asc" }, take: 6 }),
    db.application.findMany({ where: { ownerId: user.id }, take: 50 }),
    db.file.findMany({ where: { ownerId: user.id }, orderBy: { createdAt: "desc" }, take: 5 }),
    db.file.findMany({ where: { ownerId: user.id, mimeType: "text/markdown", status: { not: "deleted" } }, orderBy: { createdAt: "desc" }, take: 3 }),
    db.task.count({ where: { ownerId: user.id, status: "completed" } }),
    db.approval.findMany({ where: { ownerId: user.id, status: "pending" }, orderBy: { createdAt: "desc" }, take: 5 }),
    db.auditEvent.findMany({ where: { ownerId: user.id }, orderBy: { createdAt: "desc" }, take: 8 }),
  ]);

  const focus = tasks.filter((t) => t.status !== "completed").slice(0, 4);
  const now = Date.now(); // eslint-disable-line -- server component: evaluated once per request, not re-rendered
  const openTasks = tasks.filter((t) => t.status !== "completed" && t.status !== "cancelled");
  const overdue = tasks.filter((t) => t.dueDate && t.status !== "completed" && t.status !== "cancelled" && new Date(t.dueDate).getTime() < now).slice(0, 3);
  const deadlines = tasks.filter((t) => t.dueDate && t.status !== "completed").sort((a, b) => +new Date(a.dueDate!) - +new Date(b.dueDate!)).slice(0, 3);
  const interviews = apps.filter((a) => a.status === "interviewing").length;
  const soonApps = apps.filter((a) => ["applied", "interviewing"].includes(a.status)).length;

  const studyCoach = agents.find((a) => a.template === "study-coach") || agents[0];
  const classroomAccount = await db.integrationAccount.findUnique({
    where: { ownerId_provider: { ownerId: user.id, provider: "classroom" } },
  });

  const step1Done = files.length > 0;
  const step2Done = tasks.length > 0 || doneCount > 0;
  const step3Done = projects.length > 0;
  const stepsCompleted = (step1Done ? 1 : 0) + (step2Done ? 1 : 0) + (step3Done ? 1 : 0);

  return (
    <>
      <div className="welcome student-home-intro">
        <div>
          <p className="student-home-kicker">{greet}, {first}</p>
          <h1>What are you moving forward today? <span>✦</span></h1>
          {openTasks.length > 0 ? <p>You have <strong>{openTasks.length} open {openTasks.length === 1 ? "task" : "tasks"}</strong>. Start with one useful next step.</p> : <p>Ask about a course, project, deadline, or career goal and Backoff will help you make a plan.</p>}
        </div>
        <div className="date-pill">{today} ▾</div>
      </div>

      {/* Study copilot ask box & Google Classroom integration */}
      <ClassroomDashboard
        studentEmail={user.email}
        studyCoachId={studyCoach?.id}
        isConnected={!!classroomAccount}
      />
      {!classroomAccount && (
        <p style={{ fontSize: 12, color: "var(--color-muted)", margin: "8px 0 0" }}>
          <Link href="/app/settings/integrations">Connect Google Classroom</Link> to pull courses and deadlines here.
        </p>
      )}

      <section className="student-mission-card" aria-labelledby="mission-heading">
        <div>
          <span className="student-home-kicker">Your next useful step</span>
          <h2 id="mission-heading">{overdue.length > 0 ? `Start with ${overdue[0].title}` : deadlines.length > 0 ? `Prepare for ${deadlines[0].title}` : projects.length > 0 ? `Move ${projects[0].name} forward` : notes.length > 0 ? `Continue ${notes[0].name.replace(/\.md$/, "")}` : "Tell Backoff what you want to finish"}</h2>
          <p>{overdue.length > 0 ? "This is overdue. Backoff can help you break it into a smaller recovery plan." : deadlines.length > 0 ? "Use your course context to make a focused plan before the deadline arrives." : notes.length > 0 ? "Turn your latest note into a quiz, revision session, or next action." : "Ask about an exam, assignment, project, or internship and turn it into an actionable plan."}</p>
        </div>
        <Link href={studyCoach ? `/app/agents/${studyCoach.id}?q=${encodeURIComponent(overdue[0]?.title ?? deadlines[0]?.title ?? (notes[0] ? `Turn my note ${notes[0].name} into a study plan` : "Help me choose my next student priority"))}` : "/app/agents"} className="button primary-orange">Make a plan ↗</Link>
      </section>

      {pendingApprovals.length > 0 && (
        <section className="panel" style={{ margin: "16px 0", borderColor: "var(--color-brand)" }} aria-live="polite">
          <div className="panel-head"><h2>Waiting for approval ({pendingApprovals.length})</h2><Link href="/app/approvals">Review all →</Link></div>
          {pendingApprovals.slice(0, 3).map((a) => (
            <div key={a.id} className="focus">
              <div className="focus-body"><b>{a.title}</b><p>{a.description.slice(0, 100)}</p></div>
              <Link href="/app/approvals">Review →</Link>
            </div>
          ))}
        </section>
      )}

      {/* 3-Step First-Run Checklist — collapses to one line when done */}
      {stepsCompleted === 3 ? (
        <p style={{ fontSize: 12, color: "#2d6325", margin: "16px 0 0" }}>✓ Workspace setup complete — files, coach, and project ready.</p>
      ) : (
      <section className="panel" style={{ margin: "16px 0", background: "linear-gradient(to right, var(--color-paper), #faf7f2)", borderRadius: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-muted)" }}>
              Workspace Setup
            </span>
            <h2 style={{ fontSize: 16, fontWeight: 800, margin: "2px 0 0" }}>Getting Started Checklist</h2>
          </div>
          <span className="tag" style={{ background: "#fef3c7", color: "#92400e", fontWeight: 700, fontSize: 11 }}>
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
      )}

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
          <div className="panel-head"><h2>Upcoming deadlines</h2><Link href="/app/tasks">Calendar →</Link></div>
          {overdue.length === 0 && deadlines.length === 0 && <p style={{ fontSize: 13, color: "var(--color-muted)" }}>No dated tasks. Add due dates in the planner.</p>}
          {overdue.map((t) => (
            <div key={t.id} className="deadline" style={{ borderLeft: "3px solid #c0392b", paddingLeft: 8 }}>
              <div><b>Overdue: {t.title}</b><span>Was due {new Date(t.dueDate!).toLocaleDateString()} · <Link href="/app/tasks">Reschedule →</Link></span></div>
            </div>
          ))}
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
        <div className="panel-head"><h2>Active projects</h2><Link href="/app/projects">View projects →</Link></div>
        {projects.length === 0 && <p style={{ fontSize: 13, color: "var(--color-muted)" }}>No projects yet — add your major project.</p>}
        {projects.slice(0, 2).map((p) => {
          const pct = p.tasks.length ? Math.round((p.tasks.filter((t) => t.status === "completed").length / p.tasks.length) * 100) : 0;
          return (
            <Link key={p.id} href={`/app/projects/${p.id}`} className="project">
              <div><h3>{p.name}</h3><p>{p.type} · {p.tasks.filter((t) => t.status !== "completed").length} tasks remaining</p><div className="bar"><i style={{ width: `${pct}%` }} /></div></div>
              <b>{pct}%</b>
            </Link>
          );
        })}
      </section>

      {/* Quick capture */}
      <section className="panel" style={{ margin: "16px 0" }}>
        <div className="panel-head"><h2>Quick capture</h2></div>
        <QuickCapture />
      </section>

      {/* Top priorities — agent recommendations, separate from user tasks */}
      <section className="panel" style={{ margin: "16px 0" }}>
        <div className="panel-head"><h2>Top priorities</h2><span style={{ fontSize: 11, color: "var(--color-muted)" }}>Suggested by your workspace</span></div>
        <Recommendations compact />
      </section>

      <section className="panel" style={{ marginTop: 18 }}>
        <div className="panel-head"><h2>Recent activity</h2><Link href="/app/files">Open files & notes →</Link></div>
          {activity.length === 0 && files.length === 0 && <p style={{ fontSize: 13, color: "var(--color-muted)" }}>Upload notes and Study Coach will build your first plan here.</p>}
          {activity.slice(0, 4).map((e) => (
            <div key={e.id} className="focus">
              <div className="focus-body"><b>{e.action.replace(/_/g, " ")}</b><p>{new Date(e.createdAt).toLocaleString()}</p></div>
            </div>
          ))}
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
