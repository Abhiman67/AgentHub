import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listTools } from "@/lib/tools/registry";

export async function GET() {
  const s = await auth();
  if (!s?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ tools: listTools() }, { headers: { "Cache-Control": "no-store" } });
}
