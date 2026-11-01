import type { Metadata } from "next";
import Link from "next/link";
import PublicChrome from "@/components/PublicChrome";

export const metadata: Metadata = {
  title: "Terms — Fair rules for students | Backoff",
  description: "Backoff terms: coaching not completing assessed work, approval-first actions, no guaranteed grades or jobs, billing and termination.",
};

const sections = [
  { h: "1. What Backoff is", p: "A personal AI team for studying, projects and careers. Agents explain, plan, draft and suggest — you own decisions and final work." },
  { h: "2. Academic integrity", p: "Coaching first: hints and explanations before solutions on graded work. No help with live exams. Generated content is marked as draft and needs your review. Don't submit AI output as your own where your institution forbids it." },
  { h: "3. Approvals & responsibility", p: "Sending, submitting, sharing, publishing, calendar events, file edits/deletes and paid actions require your explicit approval. Review the exact payload before tapping Approve — you're responsible for approved actions." },
  { h: "4. No guarantees", p: "No guaranteed grades, interviews, jobs or outcomes. Marketing metrics are labeled illustrative until real analytics exist." },
  { h: "5. Accounts & acceptable use", p: "One account per student (Campus seats via your college). Don't abuse rate limits, upload malware, attempt prompt-injection via files, or access others' records. We may suspend accounts for abuse or safety violations." },
  { h: "6. Plans & billing", p: "Starter is free forever within stated limits. Pro renews monthly until cancelled; Campus per agreement. Cancel anytime — you keep your data on Starter." },
  { h: "7. Termination & changes", p: "Delete your account anytime from Settings. We may update these terms with notice; continued use means acceptance. Questions: hello@backoff.ai." },
];

export default function Terms() {
  return (
    <PublicChrome>
      <section className="wrap ref-section reveal" style={{ maxWidth: 860 }}>
        <div className="kicker">Trust</div>
        <h1 data-split style={{ fontSize: "clamp(36px,5vw,58px)", letterSpacing: "-0.065em", lineHeight: 1, margin: "0 0 12px" }}>Fair rules, student-first.</h1>
        <p className="lead">Last updated: September 2026 · Short version: we coach, you decide, you approve everything external.</p>
        <div className="card" style={{ marginTop: 28, display: "grid", gap: 22 }}>
          {sections.map((s) => (
            <div key={s.h}><h3 style={{ margin: "0 0 8px", fontSize: 17 }}>{s.h}</h3><p style={{ margin: 0, color: "#4c555c", lineHeight: 1.7, fontSize: 14 }}>{s.p}</p></div>
          ))}
        </div>
        <p className="fineprint center" style={{ marginTop: 16 }}><Link href="/privacy">Read the Privacy summary →</Link></p>
      </section>
    </PublicChrome>
  );
}
