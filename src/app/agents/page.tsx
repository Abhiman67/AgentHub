import { AGENT_TEMPLATES } from "@/lib/agents";
import Link from "next/link";

const icons = ["◒", "⌘", "↗", "✎", "◉", "☼"];

export default function AgentsPage() {
  return (
    <main>
      <header className="wrap">
        <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 0" }}>
          <Link className="brand" href="/"><span className="logo">✦</span> agenthub</Link>
          <Link className="nav-cta" href="/signup">Build your team ↗</Link>
        </nav>
      </header>
      <section className="wrap ref-section">
        <div className="section-head">
          <h2>One workspace.<br />A whole team.</h2>
          <p>Specialized agents that remember your goals. You approve external actions.</p>
        </div>
        <div className="agents">
          {AGENT_TEMPLATES.map((a, i) => (
            <article key={a.template} className="agent">
              <div className="icon">{icons[i % icons.length]}</div>
              <h3>{a.name}</h3>
              <p>{a.description}</p>
            </article>
          ))}
        </div>
        <Link href="/signup" className="button primary" style={{ marginTop: 24 }}>Build your team ↗</Link>
      </section>
    </main>
  );
}
