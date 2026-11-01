import type { Metadata } from "next";
import "./globals.css";
import { ScrollRestoration } from "@/components/ScrollRestoration";

export const metadata: Metadata = {
  title: "Backoff — Your personal AI team for college",
  description:
    "Backoff gives every student a personal team of AI agents — Study Coach, Project Guide, Career Scout and more — sharing your notes, projects and deadlines. You approve before anything is sent.",
  keywords: ["AI study planner", "student AI agents", "project guide", "career scout", "interview prep", "Backoff"],
  openGraph: {
    title: "Backoff — Your goals in. Momentum out.",
    description:
      "Six specialized student agents sharing one workspace. Study plans, project milestones, resume drafts — with human approval built in.",
    type: "website",
    url: "https://backoff.ai",
  },
  twitter: {
    card: "summary_large_image",
    title: "Backoff — Meet the team behind your next big win",
    description: "Study Coach, Project Guide, Career Scout + 3 more. Free Starter plan.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ScrollRestoration />
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
