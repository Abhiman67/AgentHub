"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function AcceptInviteForm() {
  const params = useSearchParams();
  const [token, setToken] = useState(params.get("token") ?? "");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  async function accept(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/workspace-invites/accept", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
    const data = await res.json();
    if (res.ok) { setDone(true); setMessage("Invitation accepted. You can now open the workspace."); }
    else setMessage(data.error ?? "Unable to accept invitation.");
  }
  return <main className="mx-auto max-w-md px-5 py-16"><h1 className="text-3xl font-extrabold">Join workspace</h1><p className="mt-2 text-sm text-muted">Sign in with the invited email, then accept the invitation.</p>{done ? <><p className="mt-6" role="status">{message}</p><Link href="/app" className="button primary mt-6 inline-flex">Open workspace</Link></> : <form onSubmit={accept} className="mt-6 space-y-3"><label className="block text-sm font-semibold">Invitation token<input required value={token} onChange={e => setToken(e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-line px-3 text-xs" /></label><button className="button primary" type="submit">Accept invitation</button>{message && <p role="alert" className="text-sm">{message}</p>}</form>}<Link href="/login" className="mt-6 block text-sm underline">Sign in</Link></main>;
}
export default function AcceptInvitePage() {
  return <Suspense fallback={<main className="mx-auto max-w-md px-5 py-16">Loading invitation…</main>}><AcceptInviteForm /></Suspense>;
}
