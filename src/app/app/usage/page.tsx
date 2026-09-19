"use client";
import { useEffect, useState } from "react";

export default function UsagePage() {
  const [usage, setUsage] = useState<any>(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  async function load() {
    setError("");
    try { const res = await fetch("/api/usage", { cache: "no-store" }); const data = await res.json(); if (!res.ok) throw new Error(data.error ?? "Unable to load usage"); setUsage(data); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to load usage"); }
  }
  useEffect(() => {
    let active = true;
    fetch("/api/usage", { cache: "no-store" }).then(async (res) => { const data = await res.json(); if (!active) return; if (!res.ok) setError(data.error ?? "Unable to load usage"); else setUsage(data); }).catch((e) => { if (active) setError(e instanceof Error ? e.message : "Unable to load usage"); });
    return () => { active = false; };
  }, []);
  async function upgrade() {
    const res = await fetch("/api/subscription/checkout", { method: "POST" });
    const d = await res.json();
    if (res.ok && d.url) window.location.assign(d.url);
    else setMsg(d.error ?? "Checkout unavailable.");
  }
  async function manageBilling() {
    const res = await fetch("/api/subscription/portal", { method: "POST" }); const d = await res.json();
    if (res.ok && d.url) window.location.assign(d.url); else setMsg(d.error ?? "Billing portal unavailable.");
  }
  if (error) return <main className="mx-auto max-w-md p-8 text-center"><h1>Usage unavailable</h1><p className="mt-2 text-sm text-muted">{error}</p><button className="button primary mt-4" onClick={load}>Retry</button></main>;
  if (!usage) return <main className="p-8">Loading usage…</main>;
  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <h1 className="text-3xl font-extrabold">Usage and plan</h1>
      <div className="mt-4 rounded-3xl border border-line bg-card p-6">
        <p className="font-bold">{usage.plan}</p>
        <p className="text-sm text-muted">{usage.renewal} · Transparent limits, no surprises.</p>
        <p className="mt-3 text-sm">Agents: {usage.agents} ({usage.limits?.agents})</p>
        <p className="text-sm">Assistant messages: {usage.conversations} / {usage.limits?.messages?.limit ?? "—"}</p>
        <p className="text-sm">Files: {usage.files} / {usage.limits?.files?.limit ?? "—"}</p>
        <p className="text-sm">Approvals accepted: {usage.byType?.approval_accepted ?? 0} · denied: {usage.byType?.approval_denied ?? 0}</p>
        <button onClick={upgrade} className="mt-4 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white">Upgrade / checkout</button>
        <button onClick={manageBilling} className="mt-4 ml-2 rounded-full border border-line px-5 py-2.5 text-sm font-bold">Manage billing</button>
        {msg && <p className="mt-2 text-sm text-muted">{msg}</p>}
      </div>
    </main>
  );
}
