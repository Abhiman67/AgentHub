"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/states";

type Note = { id: string; kind: string; title: string; body: string; link: string; readAt: string | null; createdAt: string };

export default function NotificationsPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) throw new Error("Could not load notifications.");
      const d = await res.json();
      setNotes(d.notifications ?? []);
      setUnread(d.unread ?? 0);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function markAll() {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }) });
    void load();
  }

  async function markOne(id: string) {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: [id] }) });
    void load();
  }

  if (loading) return <main className="p-8"><LoadingSkeleton /></main>;

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", paddingBottom: 40 }}>
      <div className="page-head">
        <div>
          <h1>Notifications</h1>
          <p>Grouped, rate-limited alerts from your routines and runs.</p>
        </div>
        {unread > 0 && (
          <button type="button" onClick={() => void markAll()} className="button secondary sm">
            Mark all read ({unread})
          </button>
        )}
      </div>
      {error && <ErrorState message={error} retry={() => void load()} />}
      {notes.length === 0 ? (
        <EmptyState title="All caught up" body="Routine results, failures, and approval nudges land here." />
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {notes.map((n) => (
            <div key={n.id} className="panel">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                <b style={{ fontSize: 13 }}>{n.title}</b>
                <span className="tag">{n.readAt ? "Read" : "New"}</span>
              </div>
              {n.body && <p style={{ fontSize: 12, color: "var(--color-muted)", margin: "4px 0" }}>{n.body}</p>}
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                {n.link && <Link href={n.link}>Open</Link>}
                {!n.readAt && (
                  <button type="button" onClick={() => void markOne(n.id)} className="tag">
                    Mark read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
