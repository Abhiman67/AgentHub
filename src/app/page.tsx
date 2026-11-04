import Link from "next/link";
import { LogoMark } from "@/components/Logo";
import ScrollMotion from "@/components/ScrollMotion";

const agents = [
  { icon: "◒", name: "Study Coach", pill: "Academic", desc: "Turn 40-page PDFs into 45-min revision plans, flashcards and quizzes — with citations to your notes.", href: "/agents" },
  { icon: "⌘", name: "Project Guide", pill: "Projects", desc: "Scope your major project, split it into milestones and prep viva answers without scope creep.", href: "/agents" },
  { icon: "↗", name: "Career Scout", pill: "Career", desc: "Match internships to your skills, close resume gaps and draft cover letters you approve first.", href: "/agents" },
  { icon: "✎", name: "Writing Buddy", pill: "Writing", desc: "Make reports, emails and SOPs clear and confident with structure and tone feedback.", href: "/agents" },
  { icon: "◉", name: "Code Mentor", pill: "Coding", desc: "Debug with hints first, learn the concept, then get test cases — never blind copy-paste.", href: "/agents" },
  { icon: "☼", name: "Interview Coach", pill: "Career", desc: "Practice HR + technical mocks and get kind, specific STAR feedback in minutes.", href: "/agents" },
];

const proofPoints = [
  { icon: "◎", title: "Context that carries over", body: "Your notes, goals, projects and deadlines stay connected across every specialist agent." },
  { icon: "⌁", title: "Guidance before generation", body: "Study Coach and Code Mentor teach through hints, explanations and practice before handing over a draft." },
  { icon: "✓", title: "You stay in control", body: "Sending, sharing, deleting and submitting always wait for a clear approval from you." },
];

const studentStories = [
  { quote: "A calmer way to turn lecture notes into a revision plan.", name: "Study workflow", meta: "Notes → questions → focused practice", initials: "S", bg: "#F4D35E" },
  { quote: "A project partner that helps reduce scope before the deadline gets close.", name: "Major project workflow", meta: "Scope → milestones → review", initials: "P", bg: "#9BD8E5" },
  { quote: "A repeatable place to prepare applications without rebuilding context every time.", name: "Career workflow", meta: "Skills → applications → drafts", initials: "C", bg: "#B7DCB2" },
];

const faqs = [
  { q: "Is Backoff a replacement for teachers or mentors?", a: "No. It's a support layer for planning, practice and drafting. You stay responsible for decisions and final work — agents coach, explain and suggest, they don't hand in work for you." },
  { q: "Can I use my own notes and project files?", a: "Yes. Bring PDFs, text and markdown into your workspace. Agents cite page names when they answer from your files, and say so clearly when nothing relevant is found." },
  { q: "Will agents do my assignments for me?", a: "No. For graded work Study Coach prefers hints, explanations and practice questions first. Generated drafts are marked as drafts and need your review." },
  { q: "Is my data used for AI training?", a: "No training on your private notes without consent. You can view, export and delete your profile, memories and files anytime from Settings → Privacy." },
  { q: "Will agents send emails or apply for me automatically?", a: "Never. Every external or destructive action — sending, sharing, deleting, submitting — creates an approval card. Nothing runs until you hit Approve. Approvals expire after 7 days." },
  { q: "Can I start free? Can I cancel?", a: "The current preview is free and does not collect payment details. Future plans will be explained before billing is introduced, and your data will remain exportable." },
];

export default function Home() {
  return (
    <>
      <ScrollMotion />
      <div className="scroll-progress" aria-hidden="true"><i /></div>
      <header className="site-header">
        <nav className="wrap header-inner" aria-label="Primary">
          <Link className="brand" href="/"><LogoMark /> Backoff</Link>
          <div className="navlinks">
            <Link href="/agents">Agents</Link>
            <Link href="/how-it-works">How it works</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="#faq">FAQ</Link>
          </div>
          <div className="nav-actions">
            <Link href="/login" className="signin">Sign in</Link>
            <Link className="nav-cta" href="/signup">Create workspace ↗</Link>
          </div>
          <details className="mobile-menu">
            <summary aria-label="Open menu">☰</summary>
            <div className="mobile-panel">
              <Link href="/agents">Agents</Link>
              <Link href="/how-it-works">How it works</Link>
              <Link href="/pricing">Pricing</Link>
              <Link href="#faq">FAQ</Link>
              <Link href="/login">Sign in</Link>
              <Link className="nav-cta" href="/signup">Create workspace ↗</Link>
            </div>
          </details>
        </nav>
      </header>

      <main id="main">
        <section className="wrap hero reveal">
          <div className="hero-orbs" aria-hidden="true"><i className="orb orb-a" /><i className="orb orb-b" /><i className="grain" /></div>
          <div className="hero-copy">
            <div className="eyebrow"><span className="pulse-dot" aria-hidden="true" />A personal AI team for students</div>
            <h1 data-split>Meet the team behind your <em>next big win.</em></h1>
            <p className="lead">Bring your notes, courses, projects and career goals into one connected workspace. Your AI team helps you study, build and move forward — with you in control.</p>
            <div className="actions">
              <Link className="button primary-orange" data-magnetic href="/signup">Create your workspace <span aria-hidden="true">↗</span></Link>
              <Link className="button secondary" href="/agents">Meet the agents</Link>
            </div>
            <p className="micro-trust">Preview access · No card needed · Set up in ~2 min · <Link href="#proof">See how it works</Link></p>
          </div>
          <div className="preview" data-tilt data-spot role="img" aria-label="Preview of the Backoff workspace showing study streak, project progress and agent activity">
            <div className="window">
              <div className="windowbar"><i className="dot" /><i className="dot" /><i className="dot" /><span className="live-badge"><span className="pulse-dot" />illustrative preview</span></div>
              <div className="workspace">
                <aside className="side" aria-hidden="true">
                  <small>Workspace</small>
                  <div className="item active">Overview</div>
                  <div className="item">Study Coach</div>
                  <div className="item">Project Guide</div>
                  <div className="item">Career Scout</div>
                  <small style={{ marginTop: 26 }}>Your space</small>
                  <div className="item">Semester 6</div>
                  <div className="item">Major Project</div>
                </aside>
                <div className="dash">
                  <h3>Good morning, Aarav</h3>
                  <p className="sub">A calm view of what your team could prepare from your workspace.</p>
                  <div className="typing-line" aria-hidden="true"><b>✦ Study Coach</b> is building your revision plan<span className="caret">▍</span></div>
                  <div className="cards">
                    <div className="mini orange"><b>Study streak</b><span>12 days</span></div>
                    <div className="mini blue"><b>Project progress</b><span>68%</span></div>
                  </div>
                  <div className="task"><b>✦ Data Mining revision — suggested</b><span>3 tasks · 45 min · Review today →</span></div>
                  <div className="task approval-mini"><b>⦿ Career Scout found 4 internships</b><span>Review matches before drafting →</span></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="wrap hero-proof" aria-label="Backoff principles">
          <div className="proof-rating"><span className="proof-eyebrow">Built around real student workflows</span><span className="proof-copy">Study, projects and career work in one approval-first workspace.</span><Link href="#proof" className="trust-link">What guides Backoff <span aria-hidden="true">↗</span></Link></div>
        </div>

        <div className="marquee" aria-hidden="true"><div className="marquee-track"><span>Study Coach ✦ Project Guide ✦ Career Scout ✦ Writing Buddy ✦ Code Mentor ✦ Interview Coach ✦&nbsp;</span><span>Study Coach ✦ Project Guide ✦ Career Scout ✦ Writing Buddy ✦ Code Mentor ✦ Interview Coach ✦&nbsp;</span></div></div>

        <section id="agents" className="wrap ref-section reveal">
          <div className="section-head">
            <div><div className="kicker">01 — The team</div><h2 data-split>One workspace. A whole team.</h2></div>
            <p>Specialized agents that remember your goals, work together, and move you from “I should” to “I did.” Pick 2 free, add more anytime.</p>
          </div>
          <div className="agents" data-stagger>
            {agents.map((a) => (
              <article key={a.name} className="agent agent-card-new" data-spot>
                <div className="agent-top"><div className="icon" aria-hidden="true">{a.icon}</div><span className="pill">{a.pill}</span></div>
                <h3>{a.name}</h3>
                <p>{a.desc}</p>
                <Link href={a.href} className="card-link">Open {a.name} →</Link>
              </article>
            ))}
          </div>
        </section>

        <section id="use-cases" className="wrap ref-section reveal">
          <div className="section-head">
            <div><div className="kicker">02 — The problem</div><h2 data-split>Your work is everywhere.<br />Your momentum shouldn&apos;t be.</h2></div>
            <p>Notes, deadlines, project plans and applications are hard to move forward when every tool forgets the context around them.</p>
          </div>
          <div className="bento" data-stagger>
            <article className="bento-card spot bento-large">
              <div className="icon" aria-hidden="true">▦</div>
              <h3>Scattered notes, repeated explanations</h3>
              <p>Bring the material you already have into one place. Agents can use that context instead of making you restart every conversation.</p>
              <div className="bento-mock" aria-hidden="true"><span>Notes.pdf</span><span>Project plan</span><span>Resume v2</span></div>
            </article>
            <article className="bento-card spot">
              <div className="icon" aria-hidden="true">↔</div>
              <h3>Deadlines without a clear next step</h3>
              <p>Turn a vague goal into a small plan you can review, edit and act on today.</p>
            </article>
            <article className="bento-card spot">
              <div className="icon" aria-hidden="true">✓</div>
              <h3>Generic AI without your context</h3>
              <p>Specialist agents keep their role clear and show where a recommendation came from.</p>
            </article>
          </div>
        </section>

        <section id="how" className="dark">
          <div className="wrap ref-section reveal">
            <div className="section-head">
              <div><div className="kicker kicker-light">03 — How it works</div><h2 data-split>Your goals in.<br />Momentum out.</h2></div>
              <p>Fits the way you already work — then quietly makes it better. Live in about two minutes.</p>
            </div>
            <div className="steps" data-stagger>
              <div className="step"><div className="step-num">01 / Set up</div><h3>Tell us where you want to go.</h3><p>Add semester, subjects, skills and goals. Import notes in one click.</p><div className="step-mock" aria-hidden="true">Sem 6 · DBMS · 4h/day · Internship</div></div>
              <div className="step"><div className="step-num">02 / Build your team</div><h3>Choose the right agents.</h3><p>Start with 2 free. Give each a role and the files it may use.</p><div className="step-mock" aria-hidden="true">✦ Study Coach ✓ &nbsp; ↗ Career Scout ✓</div></div>
              <div className="step"><div className="step-num">03 / Make progress</div><h3>Let the work backoff.</h3><p>Daily focus, reminders and approvals. Nothing sends without you.</p><div className="step-mock" aria-hidden="true">Today: 3 tasks · 45 min · 1 approval</div></div>
            </div>
            <div className="how-cta"><Link className="button primary-orange" href="/signup">Create your workspace ↗</Link><Link className="how-link" href="/how-it-works">See detailed walkthrough →</Link></div>
          </div>
        </section>

        <section id="proof" className="wrap ref-section reveal">
          <div className="section-head">
            <div><div className="kicker">04 — What guides us</div><h2 data-split>Progress you can<br />understand.</h2></div>
            <p>Backoff is designed around useful, explainable support rather than inflated scores or hidden automation.</p>
          </div>
          <div className="proof-grid" data-stagger>
            {proofPoints.map((point) => (
              <article key={point.title} className="proof-card" data-spot>
                <div className="proof-mark" aria-hidden="true">{point.icon}</div>
                <h3>{point.title}</h3>
                <p>{point.body}</p>
              </article>
            ))}
          </div>
          <div className="proof-grid proof-scenarios" data-stagger>
            {studentStories.map((story) => (
              <figure key={story.name} className="proof-card" data-spot>
                <div className="stars" aria-label="Illustrative student scenario">✦</div>
                <blockquote>“{story.quote}”</blockquote>
                <figcaption><span className="proof-avatar" style={{ background: story.bg }} aria-hidden="true">{story.initials}</span><span><b>{story.name}</b><small>{story.meta} · illustrative preview</small></span></figcaption>
              </figure>
            ))}
          </div>
          <p className="fineprint">No fabricated testimonials or performance scores. Public student stories will be added only with permission.</p>
        </section>

        <section id="safety" className="wrap ref-section reveal">
          <div className="approval-demo">
            <div className="approval-copy">
              <div className="kicker">05 — Safety by default</div>
              <h2 data-split>AI drafts.<br />You decide.</h2>
              <p>Agents can plan, explain and draft — but sending, sharing, deleting or submitting always waits for your tap. That&apos;s the whole point of a team you trust.</p>
              <ul className="check-list"><li>Exact action + payload shown before approval</li><li>Approve · Edit · Deny in one tap</li><li>Auto-expires in 7 days · Full audit log</li></ul>
            </div>
            <div className="approval-card-demo" role="img" aria-label="Example approval card from Career Scout asking to approve a draft email">
              <div className="ap-head"><span className="ap-dot" />Career Scout · wants approval</div>
              <p><b>Draft email to Priya Sharma</b> — frontend internship application + resume v2 attached.</p>
              <div className="ap-actions"><span className="ap-btn ghost">View draft</span><span className="ap-btn primary">Approve</span><span className="ap-btn">Edit</span><span className="ap-btn danger">Deny</span></div>
              <small>Nothing is sent until you approve.</small>
            </div>
          </div>
        </section>

        <section id="dashboard" className="wrap ref-section reveal">
          <div className="section-head">
            <div><div className="kicker">06 — Daily home</div><h2 data-split>Designed for<br />daily progress.</h2></div>
            <p>The workspace students reopen every morning. Three tabs, one focus list.</p>
          </div>
          <div className="tabs" role="tablist" aria-label="Workspace preview tabs">
            <input type="radio" name="dash-tab" id="tab-study" defaultChecked /><label htmlFor="tab-study" role="tab">Study</label>
            <input type="radio" name="dash-tab" id="tab-project" /><label htmlFor="tab-project" role="tab">Project</label>
            <input type="radio" name="dash-tab" id="tab-career" /><label htmlFor="tab-career" role="tab">Career</label>
            <div className="tab-panels">
              <div className="tab-panel p-study"><h4>Today&apos;s focus</h4><p>Finish literature review · 10 SQL questions · 45-min Data Mining revision</p><div className="progress"><i style={{ width: "78%" }} /></div></div>
              <div className="tab-panel p-project"><h4>Major project — Milestone 3 of 5</h4><p>Scope trimmed by Project Guide · Viva Qs ready · Demo due Fri</p><div className="progress"><i style={{ width: "62%", background: "#7dbbc6" }} /></div></div>
              <div className="tab-panel p-career"><h4>4 new internships match you</h4><p>2 deadlines this week · Resume gaps flagged · Drafts await approval</p><div className="progress"><i style={{ width: "44%", background: "#5e9e68" }} /></div></div>
            </div>
          </div>
        </section>

        <section id="pricing" className="wrap ref-section reveal">
          <div className="section-head">
            <div><div className="kicker">07 — Pricing</div><h2 data-split>Start free.<br />Grow as you go.</h2></div>
            <p>Preview the workspace now. Payment plans will be introduced later with clear notice.</p>
          </div>
          <div className="price-grid" data-stagger>
            <article className="price spot">
              <h3>Starter</h3><p>For exploring your first AI team.</p>
              <div className="amount">₹0 <small>/ during preview</small></div>
              <ul><li>2 agents</li><li>20 conversations / month</li><li>PDF + text Q&A with citations</li><li>Tasks + deadlines</li><li>Export your data anytime</li></ul>
              <Link className="button secondary full" href="/signup">Create your workspace</Link>
            </article>
            <article className="price featured spot">
              <span className="popular">Most popular</span>
              <h3>Student Pro</h3><p>For serious academic momentum.</p>
              <div className="amount">₹299 <small>/ planned monthly price</small></div>
              <ul><li>Unlimited agents + custom agents</li><li>Unlimited conversations</li><li>Project workspace + milestones</li><li>Career + interview coaching</li><li>Priority processing</li></ul>
              <Link className="button primary-orange full" href="/pricing">See what&apos;s planned</Link>
            </article>
            <article className="price spot">
              <h3>Campus</h3><p>For clubs, cohorts and colleges.</p>
              <div className="amount">Custom</div>
              <ul><li>Shared study spaces</li><li>Admin analytics + roles</li><li>University knowledge base</li><li>SSO + onboarding support</li><li>Academic-integrity controls</li></ul>
              <a className="button secondary full" href="mailto:hello@backoff.ai?subject=Campus%20plan">Talk to us</a>
            </article>
          </div>
          <p className="fineprint center">No payment is collected in the current preview · Your notes stay exportable · No training on private data without consent. <Link href="/pricing">Pricing details →</Link></p>
        </section>

        <section id="faq" className="wrap ref-section reveal">
          <div className="section-head">
            <div><div className="kicker">08 — FAQ</div><h2 data-split>Questions, answered<br />before you start.</h2></div>
            <p>Practical details. No fine-print surprises.</p>
          </div>
          <div className="faq-list" data-stagger>
            {faqs.map((f) => (
              <details key={f.q} className="faq"><summary>{f.q}</summary><p>{f.a}</p></details>
            ))}
          </div>
        </section>

        <section id="start" className="wrap ref-section reveal">
          <div className="cta">
            <div className="kicker kicker-light center">Preview access · No card · 2-min setup</div>
            <h2 data-split>Build the student life you wish you had.</h2>
            <p>Create a focused workspace for study plans, project momentum and career drafts — with you in control.</p>
            <form className="cta-form" action="/signup" method="get">
              <label className="sr-only" htmlFor="cta-email">Email address</label>
              <input id="cta-email" name="email" type="email" placeholder="you@college.edu" autoComplete="email" />
            <button className="button cta-btn" type="submit">Create your workspace ↗</button>
            </form>
            <small className="cta-note">Preview access is currently free · You approve every external action</small>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="wrap footer-top">
          <div className="footer-brand"><div className="brand"><LogoMark /> Backoff</div><p>A focused AI workspace for students who want to learn deeply, build confidently and move forward.</p><p className="footer-badge">⦿ Human-led, AI-assisted · Approval-first</p></div>
          <div className="footer-column"><strong>Product</strong><Link href="/agents">AI agents</Link><Link href="/how-it-works">How it works</Link><Link href="/pricing">Plans &amp; access</Link><Link href="/signup">Get started</Link></div>
          <div className="footer-column"><strong>Resources</strong><Link href="#use-cases">Use cases</Link><Link href="#faq">FAQ</Link><Link href="/login">Sign in</Link><Link href="/forgot-password">Reset password</Link></div>
          <div className="footer-column"><strong>Trust</strong><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/security">Security</Link><Link href="/accessibility">Accessibility</Link><Link href="/status">Status</Link><a href="mailto:hello@backoff.ai">hello@backoff.ai</a></div>
        </div>
        <div className="wrap footer-bottom"><span>© 2026 Backoff. Built for ambitious students.</span><span>Made for meaningful progress · <Link href="/privacy">Privacy-first</Link></span></div>
      </footer>
    </>
  );
}
