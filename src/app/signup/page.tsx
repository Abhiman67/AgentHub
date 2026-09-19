"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Signup failed.");
      return;
    }
    const login = await signIn("credentials", { email, password, redirect: false });
    if (login?.error) setError("Account created. Please sign in.");
    else router.push("/app");
  }

  return (
    <main className="wrap" style={{ padding: "60px 0" }}>
      <div className="login-card">
        <div className="eyebrow">Join AgentHub</div>
        <h2>Build your team.</h2>
        <p>Create your workspace and meet your AI team.</p>
        <form onSubmit={onSubmit}>
          <label htmlFor="su-name">Full name</label>
          <input id="su-name" placeholder="Aarav Sharma" value={name} onChange={(e) => setName(e.target.value)} />
          <label htmlFor="su-email">Email address</label>
          <input id="su-email" type="email" placeholder="you@university.edu" value={email} onChange={(e) => setEmail(e.target.value)} />
          <label htmlFor="su-pass">Password (8+ chars)</label>
          <input id="su-pass" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p style={{ color: "#c0392b", fontSize: 13 }}>{error}</p>}
          <button className="button primary" style={{ width: "100%", justifyContent: "center", marginTop: 18 }} type="submit">Create account ↗</button>
        </form>
        <p style={{ textAlign: "center" }}>Have an account? <Link href="/login" style={{ color: "var(--color-brand)", fontWeight: 700 }}>Sign in</Link></p>
      </div>
    </main>
  );
}
