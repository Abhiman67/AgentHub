import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export default async function SettingsPage() {
  const session = await auth();
  const user = session?.user?.email
    ? await db.user.findUnique({
        where: { email: session.user.email },
        select: {
          id: true,
          name: true,
          email: true,
          profile: true,
        },
      })
    : null;

  const [agentCount, fileCount, taskCount] = await Promise.all([
    user ? db.agent.count({ where: { ownerId: user.id } }) : 0,
    user ? db.file.count({ where: { ownerId: user.id } }) : 0,
    user ? db.task.count({ where: { ownerId: user.id } }) : 0,
  ]);

  const cards = [
    {
      title: "Profile & Academic Context",
      desc: "Manage your name, university, degree, current semester, and career goals.",
      href: "/app/settings/profile",
      icon: "◈",
      color: "yellow",
      badge: user?.profile?.institution || "Not configured",
    },
    {
      title: "Agent Memory & Knowledge",
      desc: "Inspect active context sharing and manage conversation retention per agent.",
      href: "/app/settings/memory",
      icon: "◎",
      color: "lav",
      badge: `${agentCount} active agents`,
    },
    {
      title: "Plan, Quotas & Usage",
      desc: "View your active plan, message counts, file storage, and approval metrics.",
      href: "/app/usage",
      icon: "◧",
      color: "blue",
      badge: "Student Pro (Active)",
    },
    {
      title: "Privacy, Export & Security",
      desc: "Download your entire workspace data in JSON format or delete your account.",
      href: "/app/settings/privacy",
      icon: "⚿",
      color: "green",
      badge: "GDPR Compliant",
    },
    {
      title: "Security Activity",
      desc: "Review password reset and approval events recorded for your account.",
      href: "/app/settings/audit",
      icon: "◷",
      color: "blue",
      badge: "Audit log",
    },
  ];

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", paddingBottom: 40 }}>
      <div className="page-head">
        <div>
          <h1>Workspace Settings</h1>
          <p>Control your personal profile, agent memory, quotas, and privacy.</p>
        </div>
      </div>

      {user && (
        <div className="panel" style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: "50%",
              background: "#d9d4f1",
              display: "grid",
              placeItems: "center",
              fontWeight: 800,
              fontSize: 18,
            }}
          >
            {user.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="grow">
            <h2 style={{ fontSize: 18, margin: "0 0 2px" }}>{user.name}</h2>
            <p style={{ margin: 0, fontSize: 12, color: "var(--color-muted)" }}>
              {user.email} · {taskCount} tasks · {fileCount} notes uploaded
            </p>
          </div>
          <Link href="/app/settings/profile" className="button light" style={{ fontSize: 12, padding: "8px 14px" }}>
            Edit Profile
          </Link>
        </div>
      )}
      <div className="panel" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 16 }}>Workspace</h2>
        <p style={{ fontSize: 13, color: "var(--color-muted)", marginTop: 6 }}>Your personal workspace is ready for future team members and shared project access.</p>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="card"
            style={{
              textDecoration: "none",
              color: "inherit",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              transition: "transform 0.15s ease",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div className={`agent-icon ${c.color}`} style={{ margin: 0, fontSize: 17 }}>
                  {c.icon}
                </div>
                <span className="tag" style={{ fontSize: 11 }}>{c.badge}</span>
              </div>
              <h3 style={{ fontSize: 16, margin: "0 0 6px" }}>{c.title}</h3>
              <p style={{ fontSize: 13, color: "var(--color-muted)", margin: 0, lineHeight: 1.5 }}>
                {c.desc}
              </p>
            </div>
            <div style={{ marginTop: 16, fontSize: 12, fontWeight: 750, color: "var(--color-brand)" }}>
              Configure →
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
