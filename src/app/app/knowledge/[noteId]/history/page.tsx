"use client";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { EmptyState, ErrorState } from "@/components/states";
type Revision = { id: string; title: string; content: string; createdAt: string };
export default function NoteHistoryPage({ params }: { params: Promise<{ noteId: string }> }) {
  const { noteId } = use(params); const [revisions, setRevisions] = useState<Revision[]>([]); const [error, setError] = useState("");
  useEffect(() => { fetch(`/api/notes/${noteId}/revisions`).then(async (r) => { if (!r.ok) throw new Error("Could not load revision history."); setRevisions((await r.json()).revisions ?? []); }).catch((e) => setError(e instanceof Error ? e.message : "Could not load revision history.")); }, [noteId]);
  if (error) return <main className="p-8"><ErrorState message={error} retry={() => window.location.reload()} /></main>;
  return <main style={{ maxWidth: 900, margin: "0 auto", paddingBottom: 40 }}><div className="page-head"><div><h1>Note history</h1><p>Review previous saved versions of this note.</p></div><Link href="/app/knowledge" className="button primary sm">Back to notes</Link></div>{revisions.length ? <div className="revision-list">{revisions.map((r) => <article className="panel" key={r.id}><div className="panel-head"><h2>{r.title}</h2><time>{new Date(r.createdAt).toLocaleString()}</time></div><pre className="revision-content">{r.content}</pre></article>)}</div> : <EmptyState title="No revisions yet" body="Save this note a few times and its history will appear here." />}</main>;
}
