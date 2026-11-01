# Phase 0 Baseline (2026-09-30)

Recorded before any Phase 1 changes. No behavior modified.

## Inventory
- Pages: 36 (public: landing, how-it-works, pricing, agents, login/signup/forgot-password, privacy/terms/accessibility/status/prototype/invite; app: dashboard, agents, chat, projects, tasks, files, career, approvals, usage, settings×5)
- API routes: 48 route files (auth, profile, agents, conversations, agent-runs×5, approvals, tasks, projects, files, career×2, applications, usage, metrics, health, audit, tools, integrations incl. drive×4, subscription×4, workspaces×4)
- Components: 14 (AppShell, SideNav, Topbar, ApprovalCard, RunPanel, ChatMessage, Dialog, states, ErrorBoundary, etc.)
- Migrations: 10 applied (through 20260928090000_json_fields); DB: SQLite dev.db
- Env vars: 14 (DATABASE_URL, AUTH_SECRET, NEXTAUTH_URL, AI keys, Upstash, Resend, Stripe×3)
- Docs: e2e-qa, postgres-staging, staging-validation

## Gate results
- typecheck: clean
- lint: 3 pre-existing errors (agents/[agentId]/page.tsx:110, approvals/page.tsx:61,109)
- tests: 68 unit pass; integration 12 pass (SQLite + PG14 previously)
- build: green

## Known gaps vs master spec (to be built Phases 1–10)
Today/Learning/Progress/Knowledge/Notifications routes; ~15 domain models;
responsibilities system; memory controls; full error envelopes on older routes;
env validation; security headers/rate-limit coverage; a11y pass; e2e suite;
route inventory; staging/prod deploy.
