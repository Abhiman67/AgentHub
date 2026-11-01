#!/bin/sh
# Milestone 4 §7.2 — agent workflow integration tests on an isolated temp DB.
set -e
cd "$(dirname "$0")/.."
export DATABASE_URL="file:./test-integration.db"
cleanup() {
  rm -f prisma/test-integration.db prisma/test-integration.db-journal
}
trap cleanup EXIT
rm -f prisma/test-integration.db prisma/test-integration.db-journal
bunx prisma db push --skip-generate > /dev/null
bunx vitest run --config vitest.integration.config.ts
