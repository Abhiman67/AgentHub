# PostgreSQL Staging (Milestone 6)

Local dev stays on SQLite (`prisma/schema.prisma`, `DATABASE_URL=file:./dev.db`).
Staging/Postgres uses `prisma/schema.postgres.prisma` (provider `postgresql`,
same models; string-encoded JSON fields are native `Json`).

## Start Postgres + seed (local, no Docker)

```bash
# one-time: local PG14 cluster on :5433
export PGDIR="$HOME/.backoff-pg14"
initdb -D "$PGDIR/data" -E UTF8
echo "port = 5433" >> "$PGDIR/data/postgresql.conf"
pg_ctl -D "$PGDIR/data" -l "$PGDIR/log" start
psql -h localhost -p 5433 -d postgres \
  -c "CREATE USER backoff WITH PASSWORD 'backoff';" \
  -c "CREATE DATABASE backoff OWNER backoff;"
```

## Baseline the staging database

```bash
export PGURL="postgresql://backoff:backoff@localhost:5433/backoff?connection_limit=5&pool_timeout=10"
# fresh staging DB: push schema (migration history starts here)
DATABASE_URL="$PGURL" bunx prisma db push --schema=prisma/schema.postgres.prisma --skip-generate
# pgvector (requires the extension on the server; skipped where unavailable)
psql "$PGURL" -f prisma/pgvector.sql
# generate the PG client, seed, run API/integration tests
bunx prisma generate --schema=prisma/schema.postgres.prisma
DATABASE_URL="$PGURL" bun prisma/seed.ts
DATABASE_URL="$PGURL" bunx vitest run --config vitest.integration.config.ts
# restore the local SQLite client afterwards
bunx prisma generate
```

## Reset

```bash
psql -h localhost -p 5433 -d postgres -c "DROP DATABASE backoff;" -c "CREATE DATABASE backoff OWNER backoff;"
# then re-run the baseline steps above
```

## Verified 2026-09-28 (local PG14, `backoff` DB)

- `db push` from `schema.postgres.prisma`: clean
- Seed: 6 agents
- Integration suite: 10/10 pass on Postgres (Json fields, guarded approvals)
- Indexes present on AgentRun/AgentStep/ToolCall/FileChunk
- Cascade: deleting a user removes profile + projects
- Concurrent approve/deny on one approval: exactly one winner
- Duplicate job submission with same idempotency key: deduped
- Known gaps: pgvector extension not installed locally (no `vector`
  column yet; `prisma/pgvector.sql` is the plan); Docker Compose path
  (`docker compose up -d db redis`) is the production route and was not
  exercised here (no Docker on this machine).
