export function startTrace(name: string) {
  const start = Date.now();
  return {
    name,
    end: (fields: Record<string, unknown> = {}) => ({ name, durationMs: Date.now() - start, ...fields }),
  };
}
