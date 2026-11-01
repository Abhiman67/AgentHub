# Closed Beta Launch Checklist (spec Phase 10)

Billing stays deferred. No user is charged; quotas are enforced by plan stub.

## Pre-launch (all required)
- [x] Typecheck / lint / unit / integration / build green (local + PG14)
- [x] Migrations apply on clean SQLite and clean Postgres
- [x] Seed creates 6 template agents
- [x] Route inventory + link smoke test green
- [x] Privacy, backups, staging docs written
- [x] Security headers configured
- [ ] Docker staging env deployed + health check passing
- [ ] Redis worker live-drain verified (`bun run worker`)
- [ ] Sentry DSN set; error alert routed
- [ ] CRON_SECRET set; tick endpoint verified
- [ ] Google OAuth creds set (or Drive stays mock-gated)
- [ ] AI provider key set (or product runs on deterministic mock)
- [ ] Backup cron + first restore drill recorded
- [ ] Manual e2e QA script executed (docs/e2e-qa.md) with sign-off
- [ ] Accessibility pass on new pages (keyboard-only run-through)
- [ ] Landing page re-verified against shipped features

## Beta (20–50 students)
- Invite-only signup; monitor: signup→onboarding completion, first run,
  approval accept rate, run failure rate, 7-day retention.
- Daily: review `/api/metrics` (queue backlog, dead letters, file failures).
- Kill criteria: pause signups if run failure rate > 5% or any data leak.

## Rollback
- App: redeploy previous image/commit; migrations are additive-only so
  rollback needs no down-migration.
- Data: restore from latest backup (docs/backups.md); verify with
  `test:integration` against the restored copy first.

## Expand only when
Activation > 40%, run failure < 2%, zero safety incidents for 2 weeks.
