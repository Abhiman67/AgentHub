import Link from "next/link";

export default function HowItWorks() {
  return (
    <main>
      <header className="wrap">
        <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 0" }}>
          <Link className="brand" href="/"><span className="logo">✦</span> agenthub</Link>
          <Link className="nav-cta" href="/signup">Build your team ↗</Link>
        </nav>
      </header>
      <section className="dark"><div className="wrap ref-section">
        <div className="section-head">
          <h2>Your goals in.<br />Momentum out.</h2>
          <p>AgentHub fits into the way you already work—then quietly makes it better.</p>
        </div>
        <div className="steps">
          <div className="step"><div className="step-num">01 / SET UP</div><h3>Tell us where you want to go.</h3><p>Add your semester, subjects, projects, skills and goals.</p></div>
          <div className="step"><div className="step-num">02 / BUILD YOUR TEAM</div><h3>Choose the right agents.</h3><p>Bring in specialists with the right context.</p></div>
          <div className="step"><div className="step-num">03 / MAKE PROGRESS</div><h3>Let the work compound.</h3><p>Daily progress, visible next steps, human-approved actions.</p></div>
        </div>
      </div></section>
    </main>
  );
}
