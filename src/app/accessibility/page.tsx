import type { Metadata } from "next";
import PublicChrome from "@/components/PublicChrome";

export const metadata: Metadata = { title: "Accessibility — Backoff", description: "Our WCAG 2.2 AA commitment: keyboard access, focus states, contrast, reduced motion." };

export default function AccessibilityPage() {
  return (
    <PublicChrome>
      <section className="wrap ref-section reveal" style={{ maxWidth: 860 }}>
        <div className="kicker">Trust</div>
        <h1 data-split style={{ fontSize: "clamp(36px,5vw,58px)", letterSpacing: "-0.065em", margin: "0 0 12px" }}>Accessible by default.</h1>
        <p className="lead">We target WCAG 2.2 AA: full keyboard flows, visible focus, 4.5:1 text contrast, reduced-motion support and screen-reader labels.</p>
        <div className="card" style={{ marginTop: 28, display: "grid", gap: 16, fontSize: 14, color: "#4c555c", lineHeight: 1.7 }}>
          <p style={{ margin: 0 }}>Need something? Write to <a href="mailto:hello@backoff.ai" style={{ color: "var(--color-brand)", fontWeight: 700 }}>hello@backoff.ai</a> with subject “Accessibility” — we reply within 2 working days.</p>
        </div>
      </section>
    </PublicChrome>
  );
}
