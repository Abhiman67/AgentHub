"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
type Event = { id: string; action: string; metadata: string; createdAt: string };
export default function AuditPage() {
  const [events, setEvents] = useState<Event[]>([]); const [loading, setLoading] = useState(true);
  useEffect(() => { fetch("/api/audit?take=100").then(r => r.json()).then(d => setEvents(d.events ?? [])).finally(() => setLoading(false)); }, []);
  return <div style={{ maxWidth: 760, margin: "0 auto" }}><Link href="/app/settings" className="text-sm underline">← Back to settings</Link><div className="page-head"><div><h1>Security activity</h1><p>Review password, approval, and other security-sensitive events in your workspace.</p></div></div><section className="panel">{loading ? <p>Loading activity…</p> : events.length === 0 ? <p style={{ color: "var(--color-muted)" }}>No security events recorded yet.</p> : events.map(e => <div key={e.id} className="list-row"><div className="grow"><b>{e.action.replaceAll("_", " ")}</b><small>{new Date(e.createdAt).toLocaleString()}</small></div><code style={{ fontSize: 11, maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis" }}>{e.metadata}</code></div>)}</section></div>;
}
