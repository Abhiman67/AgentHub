import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const s = await auth();
  if (!s?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await db.user.findUnique({ where: { email: s.user.email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const subscription = await db.subscription.upsert({ where: { userId: user.id }, create: { userId: user.id }, update: {}, select: { plan: true, status: true, currentPeriodEnd: true } });
  return NextResponse.json(subscription);
}
