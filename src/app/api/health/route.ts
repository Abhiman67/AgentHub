import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const start = performance.now();
  try {
    await db.$queryRaw`SELECT 1`;
    const latencyMs = Math.round(performance.now() - start);

    return NextResponse.json(
      {
        ok: true,
        service: "agenthub",
        status: "healthy",
        database: {
          status: "connected",
          latencyMs,
        },
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    const latencyMs = Math.round(performance.now() - start);
    return NextResponse.json(
      {
        ok: false,
        service: "agenthub",
        status: "unhealthy",
        database: {
          status: "unavailable",
          latencyMs,
          error: err instanceof Error ? err.message : "Database probe failed",
        },
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}

