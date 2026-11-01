import type { Metadata } from "next";
import Link from "next/link";
import PublicChrome from "@/components/PublicChrome";

export const metadata: Metadata = {
  title: "Pricing — Start free, grow as you go | Backoff",
  description: "Starter free forever (2 agents), Student Pro ₹299/mo (unlimited agents + projects + career), Campus custom. Cancel anytime.",
};

const plans = [
  { name: "Starter", who: "For exploring your first AI team.", amount: "₹0", per: "/ forever", feats: ["2 agents of your choice", "20 conversations / month", "PDF + text Q&A with citations", "Tasks + deadlines", "Export your data anytime"], cta: "Build your team — free", featured: false },
  { name: "Student Pro", who: "For serious academic momentum.", amount: "₹299", per: "/ month · cancel anytime", feats: ["Unlimited agents + custom agents", "Unlimited conversations", "Project workspace + milestones", "Career + interview coaching", "Flashcards, quizzes, viva prep", "Priority processing"], cta: "Build your team — Pro", featured: true },
  { name: "Campus", who: "For clubs, cohorts and colleges.", amount: "Custom", per: "annual · onboarding included", feats: ["Shared study spaces", "Admin analytics + roles", "University knowledge base", "SSO + onboarding support", "Academic-integrity controls"], cta: "Talk to us", featured: false },
];

const rows: [string, string, string, string][] = [
  ["Agents included", "2", "Unlimited + custom", "Unlimited + shared"],
  ["Conversations / month", "20", "Unlimited", "Unlimited"],
  ["Files & citations", "PDF + TXT + MD", "Everything + DOCX", "Everything + admin library"],
  ["Projects & milestones", "Basic", "Full workspace", "Shared spaces"],
  ["Career & interviews", "—", "Full", "Full + placement reports"],
  ["Support", "Community", "Priority", "Dedicated + SSO"],
];

export default function Pricing() {
  return (
    <PublicChrome>
      <section className="wrap ref-section reveal" style={{ paddingBottom: 20 }}>
        <div className="section-head">
          <div><div className="kicker">Pricing</div><h1 data-split style={{ fontSize: "clamp(40px,6vw,68px)", letterSpacing: "-0.07em", lineHeight: 0.98, margin: 0 }}>Start free.<br />Grow as you go.</h1></div>
          <p>Transparent limits, no surprises. Prices in INR. Illustrative until billing launches — Starter is free forever regardless.</p>
        </div>
        <div className="price-grid" data-stagger>
          {plans.map((p) => (
            <article key={p.name} className={`price spot${p.featured ? " featured" : ""}`}>
              {p.featured && <span className="popular">Most popular</span>}
              <h3>{p.name}</h3><p>{p.who}</p>
              <div className="amount">{p.amount} <small>{p.per}</small></div>
              <ul>{p.feats.map((f) => <li key={f}>{f}</li>)}</ul>
              {p.name === "Campus" ? (
                <a className="button secondary full" href="mailto:hello@backoff.ai?subject=Campus%20plan">{p.cta}</a>
              ) : (
                <Link className={`button full ${p.featured ? "primary-orange" : "secondary"}`} href="/signup">{p.cta}</Link>
              )}
            </article>
          ))}
        </div>
        <p className="fineprint center">Cancel anytime · Keep your data · No training on private notes without consent.</p>
      </section>

      <section className="wrap ref-section reveal" style={{ paddingTop: 20 }}>
        <div className="section-head">
          <div><div className="kicker">Compare</div><h2 data-split>What changes<br />between plans.</h2></div>
        </div>
        <div className="card" style={{ overflowX: "auto", padding: 0 }}>
          <table className="table" aria-label="Plan comparison">
            <thead><tr><th>Capability</th><th>Starter</th><th>Student Pro</th><th>Campus</th></tr></thead>
            <tbody>
              {rows.map(([k, a, b, c]) => (
                <tr key={k}><td><b>{k}</b></td><td>{a}</td><td>{b}</td><td>{c}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="wrap ref-section reveal">
        <div className="section-head">
          <div><div className="kicker">FAQ</div><h2 data-split>Billing questions,<br />answered.</h2></div>
        </div>
        <div className="faq-list" data-stagger>
          <details className="faq"><summary>Is Starter really free forever?</summary><p>Yes. 2 agents and 20 conversations/month, free. No card required.</p></details>
          <details className="faq"><summary>Can I cancel Pro?</summary><p>Anytime in one click from Usage &amp; plan. You keep Starter + all your data.</p></details>
          <details className="faq"><summary>What counts as a conversation?</summary><p>One chat thread with an agent. Edits and retries inside it don&apos;t double-count.</p></details>
          <details className="faq"><summary>Do you offer campus discounts?</summary><p>Yes — clubs and colleges get shared spaces, admin roles and onboarding. Write to hello@backoff.ai.</p></details>
        </div>
        <div className="cta" style={{ marginTop: 40 }}>
          <h2>Start free. Upgrade on momentum.</h2>
          <p>Join with your college email — set up in ~2 minutes.</p>
          <Link className="button cta-btn" data-magnetic href="/signup">Build your team ↗</Link>
        </div>
      </section>
    </PublicChrome>
  );
}
