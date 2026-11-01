import type { Metadata } from "next";
import Link from "next/link";
import PublicChrome from "@/components/PublicChrome";
import { AGENT_TEMPLATES, SUGGESTED_PROMPTS } from "@/lib/agents";

export const metadata: Metadata = {
  title: "AI Agents — Meet your student team | Backoff",
  description: "Six specialized student agents: Study Coach, Project Guide, Career Scout, Writing Buddy, Code Mentor, Interview Coach. Shared context, approval-first actions.",
};

const icons = ["◒", "⌘", "↗", "✎", "◉", "☼"];
const bestFor: Record<string, string> = {
  "study-coach": "Best for: exam season, backlog clearing, revision from PDFs.",
  "project-guide": "Best for: major projects, hackathons, viva prep.",
  "career-scout": "Best for: internships, placements, resume overhauls.",
  "writing-buddy": "Best for: reports, SOPs, emails that need polish.",
  "code-mentor": "Best for: debugging, DSA practice, learning concepts.",
  "interview-coach": "Best for: HR + technical mocks with STAR feedback.",
};

export default function AgentsPage() {
  return (
    <PublicChrome>
      <section className="wrap hero reveal" style={{ paddingBottom: 40 }}>
        <div>
          <div className="kicker">The team</div>
          <h1 data-split style={{ fontSize: "clamp(40px,6vw,68px)", letterSpacing: "-0.07em", lineHeight: 0.98, margin: "0 0 16px" }}>Six specialists.<br />One workspace.</h1>
          <p className="lead">Each agent has a role, memory scope and tools. They share your goals, files and deadlines — and ask for approval before sending, sharing or deleting anything.</p>
          <div className="actions">
            <Link className="button primary-orange shine" data-magnetic href="/signup">Build your team ↗</Link>
            <Link className="button secondary" href="/how-it-works">How it works</Link>
          </div>
          <p className="micro-trust">Starter includes any 2 agents free · Switch anytime</p>
        </div>
        <div className="approval-card-demo" data-spot>
          <div className="ap-head"><span className="ap-dot" />How agents stay safe</div>
          <p><b>Agents draft. You decide.</b> External sends, submits, shares and deletes always create an approval card first.</p>
          <div className="ap-actions"><span className="ap-btn primary">Approve</span><span className="ap-btn">Edit</span><span className="ap-btn danger">Deny</span></div>
          <small>Auto-expires in 7 days · Full audit log in Settings.</small>
        </div>
      </section>

      <section className="wrap ref-section reveal" style={{ paddingTop: 20 }}>
        <div className="agents" data-stagger>
          {AGENT_TEMPLATES.map((a, i) => (
            <article key={a.template} className="agent agent-card-new" data-spot>
              <div className="agent-top"><div className="icon" aria-hidden="true">{icons[i % icons.length]}</div><span className="pill">{a.category}</span></div>
              <h3>{a.name}</h3>
              <p style={{ fontWeight: 700, color: "var(--color-ink)" }}>{a.role}</p>
              <p>{a.description}</p>
              <p style={{ fontSize: 12.5, color: "#4c555c" }}>{bestFor[a.template]}</p>
              {(SUGGESTED_PROMPTS[a.template] ?? []).length > 0 && (
                <div className="bento-mock" style={{ marginTop: 12 }} aria-label={`Try with ${a.name}`}>
                  {(SUGGESTED_PROMPTS[a.template] ?? []).slice(0, 2).map((p) => (
                    <span key={p}>“{p}”</span>
                  ))}
                </div>
              )}
              <Link href="/signup" className="card-link">Start with {a.name} →</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="wrap ref-section reveal">
        <div className="section-head">
          <div><div className="kicker">Shared context</div><h2 data-split>They remember.<br />So you don&apos;t repeat.</h2></div>
          <p>Goals, subjects, files, projects and deadlines travel across agents. A study session can become a milestone; a project can become a resume bullet.</p>
        </div>
        <div className="bento" data-stagger>
          <article className="bento-card spot"><div className="icon">▦</div><h3>Scoped memory</h3><p>Each agent sees only the files and projects you allow. Revoke anytime from Settings → Privacy.</p></article>
          <article className="bento-card spot"><div className="icon">↔</div><h3>Clean handoffs</h3><p>Project Guide reads what Study Coach planned. Career Scout cites the project you actually built.</p></article>
          <article className="bento-card spot"><div className="icon">✓</div><h3>Coaching first</h3><p>Hints before solutions on graded work. No live-exam help. Drafts marked as drafts.</p></article>
        </div>
      </section>

      <section className="wrap ref-section reveal">
        <div className="section-head">
          <div><div className="kicker">FAQ</div><h2 data-split>Agent questions,<br />answered.</h2></div>
        </div>
        <div className="faq-list" data-stagger>
          <details className="faq"><summary>Can I change agents later?</summary><p>Yes. Add, pause or swap agents anytime. Your files, tasks and history stay put.</p></details>
          <details className="faq"><summary>Do agents see all my files?</summary><p>No. You scope files and projects per agent. Check access anytime in Settings → Privacy.</p></details>
          <details className="faq"><summary>Will they do my assignments?</summary><p>No. They coach with explanations, feedback, plans and practice — you own the final work.</p></details>
        </div>
        <div className="cta" style={{ marginTop: 40 }}>
          <h2>Pick your first two. Free.</h2>
          <p>Most students start with Study Coach + one more.</p>
          <Link className="button cta-btn" data-magnetic href="/signup">Build your team ↗</Link>
        </div>
      </section>
    </PublicChrome>
  );
}
