import { notFound } from "next/navigation";
import Link from "next/link";
import PublicChrome from "@/components/PublicChrome";

const TITLES: Record<string, [string, string]> = {
  "how-it-works": ["How it works", "1. Tell Backoff where you want to go. 2. Choose your team. 3. Backoff daily progress."],
  pricing: ["Pricing", "Starter: 2 agents. Student Pro: unlimited agents + projects + career. Campus: shared spaces."],
  privacy: ["Privacy", "You can view, export and delete profile, memories and files. No training on your data without consent."],
  terms: ["Terms", "Student-friendly use. You approve sends, submits and deletes. Academic integrity: coaching first."],
  security: ["Security", "Approval-first actions, encrypted tokens, least-privilege scopes, audit logs, and data export/deletion."],
};

export default async function Page({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const key = slug.join("/");
  const entry = TITLES[key];
  if (!entry) notFound();
  const [title, body] = entry;
  return (
    <PublicChrome>
      <section className="wrap ref-section reveal in" style={{ maxWidth: 760 }}>
        <div className="kicker">Backoff</div>
        <h1 data-split style={{ fontSize: "clamp(36px,5vw,58px)", letterSpacing: "-0.065em", margin: "0 0 12px" }}>{title}</h1>
        <p className="lead">{body}</p>
        <div className="actions">
          <Link href="/signup" className="button primary-orange shine" data-magnetic>Build your team ↗</Link>
        </div>
      </section>
    </PublicChrome>
  );
}
