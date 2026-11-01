import type { Metadata } from "next";
import Link from "next/link";
import PublicChrome from "@/components/PublicChrome";

export const metadata: Metadata = {
  title: "How it works — Goals in, momentum out | Backoff",
  description: "Set up in 2 minutes: tell Backoff your goals, pick your AI team, backoff daily progress with approvals. Tour the workspace.",
};

const steps = [
  { n: "01 / Set up", h: "Tell us where you want to go.", p: "Semester, subjects, skills, career target and weekly hours. Import notes (PDF, TXT, MD) in one click.", mock: "Sem 6 · DBMS, OS · 4h/day · Frontend intern", time: "~2 min" },
  { n: "02 / Build your team", h: "Choose the right agents.", p: "Start with any 2 free. Scope which files and projects each agent may use. Swap anytime.", mock: "✦ Study Coach ✓   ↗ Career Scout ✓", time: "~1 min" },
  { n: "03 / Make progress", h: "Let the work backoff.", p: "Daily focus list, streaks, milestones and approval cards. Nothing external sends without you.", mock: "Today: 3 tasks · 45 min · 1 approval", time: "Daily" },
];

export default function HowItWorks() {
  return (
    <PublicChrome>
      <section className="wrap hero reveal" style={{ paddingBottom: 30 }}>
        <div>
          <div className="kicker">How it works</div>
          <h1 data-split style={{ fontSize: "clamp(40px,6vw,68px)", letterSpacing: "-0.07em", lineHeight: 0.98, margin: "0 0 16px" }}>Your goals in.<br />Momentum out.</h1>
          <p className="lead">Three steps, about three minutes of setup. Then Backoff fits into how you already study, build and apply.</p>
          <div className="actions">
            <Link className="button primary-orange shine" data-magnetic href="/signup">Start step 1 — free ↗</Link>
            <Link className="button secondary" href="/agents">Meet the agents</Link>
          </div>
        </div>
        <div className="approval-card-demo" data-spot>
          <div className="ap-head"><span className="ap-dot" />Live in your workspace</div>
          <p><b>Good morning, Aarav.</b> 3 things are ready: revision plan, milestone check, 4 internships to review.</p>
          <div className="progress"><i style={{ width: "68%" }} /></div>
          <small style={{ display: "block", marginTop: 10 }}>Today&apos;s focus · Streaks · Deadlines · Approvals</small>
        </div>
      </section>

      <section className="dark"><div className="wrap ref-section reveal">
        <div className="section-head">
          <div><div className="kicker kicker-light">The 3 steps</div><h2 data-split>Simple enough<br />to start tonight.</h2></div>
          <p>Onboarding is skippable — but better context means better help. Edit everything later in Settings.</p>
        </div>
        <div className="steps" data-stagger>
          {steps.map((s) => (
            <div key={s.n} className="step">
              <div className="step-num">{s.n} · {s.time}</div>
              <h3>{s.h}</h3><p>{s.p}</p>
              <div className="step-mock" aria-hidden="true">{s.mock}</div>
            </div>
          ))}
        </div>
      </div></section>

      <section className="wrap ref-section reveal">
        <div className="section-head">
          <div><div className="kicker">Workspace tour</div><h2 data-split>One home for<br />study, build, apply.</h2></div>
          <p>Overview for the day. Agents for depth. Projects, tasks, files and career tracking connected underneath.</p>
        </div>
        <div className="bento" data-stagger>
          <article className="bento-card spot"><div className="icon">◒</div><h3>Overview</h3><p>Greeting, date, streaks, today&apos;s 3 priorities, agent activity, deadlines. The 2-minute morning check.</p></article>
          <article className="bento-card spot"><div className="icon">✎</div><h3>Chat + citations</h3><p>Streaming answers with sources from your notes. Code blocks, follow-ups, retry and rename.</p></article>
          <article className="bento-card spot"><div className="icon">▦</div><h3>Projects + tasks</h3><p>Milestones, tasks with due dates and priorities, files linked in. Agents suggest — you confirm.</p></article>
        </div>
      </section>

      <section className="wrap ref-section reveal">
        <div className="approval-demo">
          <div className="approval-copy">
            <div className="kicker">Safety by default</div>
            <h2 data-split>AI drafts.<br />You decide.</h2>
            <p>Sending, submitting, sharing, deleting, calendar events and paid actions always wait for approval.</p>
            <ul className="check-list"><li>Exact payload shown before you tap</li><li>Approve · Edit · Deny in one tap</li><li>Expires in 7 days · Audit log kept</li></ul>
          </div>
          <div className="approval-card-demo" data-spot>
            <div className="ap-head"><span className="ap-dot" />Career Scout · wants approval</div>
            <p><b>Draft email to Priya Sharma</b> — internship application + resume v2 attached.</p>
            <div className="ap-actions"><span className="ap-btn ghost">View draft</span><span className="ap-btn primary">Approve</span><span className="ap-btn">Edit</span><span className="ap-btn danger">Deny</span></div>
            <small>Nothing is sent until you approve.</small>
          </div>
        </div>
        <div className="cta" style={{ marginTop: 40 }}>
          <h2>See it on your own goals.</h2>
          <p>Free Starter · No card · Your data exportable anytime.</p>
          <Link className="button cta-btn" data-magnetic href="/signup">Build your team ↗</Link>
        </div>
      </section>
    </PublicChrome>
  );
}
