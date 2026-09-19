import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getUsage } from "@/lib/usage";
import { getQuota } from "@/lib/quotas";

export async function GET() {
  const s = await auth();
  if (!s?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const u = await db.user.findUnique({ where: { email: s.user.email } });
  if (!u) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const usage = await getUsage(u.id);
  const [messageQuota, fileQuota] = await Promise.all([getQuota(u.id, "messages"), getQuota(u.id, "files")]);
  const agents = await db.agent.count({ where: { ownerId: u.id } });
  return NextResponse.json({
    plan: "Student Pro (MVP)",
    renewal: "No billing in MVP",
    agents,
    ...usage,
    limits: { agents: "unlimited", messages: messageQuota, files: fileQuota },
  });
}

export async function POST(req: Request) {
  const s = await auth();
  if (!s?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const u = await db.user.findUnique({ where: { email: s.user.email } });
  if (!u) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const { type } = await req.json();
    if (!type || typeof type !== "string") {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
    const { trackUsage } = await import("@/lib/usage");
    await trackUsage(u.id, type.slice(0, 50));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to log event" }, { status: 500 });
  }
}

