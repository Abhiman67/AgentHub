const hits = new Map<string, { count: number; reset: number }>();
const MAX_KEYS = 2000;

export function rateLimit(key: string, limit = 10, windowMs = 60_000): boolean {
  const now = Date.now();
  if (hits.size > MAX_KEYS) {
    for (const [k, v] of hits) {
      if (now > v.reset) hits.delete(k);
      if (hits.size <= MAX_KEYS / 2) break;
    }
  }
  const entry = hits.get(key);
  if (!entry || now > entry.reset) {
    hits.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  entry.count += 1;
  return entry.count <= limit;
}

export async function rateLimitDistributed(key: string, limit = 10, windowSeconds = 60): Promise<boolean> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return rateLimit(key, limit, windowSeconds * 1000);
  try {
    const response = await fetch(`${url}/pipeline`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify([["incr", key], ["expire", key, windowSeconds]]) });
    if (!response.ok) return rateLimit(key, limit, windowSeconds * 1000);
    const result = await response.json() as Array<{ result?: number }>;
    return (result[0]?.result ?? limit + 1) <= limit;
  } catch {
    return rateLimit(key, limit, windowSeconds * 1000);
  }
}
