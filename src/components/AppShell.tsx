import Link from "next/link";
import { cookies } from "next/headers";
import { auth, signOut } from "@/auth";
import Topbar from "./Topbar";
import { SideNav, MobileNav } from "./SideNav";
import SidebarUpgrade from "./SidebarUpgrade";

function initials(name?: string | null, email?: string | null) {
  if (name) return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (email ?? "ST").slice(0, 2).toUpperCase();
}

export default async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const name = session?.user?.name ?? "Student";
  const email = session?.user?.email ?? "";
  const tag = initials(session?.user?.name, email);

  const cookieStore = await cookies();
  const initialDismissed = cookieStore.get("agenthub_upgrade_dismissed")?.value === "true";

  return (
    <div className="dash-layout">
      <aside className="sidebar">
        <div className="sidebar-main">
          <Link href="/" className="brand">
            <span className="logo">✦</span> agenthub
          </Link>
          <div className="label">Workspace</div>
          <SideNav />
          <div className="workspace-list">
            <div className="label">Your space</div>
            <Link href="/app/projects"><i className="workspace-dot" /> Semester</Link>
            <Link href="/app/projects"><i className="workspace-dot green" /> Major project</Link>
          </div>
        </div>

        <div className="sidebar-footer">
          <SidebarUpgrade initialDismissed={initialDismissed} />
          <div className="dash-profile-row">
            <Link
              href="/app/settings/profile"
              className="dash-profile-info"
              title="Profile & settings"
            >
              <div className="avatar">{tag}</div>
              <div className="dash-profile-text">
                <b>{name}</b>
                <small title={email}>{email}</small>
              </div>
            </Link>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                aria-label="Sign out"
                className="dash-signout-btn"
                title="Sign out"
              >
                ⎋
              </button>
            </form>
          </div>
        </div>
      </aside>
      <div className="main">
        <Topbar tag={tag} />
        {children}
      </div>
      <MobileNav />
    </div>
  );
}
