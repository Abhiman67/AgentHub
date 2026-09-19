import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const SKILLS = [
  "react", "next.js", "typescript", "javascript", "python", "java", "sql", "postgresql",
  "mongodb", "git", "docker", "aws", "tailwind", "rest", "graphql", "ci/cd",
  "communication", "teamwork", "problem solving", "data structures", "algorithms",
  "html", "css", "node", "testing"
];

const ROLE_GAPS: Record<string, string[]> = {
  frontend: ["react", "typescript", "next.js", "tailwind", "html", "css", "testing"],
  backend: ["node", "python", "sql", "postgresql", "rest", "git", "testing", "docker"],
  fullstack: ["react", "node", "typescript", "next.js", "sql", "git", "docker", "testing"],
  data: ["python", "sql", "postgresql", "data structures", "problem solving", "testing"],
  mobile: ["javascript", "typescript", "react", "git", "rest", "testing"],
  devops: ["git", "docker", "aws", "ci/cd", "node", "python", "sql", "testing"],
};

export async function POST(req: Request) {
  const s = await auth();
  if (!s?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const u = await db.user.findUnique({ where: { email: s.user.email } });

  const { fileId, targetRole } = await req.json();
  const file = fileId ? await db.file.findFirst({ where: { id: fileId, ownerId: u?.id } }) : null;
  const text = (file?.textContent ?? "").toLowerCase();

  const found = SKILLS.filter((k) => text.includes(k));
  const role = (targetRole ?? "frontend").toLowerCase();
  const need = ROLE_GAPS[role] ?? ROLE_GAPS.frontend;

  const matchedInRole = need.filter((k) => found.includes(k));
  const missing = need.filter((k) => !found.includes(k));

  // Compute ATS score (percentage of role requirements met)
  const rawScore = (matchedInRole.length / need.length) * 100;
  const atsScore = Math.min(Math.max(Math.round(rawScore), text.length > 50 ? 30 : 10), 98);

  const matchTier =
    atsScore >= 80 ? "High Match" : atsScore >= 50 ? "Moderate Match" : "Developing Match";

  const interviewQuestions = missing.slice(0, 3).map((m) => {
    switch (m) {
      case "testing":
        return "How do you approach unit testing and integration testing in your projects?";
      case "docker":
        return "Can you explain containerization and how you use Docker in development vs production?";
      case "sql":
      case "postgresql":
        return "Explain index optimization and how relational joins work under the hood.";
      case "typescript":
        return "What are generics and discriminated unions in TypeScript?";
      default:
        return `How have you applied ${m} in past projects or academic coursework?`;
    }
  });

  return NextResponse.json({
    atsScore,
    matchTier,
    skills: found,
    strengths: matchedInRole.slice(0, 6),
    missing,
    plan: missing.map((m) => `Dedicate 2 hours to ${m} — build one focused demo feature and list it under project experience.`),
    interviewQuestions,
    note: file
      ? `Extracted and parsed from ${file.name}. Review and align with target job requirements.`
      : "Select your resume from Files & Notes for an instant ATS keyword audit.",
  });
}

