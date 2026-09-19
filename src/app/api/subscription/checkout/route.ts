import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const s = await auth();
  if (!s?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ plan: "Student Pro (MVP)", status: "active", renewal: "No billing in MVP — upgrade is a stub." });
}

export async function POST(req: Request) {
  const s = await auth();
  if (!s?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PRICE_ID) {
    return NextResponse.json({ error: "Billing is not configured yet", code: "BILLING_NOT_CONFIGURED" }, { status: 503 });
  }
  const user = await db.user.findUnique({ where: { email: s.user.email }, select: { id: true, email: true } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const origin = new URL(req.url).origin;
  const form = new URLSearchParams({ mode: "subscription", "line_items[0][price]": process.env.STRIPE_PRICE_ID, "line_items[0][quantity]": "1", success_url: `${origin}/app/usage?checkout=success`, cancel_url: `${origin}/app/usage?checkout=cancelled`, client_reference_id: user.id, customer_email: user.email });
  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", { method: "POST", headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, "Content-Type": "application/x-www-form-urlencoded" }, body: form });
  const data = await response.json();
  if (!response.ok || !data.url) return NextResponse.json({ error: "Unable to start checkout" }, { status: 502 });
  return NextResponse.json({ url: data.url });
}
