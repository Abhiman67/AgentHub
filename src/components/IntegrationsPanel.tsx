"use client";
import { useEffect, useState } from "react";

type Acct = { provider: string; scopes: string[] };
type Prov = { provider: string; capabilities: { name: string; kind: string }[] };

export function IntegrationsPanel() {
  const [accounts, setAccounts] = useState<Acct[]>([]);
  const [providers, setProviders] = useState<Prov[]>([]);
  const [busy, setBusy] = useState("");

  async function load() {
    const res = await fetch("/api/integrations", { cache: "no-store" });
    if (!res.ok) return;
    const d = await res.json();
    setAccounts(d.accounts ?? []);
    setProviders(d.providers ?? []);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, []);

  async function connect(provider: string) {
    setBusy(provider);
    await fetch(`/api/integrations/${provider}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    setBusy("");
    load();
  }

  async function disconnect(provider: string) {
    setBusy(provider);
    await fetch(`/api/integrations/${provider}`, { method: "DELETE" });
    setBusy("");
    load();
  }

  const connected = new Set(accounts.map((a) => a.provider));
  return (
    <div className="card" style={{ padding: 12 }}>
      <h3 style={{ fontSize: 13, margin: "0 0 8px" }}>Connected integrations</h3>
      <p style={{ fontSize: 12, color: "var(--color-muted)", margin: "0 0 8px" }}>Minimum scopes only. Tokens are encrypted. Disconnect revokes access.</p>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 6 }}>
        {providers.map((p) => (
          <li key={p.provider} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
            <b style={{ minWidth: 80 }}>{p.provider}</b>
            <span style={{ color: "var(--color-muted)" }}>{connected.has(p.provider) ? "connected" : "not connected"}</span>
            {connected.has(p.provider) ? (
              <button type="button" className="tag" style={{ cursor: "pointer" }} disabled={busy === p.provider} onClick={() => disconnect(p.provider)}>Disconnect / Revoke</button>
            ) : (
              <button type="button" className="tag" style={{ cursor: "pointer" }} disabled={busy === p.provider} onClick={() => connect(p.provider)}>Connect</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
