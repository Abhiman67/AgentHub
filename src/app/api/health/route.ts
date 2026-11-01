import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Queue } from "bullmq";
import { QUEUE_NAME, getRedisUrl } from "@/lib/jobs/redis";

export async function GET() {
  const start = performance.now();
  let redis: { status: "connected" | "unavailable" | "not_configured"; latencyMs?: number; error?: string } = {
    status: "not_configured",
  };
  try {
    await db.$queryRaw`SELECT 1`;
    const latencyMs = Math.round(performance.now() - start);

    if ((process.env.JOB_EXECUTION_MODE ?? "inline") === "redis") {
      const redisStart = performance.now();
      const queue = new Queue(QUEUE_NAME, {
        connection: { url: getRedisUrl(), lazyConnect: true, maxRetriesPerRequest: 1 },
      });
      try {
        await queue.waitUntilReady();
        redis = { status: "connected", latencyMs: Math.round(performance.now() - redisStart) };
      } catch (err) {
        redis = {
          status: "unavailable",
          latencyMs: Math.round(performance.now() - redisStart),
          error: err instanceof Error ? err.message : "Redis probe failed",
        };
      } finally {
        await queue.close();
      }
    }

    const healthy = redis.status !== "unavailable";

    return NextResponse.json(
      {
        ok: healthy,
        service: "backoff",
        status: healthy ? "healthy" : "unhealthy",
        database: {
          status: "connected",
          latencyMs,
        },
        redis,
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      },
      { status: healthy ? 200 : 503, headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    const latencyMs = Math.round(performance.now() - start);
    return NextResponse.json(
      {
        ok: false,
        service: "backoff",
        status: "unhealthy",
        database: {
          status: "unavailable",
          latencyMs,
          error: err instanceof Error ? err.message : "Database probe failed",
        },
        redis,
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}

