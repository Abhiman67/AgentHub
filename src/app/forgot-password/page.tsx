"use client";
import { useState } from "react";
import Link from "next/link";
import { LogoMark } from "@/components/Logo";
import ScrollMotion from "@/components/ScrollMotion";

export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState(() =>
    typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("token") ?? ""
  );
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  async function request(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    const r = await fetch("/api/auth/password-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const d = await r.json().catch(() => ({}));
    if (d.devToken) setToken(d.devToken);
    setSent(true);
    setMessage("If an account exists for that email, reset instructions are ready. Links expire in 30 minutes and work once.");
  }

  async function reset(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    const r = await fetch("/api/auth/password-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const d = await r.json().catch(() => ({}));
    setMessage(r.ok ? "Password updated. You can now sign in." : d.error ?? "Reset failed. Request a new link.");
  }

  return (
    <main className="wrap" style={{ padding: "60px 0" }}>
      <ScrollMotion />
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <Link className="brand" href="/" style={{ justifyContent: "center" }}><LogoMark /> Backoff</Link>
      </div>
      <div className="login-card reveal in">
        <div className="eyebrow">Account recovery</div>
        <h2>Reset your password.</h2>
        <p>Two quick steps. {sent ? "Check the token field, then set a new password." : "Enter your college email and we'll prepare a reset."}</p>
        <div className="bento-mock" aria-hidden="true" style={{ margin: "14px 0 4px" }}>
          <span style={{ background: "var(--color-ink)", color: "#fff", borderColor: "var(--color-ink)" }}>1 · Request link</span>
          <span style={sent ? { background: "var(--color-ink)", color: "#fff", borderColor: "var(--color-ink)" } : undefined}>2 · Set new password</span>
        </div>
        <form onSubmit={request}>
          <label htmlFor="fp-email">Email address</label>
          <input id="fp-email" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@university.edu" autoComplete="email" />
          <button className="button primary-orange shine" style={{ width: "100%", justifyContent: "center", marginTop: 18 }} type="submit">Send reset link ↗</button>
        </form>
        {(sent || token) && (
          <form onSubmit={reset} style={{ marginTop: 8 }}>
            <label htmlFor="fp-token">Reset token</label>
            <input id="fp-token" required value={token} onChange={(e) => setToken(e.target.value)} placeholder="Paste reset token" style={{ fontSize: 12 }} autoComplete="one-time-code" />
            <label htmlFor="fp-pass">New password (min 8 chars)</label>
            <input id="fp-pass" required minLength={8} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="new-password" />
            <button className="button secondary" style={{ width: "100%", justifyContent: "center", marginTop: 18 }} type="submit">Set new password</button>
          </form>
        )}
        {message && <p role="status" style={{ fontSize: 13, color: "#4c555c", background: "#f2eee5", borderRadius: 10, padding: "10px 12px" }}>{message}</p>}
        <p style={{ textAlign: "center" }}>Remember it? <Link href="/login" style={{ color: "var(--color-brand)", fontWeight: 700 }}>Back to sign in</Link> · <Link href="/signup" style={{ color: "var(--color-brand)", fontWeight: 700 }}>Sign up</Link></p>
      </div>
    </main>
  );
}
