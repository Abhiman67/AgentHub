import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: "Billing is not configured yet", code: "BILLING_NOT_CONFIGURED" }, { status: 503 });
  const user = await db.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
  const subscription = user ? await db.subscription.findUnique({ where: { userId: user.id }, select: { providerCustomerId: true } }) : null;
  if (!subscription?.providerCustomerId) return NextResponse.json({ error: "No billing customer found" }, { status: 404 });
  const origin = new URL(req.url).origin;
  const form = new URLSearchParams({ customer: subscription.providerCustomerId, return_url: `${origin}/app/usage` });
  const response = await fetch("https://api.stripe.com/v1/billing_portal/sessions", { method: "POST", headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, "Content-Type": "application/x-www-form-urlencoded" }, body: form });
  const data = await response.json();
  if (!response.ok || !data.url) return NextResponse.json({ error: "Unable to open billing portal" }, { status: 502 });
  return NextResponse.json({ url: data.url });
}
