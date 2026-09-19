import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { profileSchema } from "@/lib/validations";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      updatedAt: true,
      profile: true,
    },
  });
  return NextResponse.json({ user });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { name, institution, degree, semester, goals, subjects, skills, interests, studyHours, careerTarget, onboardingDone } = parsed.data;
  if (name) await db.user.update({ where: { id: user.id }, data: { name } });
  await db.profile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id, institution, degree, semester,
      goals: JSON.stringify(goals ?? []), subjects: JSON.stringify(subjects ?? []),
      skills: JSON.stringify(skills ?? []), interests: JSON.stringify(interests ?? []),
      studyHours, careerTarget, onboardingDone: !!onboardingDone,
    },
    update: {
      institution, degree, semester,
      ...(goals !== undefined ? { goals: JSON.stringify(goals) } : {}),
      ...(subjects !== undefined ? { subjects: JSON.stringify(subjects) } : {}),
      ...(skills !== undefined ? { skills: JSON.stringify(skills) } : {}),
      ...(interests !== undefined ? { interests: JSON.stringify(interests) } : {}),
      studyHours, careerTarget,
      ...(onboardingDone !== undefined ? { onboardingDone } : {}),
    },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await db.user.delete({ where: { id: user.id } });
  return NextResponse.json({ ok: true });
}
