import { notFound } from "next/navigation";
import Link from "next/link";

const TITLES: Record<string, [string, string]> = {
  "how-it-works": ["How it works", "1. Tell AgentHub where you want to go. 2. Choose your team. 3. Compound daily progress."],
  pricing: ["Pricing", "Starter: 2 agents. Student Pro: unlimited agents + projects + career. Campus: shared spaces."],
  privacy: ["Privacy", "You can view, export and delete profile, memories and files. No training on your data without consent."],
  terms: ["Terms", "Student-friendly use. You approve sends, submits and deletes. Academic integrity: coaching first."],
};

export default async function Page({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const key = slug.join("/");
  const entry = TITLES[key];
  if (!entry) notFound();
  const [title, body] = entry;
  return (
    <main className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="text-4xl font-extrabold tracking-tight">{title}</h1>
      <p className="mt-4 text-lg text-muted">{body}</p>
      <Link href="/signup" className="mt-8 inline-block rounded-full bg-brand px-6 py-3 font-bold text-white">Build your team</Link>
    </main>
  );
}
