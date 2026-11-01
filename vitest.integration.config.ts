import { defineConfig } from "vitest/config";
import path from "path";

// Integration config: runs ONLY DB-backed workflow tests.
// The DATABASE_URL env var must point at a temp database (see scripts/test-integration.sh).
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: { include: ["src/**/*.integration.test.ts"], testTimeout: 30000 },
});
