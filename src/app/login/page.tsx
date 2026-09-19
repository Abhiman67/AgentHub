"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (res?.error) setError("Invalid email or password.");
    else router.push("/app");
  }

  return (
    <main className="wrap" style={{ padding: "60px 0" }}>
      <div className="login-card">
        <div className="eyebrow">Welcome back</div>
        <h2>Pick up where you left off.</h2>
        <p>Sign in to your AgentHub workspace and get your team moving.</p>
        <form onSubmit={onSubmit}>
          <label htmlFor="login-email">Email address</label>
          <input id="login-email" type="email" placeholder="you@university.edu" value={email} onChange={(e) => setEmail(e.target.value)} />
          <label htmlFor="login-pass">Password</label>
          <input id="login-pass" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p style={{ color: "#c0392b", fontSize: 13 }}>{error}</p>}
          <button className="button primary" style={{ width: "100%", justifyContent: "center", marginTop: 18 }} type="submit">Sign in ↗</button>
        </form>
        <p style={{ textAlign: "center" }}>No account? <Link href="/signup" style={{ color: "var(--color-brand)", fontWeight: 700 }}>Sign up</Link></p>
      </div>
    </main>
  );
}
