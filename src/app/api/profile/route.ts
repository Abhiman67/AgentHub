import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { profileSchema } from "@/lib/validations";
import { handleApi, invalid } from "@/lib/api";

export const GET = handleApi(async (_req, { userId }) => {
  const user = await db.user.findUnique({
    where: { id: userId },
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
});

export const PATCH = handleApi(async (req, { userId }) => {
  const body = await req.json();
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) throw invalid("Invalid input");
  const { name, institution, degree, semester, goals, subjects, skills, interests, studyHours, careerTarget, onboardingDone } = parsed.data;
  if (name) await db.user.update({ where: { id: userId }, data: { name } });
  await db.profile.upsert({
    where: { userId },
    create: {
      userId, institution, degree, semester,
      goals: goals ?? [], subjects: subjects ?? [],
      skills: skills ?? [], interests: interests ?? [],
      studyHours, careerTarget, onboardingDone: !!onboardingDone,
    },
    update: {
      institution, degree, semester,
      ...(goals !== undefined ? { goals } : {}),
      ...(subjects !== undefined ? { subjects } : {}),
      ...(skills !== undefined ? { skills } : {}),
      ...(interests !== undefined ? { interests } : {}),
      studyHours, careerTarget,
      ...(onboardingDone !== undefined ? { onboardingDone } : {}),
    },
  });
  return NextResponse.json({ ok: true });
});

export const DELETE = handleApi(async (_req, { userId }) => {
  await db.user.delete({ where: { id: userId } });
  return NextResponse.json({ ok: true });
});
