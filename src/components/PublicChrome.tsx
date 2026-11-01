import Link from "next/link";
import { LogoMark } from "@/components/Logo";
import ScrollMotion from "@/components/ScrollMotion";

export default function PublicChrome({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ScrollMotion />
      <div className="scroll-progress" aria-hidden="true"><i /></div>
      <header className="site-header">
        <nav className="wrap header-inner" aria-label="Primary">
          <Link className="brand" href="/"><LogoMark /> Backoff</Link>
          <div className="navlinks">
            <Link href="/agents">Agents</Link>
            <Link href="/how-it-works">How it works</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/#faq">FAQ</Link>
          </div>
          <div className="nav-actions">
            <Link href="/login" className="signin">Sign in</Link>
            <Link className="nav-cta" href="/signup">Build your team ↗</Link>
          </div>
          <details className="mobile-menu">
            <summary aria-label="Open menu">☰</summary>
            <div className="mobile-panel">
              <Link href="/agents">Agents</Link>
              <Link href="/how-it-works">How it works</Link>
              <Link href="/pricing">Pricing</Link>
              <Link href="/#faq">FAQ</Link>
              <Link href="/login">Sign in</Link>
              <Link className="nav-cta" href="/signup">Build your team ↗</Link>
            </div>
          </details>
        </nav>
      </header>
      <main id="main">{children}</main>
      <footer className="site-footer">
        <div className="wrap footer-top">
          <div className="footer-brand"><div className="brand"><LogoMark /> Backoff</div><p>A focused AI workspace for students who want to learn deeply, build confidently and move forward.</p><p className="footer-badge">⦿ Human-led, AI-assisted · Approval-first</p></div>
          <div className="footer-column"><strong>Product</strong><Link href="/agents">AI agents</Link><Link href="/how-it-works">How it works</Link><Link href="/pricing">Plans &amp; access</Link><Link href="/signup">Get started</Link></div>
          <div className="footer-column"><strong>Resources</strong><Link href="/#use-cases">Use cases</Link><Link href="/#faq">FAQ</Link><Link href="/login">Sign in</Link><Link href="/forgot-password">Reset password</Link></div>
          <div className="footer-column"><strong>Trust</strong><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/security">Security</Link><Link href="/accessibility">Accessibility</Link><Link href="/status">Status</Link><a href="mailto:hello@backoff.ai">hello@backoff.ai</a></div>
        </div>
        <div className="wrap footer-bottom"><span>© 2026 Backoff. Built for ambitious students.</span><span>Made for meaningful progress · <Link href="/privacy">Privacy-first</Link></span></div>
      </footer>
    </>
  );
}
