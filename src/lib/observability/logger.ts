type Fields = Record<string, unknown>;

export function logInfo(message: string, fields: Fields = {}) {
  if (process.env.NODE_ENV === "test") return;
  console.log(JSON.stringify({ level: "info", message, ...redact(fields) }));
}

export function logError(message: string, fields: Fields = {}) {
  console.error(JSON.stringify({ level: "error", message, ...redact(fields) }));
}

const SECRET_KEYS = ["password", "token", "apiKey", "authorization", "secret", "content", "textContent"];

function redact(fields: Fields): Fields {
  const out: Fields = {};
  for (const [k, v] of Object.entries(fields)) {
    out[k] = SECRET_KEYS.some((s) => k.toLowerCase().includes(s)) ? "[redacted]" : v;
  }
  return out;
}
