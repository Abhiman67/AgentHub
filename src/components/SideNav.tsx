"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const links: [string, string, string][] = [
  ["Overview", "/app", "⌂"],
  ["My agents", "/app/agents", "✦"],
  ["Projects", "/app/projects", "▣"],
  ["Tasks", "/app/tasks", "✓"],
  ["Approvals", "/app/approvals", "🛡"],
  ["Files & notes", "/app/files", "↥"],
  ["Career", "/app/career", "↗"],
  ["Usage & plan", "/app/usage", "◧"],
  ["Settings", "/app/settings", "◈"],
];

export function isActive(path: string, href: string) {
  if (href === "/app") return path === "/app";
  return path === href || path.startsWith(href + "/");
}

export function SideNav() {
  const path = usePathname();
  return (
    <nav className="dash-nav" aria-label="Workspace">
      {links.map(([label, href, icon]) => (
        <Link key={href} href={href} aria-current={isActive(path, href) ? "page" : undefined} className={isActive(path, href) ? "active" : ""}>
          <span className="ic">{icon}</span> {label}
        </Link>
      ))}
    </nav>
  );
}

export function MobileNav() {
  const path = usePathname();
  const items: [string, string, string][] = [
    ["Home", "/app", "⌂"],
    ["Agents", "/app/agents", "✦"],
    ["Projects", "/app/projects", "▣"],
    ["Tasks", "/app/tasks", "✓"],
    ["Approvals", "/app/approvals", "🛡"],
    ["Profile", "/app/settings", "◈"],
  ];
  return (
    <nav className="mobile-nav" aria-label="Mobile">
      {items.map(([label, href, icon]) => (
        <Link key={href} href={href} aria-current={isActive(path, href) ? "page" : undefined} className={isActive(path, href) ? "active" : ""}>
          <span>{icon}</span>{label}
        </Link>
      ))}
    </nav>
  );
}
