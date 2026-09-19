"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";

const crumbs: Record<string, string> = {
  "/app": "Overview",
  "/app/agents": "My agents",
  "/app/projects": "Projects",
  "/app/tasks": "Tasks",
  "/app/files": "Files & notes",
  "/app/career": "Career",
  "/app/usage": "Usage & plan",
  "/app/settings": "Settings",
  "/app/settings/profile": "Profile settings",
  "/app/settings/memory": "Memory & context",
  "/app/settings/privacy": "Privacy & data",
};

type QuickItem = {
  title: string;
  category: string;
  href: string;
  icon: string;
};

const SEARCH_ITEMS: QuickItem[] = [
  { title: "Study Coach", category: "Agents", href: "/app/agents", icon: "◒" },
  { title: "Project Guide", category: "Agents", href: "/app/agents", icon: "⌘" },
  { title: "Career Scout", category: "Agents", href: "/app/agents", icon: "↗" },
  { title: "Code Mentor", category: "Agents", href: "/app/agents", icon: "◉" },
  { title: "Writing Buddy", category: "Agents", href: "/app/agents", icon: "✎" },
  { title: "Interview Coach", category: "Agents", href: "/app/agents", icon: "☼" },
  { title: "Projects & Milestones", category: "Workspace", href: "/app/projects", icon: "▣" },
  { title: "Tasks & Planner", category: "Workspace", href: "/app/tasks", icon: "✓" },
  { title: "Files & Notes (Flashcards, Quizzes)", category: "Workspace", href: "/app/files", icon: "↥" },
  { title: "Usage, Limits & Plan", category: "Settings", href: "/app/usage", icon: "◧" },
  { title: "Profile & Education Settings", category: "Settings", href: "/app/settings/profile", icon: "◈" },
  { title: "Memory & Agent Context", category: "Settings", href: "/app/settings/memory", icon: "◎" },
  { title: "Privacy & Data Export", category: "Settings", href: "/app/settings/privacy", icon: "⚿" },
];

type Approval = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
};

export default function Topbar({ tag }: { tag: string }) {
  const path = usePathname();
  const router = useRouter();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [approvals, setApprovals] = useState<Approval[]>([]);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Load pending approvals for notifications
  useEffect(() => {
    fetch("/api/approvals")
      .then((r) => r.json())
      .then((d) => {
        const pending = (d.approvals ?? []).filter((a: { status: string }) => a.status === "pending");
        setApprovals(pending);
      })
      .catch(() => {});
  }, [path]);

  // Global hotkey Cmd+K or Ctrl+K for search
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setSearchOpen(false);
        setNotifOpen(false);
        setUserMenuOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Focus input when search opens
  useEffect(() => {
    if (searchOpen) {
      const timer = setTimeout(() => searchInputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [searchOpen]);

  // Close menus when clicking outside
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const label =
    crumbs[path] ??
    (path.startsWith("/app/agents/")
      ? "Agent chat"
      : path.startsWith("/app/projects/")
      ? "Project"
      : "Workspace");

  const filteredItems = SEARCH_ITEMS.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="topbar">
        <div className="crumb">
          Workspace / <b>{label}</b>
        </div>

        <div className="top-actions" style={{ position: "relative" }}>
          {/* Search Button */}
          <button
            className="icon-btn"
            aria-label="Quick search (Cmd+K)"
            title="Quick search (Cmd+K)"
            onClick={() => setSearchOpen(true)}
            style={{ fontSize: 14 }}
          >
            ⌕
          </button>

          {/* Notifications Button & Dropdown */}
          <div ref={notifRef} style={{ position: "relative" }}>
            <button
              className={`icon-btn${approvals.length > 0 ? " notif" : ""}`}
              aria-label="Notifications & approvals"
              title="Notifications & approvals"
              onClick={() => {
                setNotifOpen(!notifOpen);
                setUserMenuOpen(false);
              }}
              style={{ fontSize: 13 }}
            >
              ♧
            </button>

            {notifOpen && (
              <div
                style={{
                  position: "absolute",
                  top: 48,
                  right: 0,
                  width: 320,
                  background: "var(--color-card)",
                  border: "1px solid var(--color-line)",
                  borderRadius: 16,
                  boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
                  padding: 16,
                  zIndex: 100,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <b style={{ fontSize: 13 }}>Notifications</b>
                  <span className="tag" style={{ fontSize: 10 }}>
                    {approvals.length} pending
                  </span>
                </div>

                {approvals.length === 0 ? (
                  <div style={{ padding: "12px 0", textAlign: "center" }}>
                    <p style={{ fontSize: 12, color: "var(--color-muted)", margin: 0 }}>
                      ✓ All caught up! No actions require review.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 220, overflowY: "auto" }}>
                    {approvals.map((a) => (
                      <Link
                        key={a.id}
                        href="/app/agents"
                        onClick={() => setNotifOpen(false)}
                        style={{
                          textDecoration: "none",
                          color: "inherit",
                          padding: 10,
                          borderRadius: 10,
                          background: "var(--color-paper)",
                          display: "block",
                        }}
                      >
                        <p style={{ fontSize: 12, fontWeight: 700, margin: "0 0 4px" }}>{a.title}</p>
                        <small style={{ fontSize: 11, color: "var(--color-muted)", display: "block" }}>
                          {a.description}
                        </small>
                      </Link>
                    ))}
                  </div>
                )}

                <div style={{ borderTop: "1px solid var(--color-line)", marginTop: 12, paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
                  <Link
                    href="/app/tasks"
                    onClick={() => setNotifOpen(false)}
                    style={{ fontSize: 11, color: "var(--color-brand)", fontWeight: 700, textDecoration: "none" }}
                  >
                    View planner tasks →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Avatar & Dropdown */}
          <div ref={userMenuRef} style={{ position: "relative" }}>
            <div
              className="top-avatar"
              onClick={() => {
                setUserMenuOpen(!userMenuOpen);
                setNotifOpen(false);
              }}
              style={{ cursor: "pointer", userSelect: "none" }}
              title="Account & Settings menu"
            >
              {tag}
            </div>

            {userMenuOpen && (
              <div
                style={{
                  position: "absolute",
                  top: 48,
                  right: 0,
                  width: 230,
                  background: "var(--color-card)",
                  border: "1px solid var(--color-line)",
                  borderRadius: 16,
                  boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
                  padding: "8px 0",
                  zIndex: 100,
                }}
              >
                <div style={{ padding: "8px 16px 12px", borderBottom: "1px solid var(--color-line)" }}>
                  <p style={{ fontSize: 12, fontWeight: 800, margin: 0 }}>Student Account</p>
                  <small style={{ color: "var(--color-muted)", fontSize: 11 }}>Signed in</small>
                </div>

                <div style={{ padding: "6px 0" }}>
                  <Link
                    href="/app/settings/profile"
                    onClick={() => setUserMenuOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "9px 16px",
                      fontSize: 13,
                      color: "inherit",
                      textDecoration: "none",
                      fontWeight: 600,
                    }}
                    className="hover-bg"
                  >
                    <span style={{ fontSize: 13, width: 16, textAlign: "center" }}>◈</span> Profile & Education
                  </Link>

                  <Link
                    href="/app/settings/memory"
                    onClick={() => setUserMenuOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "9px 16px",
                      fontSize: 13,
                      color: "inherit",
                      textDecoration: "none",
                      fontWeight: 600,
                    }}
                    className="hover-bg"
                  >
                    <span style={{ fontSize: 13, width: 16, textAlign: "center" }}>◎</span> Agent Memory & Context
                  </Link>

                  <Link
                    href="/app/usage"
                    onClick={() => setUserMenuOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "9px 16px",
                      fontSize: 13,
                      color: "inherit",
                      textDecoration: "none",
                      fontWeight: 600,
                    }}
                    className="hover-bg"
                  >
                    <span style={{ fontSize: 13, width: 16, textAlign: "center" }}>◧</span> Plan & Usage Limits
                  </Link>

                  <Link
                    href="/app/settings/privacy"
                    onClick={() => setUserMenuOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "9px 16px",
                      fontSize: 13,
                      color: "inherit",
                      textDecoration: "none",
                      fontWeight: 600,
                    }}
                    className="hover-bg"
                  >
                    <span style={{ fontSize: 13, width: 16, textAlign: "center" }}>⚿</span> Privacy & Export
                  </Link>
                </div>

                <div style={{ borderTop: "1px solid var(--color-line)", padding: "6px 8px 0" }}>
                  <button
                    onClick={async () => {
                      setUserMenuOpen(false);
                      await signOut({ callbackUrl: "/" });
                    }}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      background: "none",
                      border: 0,
                      textAlign: "left",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#c0392b",
                      cursor: "pointer",
                      borderRadius: 8,
                    }}
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Command Palette / Quick Search Overlay */}
      {searchOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(23, 32, 42, 0.4)",
            backdropFilter: "blur(4px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            paddingTop: "14vh",
            zIndex: 1000,
          }}
          onClick={() => setSearchOpen(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 540,
              background: "var(--color-card)",
              borderRadius: 20,
              border: "1px solid var(--color-line)",
              boxShadow: "0 20px 48px rgba(0,0,0,0.2)",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", padding: "14px 18px", borderBottom: "1px solid var(--color-line)" }}>
              <span style={{ fontSize: 16, color: "var(--color-muted)", marginRight: 10 }}>⌕</span>
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type to search agents, projects, tasks, or settings…"
                style={{
                  width: "100%",
                  border: 0,
                  outline: "none",
                  fontSize: 14,
                  background: "transparent",
                  color: "var(--color-ink)",
                }}
              />
              <button
                onClick={() => setSearchOpen(false)}
                style={{ background: "none", border: 0, fontSize: 11, fontWeight: 700, color: "var(--color-muted)", cursor: "pointer" }}
              >
                ESC
              </button>
            </div>

            <div style={{ maxHeight: 320, overflowY: "auto", padding: "8px 0" }}>
              {filteredItems.length === 0 ? (
                <div style={{ padding: "20px 18px", textAlign: "center", color: "var(--color-muted)", fontSize: 13 }}>
                  No matching destinations found.
                </div>
              ) : (
                filteredItems.map((item) => (
                  <div
                    key={item.href + item.title}
                    onClick={() => {
                      setSearchOpen(false);
                      router.push(item.href);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 18px",
                      cursor: "pointer",
                      borderBottom: "1px solid rgba(0,0,0,0.03)",
                    }}
                    className="hover-bg"
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 15 }}>{item.icon}</span>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{item.title}</span>
                    </div>
                    <span className="tag" style={{ fontSize: 10, padding: "2px 8px" }}>
                      {item.category}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
