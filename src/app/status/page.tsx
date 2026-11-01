import type { Metadata } from "next";
import PublicChrome from "@/components/PublicChrome";

export const metadata: Metadata = { title: "Status — Backoff", description: "Backoff system status and uptime." };

export default function StatusPage() {
  return (
    <PublicChrome>
      <section className="wrap ref-section reveal" style={{ maxWidth: 860 }}>
        <div className="kicker">Trust</div>
        <h1 data-split style={{ fontSize: "clamp(36px,5vw,58px)", letterSpacing: "-0.065em", margin: "0 0 12px" }}>All systems normal.</h1>
        <p className="lead">Live status dashboard launches with public release. Meanwhile: app, auth and file processing are operational.</p>
        <div className="card" style={{ marginTop: 28, display: "grid", gap: 12, fontSize: 14 }}>
          {[["App & workspace", "Operational"], ["Sign in & onboarding", "Operational"], ["File processing", "Operational"]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--color-line)", paddingTop: 12 }}>
              <b>{k}</b><span style={{ color: "#5e9e68", fontWeight: 800 }}>● {v}</span>
            </div>
          ))}
        </div>
      </section>
    </PublicChrome>
  );
}
