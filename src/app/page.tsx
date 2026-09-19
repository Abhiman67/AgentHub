import Link from "next/link";

const agents = [
  { icon: "◒", name: "Study Coach", desc: "Turn notes into plans, flashcards and practice sessions that actually stick." },
  { icon: "⌘", name: "Project Guide", desc: "From first idea to final viva—your always-on technical project partner." },
  { icon: "↗", name: "Career Scout", desc: "Find roles that fit you, tailor your resume and practice until you shine." },
  { icon: "✎", name: "Writing Buddy", desc: "Make every email, report and presentation sound clear and confident." },
  { icon: "◉", name: "Code Mentor", desc: "Debug, learn concepts and improve your problem-solving without shortcuts." },
  { icon: "☼", name: "Interview Coach", desc: "Practice realistic conversations and get kind, useful feedback instantly." },
];

export default function Home() {
  return (
    <>
      <header className="wrap">
        <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 0" }}>
          <Link className="brand" href="/"><span className="logo">✦</span> agenthub</Link>
          <div className="navlinks">
            <Link href="/agents">Product</Link>
            <Link href="/how-it-works">How it works</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="#use-cases">Use cases</Link>
          </div>
          <div className="nav-actions"><Link href="/login">Sign in</Link><Link className="nav-cta" href="/signup">Get started ↗</Link></div>
        </nav>
      </header>
      <main>
        <section className="wrap hero">
          <div>
            <div className="eyebrow">Your unfair academic advantage</div>
            <h1>Meet the team behind your <em>next big win.</em></h1>
            <p className="lead">AgentHub gives every student a personal team of AI agents to study smarter, build better projects, and find their next opportunity.</p>
            <div className="actions">
              <Link className="button primary" href="/signup">Build your team <span>↗</span></Link>
              <Link className="button secondary" href="/agents">Meet the agents</Link>
            </div>
          </div>
          <div className="preview">
            <div className="window">
              <div className="windowbar"><i className="dot" /><i className="dot" /><i className="dot" /></div>
              <div className="workspace">
                <aside className="side">
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
                  <p className="sub">Here is what your team has been working on.</p>
                  <div className="cards">
                    <div className="mini orange"><b>Study streak</b><span>12 days</span></div>
                    <div className="mini blue"><b>Project progress</b><span>68%</span></div>
                  </div>
                  <div className="task"><b>✦ Study Coach</b><br />Your Data Mining revision plan is ready.<span>3 tasks · 45 min · Due today →</span></div>
                  <div className="task" style={{ background: "#fff", color: "#273a4d", border: "1px solid #ece7dd" }}><b>Career Scout found 4 new internships</b><span style={{ color: "#8b8e8c" }}>Based on your skills and preferences →</span></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="wrap trust">Built for ambitious students <strong>✓ Study smarter</strong><strong>✓ Build confidently</strong><strong>✓ Get ahead</strong></div>

        <section id="agents" className="wrap ref-section">
          <div className="section-head">
            <h2>One workspace.<br />A whole team.</h2>
            <p>Specialized agents that remember your goals, work together, and help you move from “I should” to “I did.”</p>
          </div>
          <div className="agents">
            {agents.map((a) => (
              <article key={a.name} className="agent">
                <div className="icon">{a.icon}</div>
                <h3>{a.name}</h3>
                <p>{a.desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="use-cases" className="wrap ref-section">
          <div className="section-head">
            <h2>More than answers.<br />A system for progress.</h2>
            <p>AgentHub brings the context, tools and accountability around your work into one calm, focused workspace.</p>
          </div>
          <div className="agents">
            <article className="agent"><div className="icon">▦</div><h3>Context that carries over</h3><p>Keep your goals, files, projects and preferences together so every conversation starts with less repetition.</p></article>
            <article className="agent"><div className="icon">↔</div><h3>Work that connects</h3><p>Turn a study session into a project milestone, a project into a portfolio story, and a skill into a stronger application.</p></article>
            <article className="agent"><div className="icon">✓</div><h3>Progress you can see</h3><p>Use tasks, milestones and lightweight check-ins to know what matters today and what can wait.</p></article>
          </div>
        </section>

        <section id="how" className="dark">
          <div className="wrap ref-section">
            <div className="section-head">
              <h2>Your goals in.<br />Momentum out.</h2>
              <p>AgentHub fits into the way you already work—then quietly makes it better.</p>
            </div>
            <div className="steps">
              <div className="step"><div className="step-num">01 / SET UP</div><h3>Tell us where you want to go.</h3><p>Add your semester, subjects, projects, skills and the goals that matter to you.</p></div>
              <div className="step"><div className="step-num">02 / BUILD YOUR TEAM</div><h3>Choose the right agents.</h3><p>Bring in the specialists you need. Give each one a role, a voice and the right context.</p></div>
              <div className="step"><div className="step-num">03 / MAKE PROGRESS</div><h3>Let the work compound.</h3><p>Your agents collaborate, remember your progress and keep the next step obvious.</p></div>
            </div>
          </div>
        </section>

        <section id="stories" className="wrap ref-section">
          <div className="quote">
            <div>
              <blockquote>“It feels less like using a chatbot and more like having a really good senior on my side.”</blockquote>
              <p><cite>— Riya, Computer Science student (illustrative)</cite></p>
            </div>
            <div className="stats">
              <div className="stat"><strong>4.8×</strong><span>faster project research*</span></div>
              <div className="stat"><strong>12h</strong><span>saved every month*</span></div>
              <div className="stat"><strong>100%</strong><span>your data, your control</span></div>
              <div className="stat"><strong>24/7</strong><span>your team is ready</span></div>
            </div>
          </div>
          <p style={{ color: "#929089", fontSize: 12 }}>*Illustrative sample metrics until real analytics exist.</p>
        </section>

        <section id="dashboard" className="wrap ref-section">
          <div className="section-head">
            <h2>Designed for<br />daily progress.</h2>
            <p>A glimpse of the workspace students return to every day.</p>
          </div>
          <div className="app-page">
            <aside className="app-side">
              <h3>✦ agenthub</h3>
              <span className="active">Overview</span>
              <span>My agents</span>
              <span>Projects</span>
              <span>Usage &amp; plan</span>
            </aside>
            <div className="app-main">
              <h2>Good morning, Aarav</h2>
              <p>Tuesday, 14 October · 3 things are ready for you.</p>
              <div className="app-grid">
                <div className="app-card"><h4>Study streak</h4><p>Keep it going—12 days in a row.</p><div className="progress"><i style={{ width: "78%" }} /></div></div>
                <div className="app-card"><h4>Major project</h4><p>Milestone 3 of 5 completed.</p><div className="progress"><i style={{ width: "62%", background: "#7dbbc6" }} /></div></div>
                <div className="app-card"><h4>Career goals</h4><p>4 new internships match your profile.</p><div className="progress"><i style={{ width: "44%", background: "#a7c79f" }} /></div></div>
              </div>
              <div className="app-card" style={{ marginTop: 12 }}><h4>Today&apos;s focus</h4><p>Finish your literature review · Practice 10 SQL questions · Review your resume with Career Scout</p></div>
            </div>
          </div>
        </section>

        <section id="pricing" className="wrap ref-section">
          <div className="section-head">
            <h2>Start free.<br />Grow as you go.</h2>
            <p>Everything you need to make meaningful progress, without another expensive student tool.</p>
          </div>
          <div className="price-grid">
            <article className="price">
              <h3>Starter</h3><p>For exploring your first AI team.</p>
              <div className="amount">₹0 <small>/ forever</small></div>
              <ul><li>2 agents</li><li>20 conversations / month</li><li>PDF notes Q&A</li></ul>
              <Link className="button secondary" href="/signup">Start free</Link>
            </article>
            <article className="price featured">
              <h3>Student Pro</h3><p>For serious academic momentum.</p>
              <div className="amount">₹299 <small>/ month</small></div>
              <ul><li>Unlimited agents</li><li>Advanced project workspace</li><li>Career and interview coaching</li></ul>
              <Link className="button" href="/signup">Choose Pro</Link>
            </article>
            <article className="price">
              <h3>Campus</h3><p>For clubs, cohorts and colleges.</p>
              <div className="amount">Custom</div>
              <ul><li>Shared study spaces</li><li>Admin analytics</li><li>University knowledge base</li></ul>
              <a className="button secondary" href="mailto:hello@agenthub.ai?subject=Campus%20plans">Contact sales</a>
            </article>
          </div>
        </section>

        <section className="wrap ref-section">
          <div className="section-head">
            <h2>Questions, answered<br />before you start.</h2>
            <p>A few practical details about using AgentHub.</p>
          </div>
          <div style={{ maxWidth: 820, margin: "0 auto" }}>
            <details className="faq"><summary>Is AgentHub a replacement for my teachers or mentors?</summary><p>No. It is a personal support layer for planning, practice and drafting. You stay responsible for the decisions and final work.</p></details>
            <details className="faq"><summary>Can I use my own notes and project files?</summary><p>Yes. You can bring supported files into your workspace and ask agents to help you understand, organize or act on that context.</p></details>
            <details className="faq"><summary>Will agents do my assignments for me?</summary><p>AgentHub is designed to help you learn and make progress—through explanations, feedback, plans and practice—not to remove your ownership of academic work.</p></details>
            <details className="faq"><summary>Can I start without paying?</summary><p>Yes. The Starter experience is designed for exploring your first AI team. Paid plans and billing details can be added when you are ready.</p></details>
          </div>
        </section>

        <section id="start" className="wrap ref-section">
          <div className="cta">
            <h2>Build the student life you wish you had.</h2>
            <p>Get early access to AgentHub and create your first AI team for free.</p>
            <Link className="button" href="/signup">Join the waitlist ↗</Link>
          </div>
        </section>
      </main>
      <footer className="site-footer">
        <div className="wrap footer-top">
          <div className="footer-brand"><div className="brand"><span className="logo">✦</span> agenthub</div><p>A focused AI workspace for students who want to learn deeply, build confidently and move forward.</p></div>
          <div className="footer-column"><strong>Product</strong><Link href="/agents">AI agents</Link><Link href="/how-it-works">How it works</Link><Link href="/pricing">Plans & access</Link></div>
          <div className="footer-column"><strong>Resources</strong><Link href="#use-cases">Use cases</Link><Link href="/signup">Get started</Link><Link href="/login">Sign in</Link></div>
          <div className="footer-column"><strong>Trust</strong><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><span>Human-led, AI-assisted</span></div>
        </div>
        <div className="wrap footer-bottom"><span>© 2026 AgentHub. Built for ambitious students.</span><span>Made for meaningful progress.</span></div>
      </footer>
    </>
  );
}
