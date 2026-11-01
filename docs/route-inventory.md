# Route Inventory (spec §18)

Last verified: 2026-09-30. Automated check: `src/lib/routes.test.ts`.

## Public (no auth)

| Route | APIs used | Status |
|---|---|---|
| `/` | none | verified 2026-09-30 |
| `/agents` | none | verified 2026-09-30 |
| `/how-it-works` | none | verified 2026-09-30 |
| `/pricing` | none | verified 2026-09-30 |
| `/login`, `/signup`, `/forgot-password` | next-auth, `/api/auth/*` | verified 2026-09-30 |
| `/privacy`, `/terms`, `/accessibility`, `/status` | none | verified 2026-09-30 |
| `/security` | none | verified 2026-09-30 |
| `/invite/accept` | `/api/workspace-invites/accept` | needs check |
| `/prototype` | none (design reference) | needs check |

## Authenticated (`/app/*`, proxy-guarded + onboarding gate)

| Route | APIs used | Status |
|---|---|---|
| `/app` | profile, tasks, projects, agents | verified 2026-09-30 |
| `/app/today` | redirects to `/app` | verified 2026-09-30 |
| `/app/learning`, `/app/learning/[subjectId]` | `/api/subjects*`, files | verified 2026-09-30 |
| `/app/progress` | tasks, projects, subjects | added 2026-11-01 |
| `/app/knowledge` | files, `/api/search` | added 2026-11-01 |
| `/app/agents`, `/app/agents/[agentId]` | `/api/agents`, conversations, agent-runs, approvals | verified 2026-09-30 |
| `/app/projects`, `/new`, `/[projectId]` | `/api/projects*`, tasks | verified 2026-09-30 |
| `/app/tasks` | `/api/tasks` | verified 2026-09-30 |
| `/app/files` | `/api/files*` | verified 2026-09-30 |
| `/app/career` | `/api/career/*`, applications | verified 2026-09-30 |
| `/app/approvals` | `/api/approvals*` | verified 2026-09-30 |
| `/app/usage` | `/api/usage`, subscription | verified 2026-09-30 |
| `/app/settings` (+profile/memory/privacy/integrations/audit) | `/api/profile`, integrations, audit | verified 2026-09-30 |
| `/onboarding` | `/api/profile`, `/api/agents/ensure` | verified 2026-09-30 |

## Planned (spec §3, not built)

`/app/progress`, `/app/knowledge`, `/app/notifications`, `/app/career/[goalId]`,
`/app/settings/data`, `/api/me`, `/api/today`, `/api/knowledge`, `/api/search`,
`/api/responsibilities*`, `/api/notifications*`.

## Built since baseline (Phases 1–4)

`/security`, `/app/today` (alias), `/app/learning[/subjectId]`,
`/api/recommendations`, `/api/capture`, `/api/activity`, `/api/subjects*`
(subjects, topics, outcomes, sessions, evidence, revision-plan, files).

## Built in Phase 5

`/app/career/[goalId]`, `/api/projects/[id]/milestones`,
`/api/projects/[id]/risks`, `/api/career/goals`, `/api/career/goals/[goalId]`,
task↔milestone linking (`milestoneId` on task create/update).

## Built in Phase 7

`/app/responsibilities` (CRUD, pause/resume/trigger/delete, pause-all),
`/app/notifications`, `/api/responsibilities*` (incl. secret-gated tick +
`responsibility.tick` job + worker repeat schedule),
`/api/notifications`, grouped/rate-limited notifications, settings kill
switch, Topbar notifications link.

## Built in Phase 8

`/api/search` (workspace-wide, owner-scoped). Vectors stay on the
pseudo-embedding stub; pgvector column lands with the extension
(`prisma/pgvector.sql`). Integrations 2–6 remain mock-gated behind the
same scope/approval checks; Drive is the validated read-only path.
