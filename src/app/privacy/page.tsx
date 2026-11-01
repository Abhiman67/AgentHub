import type { Metadata } from "next";
import Link from "next/link";
import PublicChrome from "@/components/PublicChrome";

export const metadata: Metadata = {
  title: "Privacy — Your data, your control | Backoff",
  description: "How Backoff collects, uses, retains and deletes your data. Export or delete anytime. No training on private notes without consent.",
};

const sections = [
  { h: "1. Data we collect", p: "Account (name, email), profile and goals you enter, files you upload, projects/tasks you create, conversations with agents, and minimal usage events (e.g. conversation started, file uploaded). We never log full private conversation content for analytics." },
  { h: "2. How we use it", p: "To run your workspace: plan study sessions, answer from your notes with citations, track milestones and applications, enforce usage limits, and keep the service secure. Nothing else." },
  { h: "3. AI training", p: "We do not train models on your private notes, files or chats without your explicit opt-in. Sample metrics on marketing pages are labeled illustrative until real analytics exist." },
  { h: "4. Files & memory", p: "Uploads (PDF, TXT, MD, DOCX) are chunked for retrieval and linked to citations. Agent memory is scoped per agent — you choose which files and projects each agent may access, and can revoke access anytime." },
  { h: "5. Sharing", p: "We don't sell your data. Third-party integrations (GitHub, Notion, Drive, MCP) run only after you connect them and approve each external action. Credentials are encrypted at rest (AES-256-GCM)." },
  { h: "6. Retention & deletion", p: "Pending approvals expire after 7 days. You can export all data and delete profile, memories, files and account from Settings → Privacy. Deletion removes your records; audit logs for security-critical actions are retained minimally." },
  { h: "7. Security", p: "Encryption in transit and at rest, per-user authorization on every record, Zod validation, rate limits, safe Markdown rendering and HTML sanitization. Uploaded content is treated as data, never as system instructions." },
  { h: "8. Your rights & contact", p: "View, export and delete your data anytime in Settings. Questions: hello@backoff.ai. This page is a plain-language summary; the Terms govern use of the service." },
];

export default function Privacy() {
  return (
    <PublicChrome>
      <section className="wrap ref-section reveal" style={{ maxWidth: 860 }}>
        <div className="kicker">Trust</div>
        <h1 data-split style={{ fontSize: "clamp(36px,5vw,58px)", letterSpacing: "-0.065em", lineHeight: 1, margin: "0 0 12px" }}>Privacy, in plain language.</h1>
        <p className="lead">Last updated: September 2026 · You can view, export and delete your profile, memories and files anytime.</p>
        <div className="card" style={{ marginTop: 28, display: "grid", gap: 22 }}>
          {sections.map((s) => (
            <div key={s.h}><h3 style={{ margin: "0 0 8px", fontSize: 17 }}>{s.h}</h3><p style={{ margin: 0, color: "#4c555c", lineHeight: 1.7, fontSize: 14 }}>{s.p}</p></div>
          ))}
        </div>
        <div className="cta" style={{ marginTop: 36 }}>
          <h2>Questions about your data?</h2>
          <p>Write to us — a human replies.</p>
          <a className="button cta-btn" href="mailto:hello@backoff.ai?subject=Privacy%20question">hello@backoff.ai</a>
        </div>
        <p className="fineprint center" style={{ marginTop: 16 }}><Link href="/terms">Read the Terms →</Link></p>
      </section>
    </PublicChrome>
  );
}
