// Minimal Sentry-compatible reporter: posts to SENTRY_DSN when set, else no-op.
// Never send message content, file bytes, or tokens — only codes and ids.
export async function captureError(code: string, fields: Record<string, unknown> = {}) {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  try {
    await fetch(dsn, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level: "error", code, ...sanitize(fields), timestamp: new Date().toISOString() }),
    });
  } catch {}
}

function sanitize(fields: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) {
    out[k] = /token|secret|content|message|password|key/i.test(k) ? "[redacted]" : v;
  }
  return out;
}
