import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signupSchema } from "@/lib/validations";
import { rateLimitDistributed } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  if (!(await rateLimitDistributed(`signup:${ip}`, 10))) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }
  const body = await req.json();
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { name, email, password } = parsed.data;
  const existing = await db.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await db.user.create({
    data: {
      name, email: email.toLowerCase(), passwordHash, profile: { create: {} },
      memberships: { create: { role: "owner", workspace: { create: { name: `${name}'s workspace` } } } },
    },
  });
  return NextResponse.json({ id: user.id }, { status: 201 });
}
