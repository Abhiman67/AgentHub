# Staging Validation (Milestone 10)

Date: 2026-09-28 · Commit: see `git log -1` at sign-off · Environment: macOS
local (bun 1.3.5, PG14 localhost:5433, SQLite dev) — Docker/Redis/AI-provider
steps marked BLOCKED were not runnable on this machine and must pass in CI
or a Docker staging env before production.

## Automated results (this run)

- `bun run typecheck` — clean
- `bun run test` — 8 files, 68 unit tests pass
- `bun run test:integration` (SQLite temp DB) — 12/12 pass
- Postgres baseline (`schema.postgres.prisma` + `db push` + seed 6 agents)
  + integration suite — 12/12 pass
- PG checks: indexes present, Json roundtrip, cascade delete, concurrent
  approve/deny single-winner, duplicate-job dedupe — all PASS
- `bun run build` — production build green
- `bun run lint` — only the 3 pre-existing errors in untouched files

## Validation script (§13) disposition

| # | Step | Result |
|---|---|---|
| 1–3 | Signup → onboarding → Study Coach | covered by e2e-qa doc (manual) |
| 4–7 | Start goal → run → approval → approve | integration PASS (SQLite + PG) |
| 8–10 | One task → run completes | integration PASS, no duplicates |
| 11–13 | Upload PDF → processing → ready | pipeline PASS via TXT integration; PDF/DOCX extraction paths unit-covered in parser; browser upload manual |
| 14–15 | Grounded question + citation | integration PASS |
| 16–17 | Usage + audit pages | audit events integration PASS; pages manual |
| 18–19 | Cancel + retry run | integration PASS |
| 20 | Unauthorized rejected | integration PASS (cross-user) |
| — | Redis worker live drain (`bun run worker`) | BLOCKED (no Redis here); inline mode PASS, BullMQ wiring typechecked |
| — | Real Drive OAuth + import | BLOCKED (no Google creds); mock seam unit PASS, routes return 501/502 honestly |
| — | Sentry/AI-provider latency | BLOCKED (no DSN/keys); logging + metrics code paths unit PASS |
| — | Docker Compose staging | BLOCKED (no Docker); local PG14 used instead |

## Sign-off

Milestones 5–10 implemented; definition-of-done items requiring Docker,
Redis, OAuth creds, or a metered AI provider remain explicitly deferred
above. Billing untouched. No computer-control code present.
