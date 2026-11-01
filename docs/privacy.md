# Privacy: Retention & Subprocessors (spec §15)

## Data we store
Account + profile, workspace content (subjects, projects, tasks, files,
career data), agent runs/approvals/audit events, encrypted OAuth tokens,
notifications, usage counters.

## Retention
- Active data: kept while the account exists.
- Deleted files: bytes + chunks purged immediately; metadata row marked
  `deleted` for audit, hard-purged after 30 days (see backups note below).
- Deleted accounts: cascade removes all owned rows; object-storage keys are
  deleted in the same request.
- Audit events: retained 12 months for safety investigations, then purged.
- Backups: retained 30 days; deletion requests propagate on the next cycle.

## User controls (all in-app, no support ticket needed)
- Settings → Privacy: export all data (JSON), delete account.
- Settings → Memory: clear conversation context per agent.
- Settings → Integrations: disconnect revokes + deletes credentials.
- Routines can be paused individually or all at once.

## Subprocessors
- AI providers (only when keys configured): OpenAI / Google Gemini —
  prompts + retrieved excerpts; no passwords, tokens, or file bytes beyond
  what the task needs.
- Email (Resend, if configured): auth + notification mail only.
- Hosting/storage: where you deploy (Vercel/filesystem/S3-compatible).
- No training on private notes without explicit consent.

## What we never do
Log or analyze full message bodies, file bytes, or tokens by default;
send or publish anything without an approval record; use student data
for model training.
