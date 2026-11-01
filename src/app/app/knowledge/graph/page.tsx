"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState, ErrorState } from "@/components/states";

type Note = { id: string; name: string; outgoingLinks?: { toId: string; label: string }[]; incomingLinks?: { fromId: string; label: string }[] };

export default function KnowledgeGraphPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [error, setError] = useState("");
  useEffect(() => { fetch("/api/notes").then(async (r) => { if (!r.ok) throw new Error("Could not load note graph."); setNotes((await r.json()).notes ?? []); }).catch((e) => setError(e instanceof Error ? e.message : "Could not load note graph.")); }, []);
  if (error) return <main className="p-8"><ErrorState message={error} retry={() => window.location.reload()} /></main>;
  const byId = new Map(notes.map((n) => [n.id, n]));
  const linked = notes.filter((n) => (n.incomingLinks?.length ?? 0) + (n.outgoingLinks?.length ?? 0) > 0);
  return <main style={{ maxWidth: 960, margin: "0 auto", paddingBottom: 40 }}><div className="page-head"><div><h1>Note graph</h1><p>See how your course ideas connect. Wikilinks become backlinks automatically.</p></div><Link href="/app/knowledge" className="button primary sm">Back to notes</Link></div>{linked.length === 0 ? <EmptyState title="Your graph is empty" body="Link notes by writing [[Another note]] in a Markdown note." /> : <div className="knowledge-graph-grid">{linked.map((note) => <section className="panel" key={note.id}><h2 style={{ margin: 0, fontSize: 16 }}>{note.name.replace(/\.md$/, "")}</h2>{note.outgoingLinks?.length ? <><p className="graph-label">Links to</p>{note.outgoingLinks.map((l) => <Link className="graph-link" key={l.toId} href="/app/knowledge">↗ {byId.get(l.toId)?.name?.replace(/\.md$/, "") ?? l.label}</Link>)}</> : null}{note.incomingLinks?.length ? <><p className="graph-label">Backlinks</p>{note.incomingLinks.map((l) => <Link className="graph-link" key={l.fromId} href="/app/knowledge">↙ {byId.get(l.fromId)?.name?.replace(/\.md$/, "") ?? l.label}</Link>)}</> : null}</section>)}</div>}</main>;
}
