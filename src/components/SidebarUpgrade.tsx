"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const COOKIE_NAME = "backoff_upgrade_dismissed";

export default function SidebarUpgrade({
  initialDismissed = false,
}: {
  initialDismissed?: boolean;
}) {
  const [dismissed, setDismissed] = useState(initialDismissed);

  // Sync legacy localStorage state into cookies on mount if not already present
  useEffect(() => {
    try {
      const saved = localStorage.getItem(COOKIE_NAME);
      if (saved === "true" && !initialDismissed) {
        document.cookie = `${COOKIE_NAME}=true; path=/; max-age=31536000; SameSite=Lax`;
        // Use functional setState in a microtask/timer to avoid cascading render warning
        setTimeout(() => setDismissed(true), 0);
      }
    } catch {
      // ignore
    }
  }, [initialDismissed]);

  function handleDismiss(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDismissed(true);
    document.cookie = `${COOKIE_NAME}=true; path=/; max-age=31536000; SameSite=Lax`;
    try {
      localStorage.setItem(COOKIE_NAME, "true");
    } catch {
      // ignore
    }
  }

  function handleRestore(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDismissed(false);
    document.cookie = `${COOKIE_NAME}=false; path=/; max-age=31536000; SameSite=Lax`;
    try {
      localStorage.removeItem(COOKIE_NAME);
    } catch {
      // ignore
    }
  }

  if (dismissed) {
    return (
      <div className="upgrade-card-collapsed">
        <Link href="/pricing" className="upgrade-pill-btn">
          <span>✦</span> Student Pro preview
        </Link>
        <button
          onClick={handleRestore}
          className="upgrade-reopen-btn"
          title="Show details"
          aria-label="Show details"
        >
          ⋯
        </button>
      </div>
    );
  }

  return (
    <div className="upgrade-card">
      <div className="upgrade-card-head">
        <div className="upgrade-badge">
          <span>✦</span> Student Pro preview
        </div>
        <button
          onClick={handleDismiss}
          className="upgrade-close-btn"
          title="Dismiss banner"
          aria-label="Dismiss banner"
        >
          ×
        </button>
      </div>
      <b className="upgrade-card-title">More workspace power, later</b>
      <p className="upgrade-card-desc">Student Pro is planned for a later release. Explore the product direction without entering payment details.</p>
      <Link href="/pricing" className="upgrade-card-btn">
        See what&apos;s planned →
      </Link>
    </div>
  );
}
