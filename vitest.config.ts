import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  // DB-backed workflow tests run only via `bun run test:integration`
  // against an isolated temp database, never the dev database.
  test: { exclude: ["**/*.integration.test.ts", "node_modules/**"] },
});
