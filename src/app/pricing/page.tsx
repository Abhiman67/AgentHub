import Link from "next/link";

const plans = [
  { name: "Starter", who: "For exploring your first AI team.", amount: "₹0", per: "/ forever", feats: ["2 agents", "20 conversations / month", "PDF notes Q&A"], featured: false },
  { name: "Student Pro", who: "For serious academic momentum.", amount: "₹299", per: "/ month", feats: ["Unlimited agents", "Advanced project workspace", "Career and interview coaching"], featured: true },
  { name: "Campus", who: "For clubs, cohorts and colleges.", amount: "Custom", per: "", feats: ["Shared study spaces", "Admin analytics", "University knowledge base"], featured: false },
];

export default function Pricing() {
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
          <h2>Start free.<br />Grow as you go.</h2>
          <p>Transparent limits, no surprises. Illustrative pricing until billing launches.</p>
        </div>
        <div className="price-grid">
          {plans.map((p) => (
            <article key={p.name} className={`price${p.featured ? " featured" : ""}`}>
              <h3>{p.name}</h3><p>{p.who}</p>
              <div className="amount">{p.amount} <small>{p.per}</small></div>
              <ul>{p.feats.map((f) => <li key={f}>{f}</li>)}</ul>
              <Link className="button secondary" href="/signup">{p.featured ? "Choose Pro" : "Start free"}</Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
