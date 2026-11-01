import Link from "next/link";
import PublicChrome from "@/components/PublicChrome";

const items: [string, string][] = [
  ["Human approval first", "Sending, sharing, deleting, or submitting anything always creates an approval card. Nothing external runs until you approve; approvals expire after 7 days."],
  ["Least-privilege integrations", "Connections request minimum scopes, show them before you connect, and can be disconnected anytime — revocation deletes stored credentials."],
  ["Encrypted secrets", "OAuth tokens are encrypted at rest, never appear in URLs or client bundles, and never enter logs or analytics."],
  ["Your data stays yours", "View, export, and delete your profile, files, and workspace data from Settings → Privacy. No training on private notes without consent."],
  ["Untrusted inputs", "Uploaded files and web content are treated as reference data, never instructions. Agents cite sources and say when nothing relevant is found."],
  ["Audit trail", "Sign-ins, approvals, integration changes, exports, and deletions are recorded in your audit log."],
  ["Academic integrity", "Study Coach prefers hints and practice for graded work and will not sit exams for you. Drafts are labeled as drafts."],
];

export default function SecurityPage() {
  return (
    <PublicChrome>
      <section className="wrap ref-section reveal in" style={{ maxWidth: 760 }}>
        <div className="kicker">Trust</div>
        <h1 data-split style={{ fontSize: "clamp(36px,5vw,58px)", letterSpacing: "-0.065em", margin: "0 0 12px" }}>Security at Backoff</h1>
        <p className="lead">How we protect student work. Found a vulnerability? Email <a href="mailto:security@backoff.ai">security@backoff.ai</a> — we respond within 2 business days.</p>
        <ul className="check-list" style={{ marginTop: 24 }}>
          {items.map(([t, d]) => (
            <li key={t}><b>{t}.</b> {d}</li>
          ))}
        </ul>
        <div className="actions" style={{ marginTop: 24 }}>
          <Link href="/signup" className="button primary-orange shine">Build your team ↗</Link>
        </div>
      </section>
    </PublicChrome>
  );
}
