# Backoff E2E QA Script (Milestone 4 §7.3)

No browser framework is configured yet, so this journey is manual until
Milestone 10 staging validation. API-level coverage lives in
`src/lib/agents/workflow.integration.test.ts` (`bun run test:integration`).

## Setup

1. `cp .env.example .env` (SQLite default) → `bun install`
2. `bunx prisma db push` → `bun run dev` → open http://localhost:3000

## Journey (record pass/fail per step)

1. **Signup** — create account → lands on onboarding.
2. **Onboarding** — complete 4 steps → `/app` dashboard with greeting.
3. **Agent workspace** — open Study Coach → empty chat + suggested prompts.
4. **Start goal** — RunPanel: enter "Create a task to revise databases
   tomorrow" → Start → status becomes Waiting for approval.
5. **Approval appears** — approval card shows title, action `create_task`,
   risk, expiry, Approve/Deny.
6. **Approve** — click Approve → success message → run completes.
7. **Task appears** — `/app/tasks` shows exactly one "revise databases" task.
8. **Run completes** — RunPanel shows Completed with 3 steps; refresh keeps
   Completed (no duplicates).
9. **Upload file** — `/app/files`: upload TXT notes → status becomes ready.
10. **Grounded question** — ask about the notes → citation chip appears.
11. **Usage/audit** — `/app/usage` counts the run; approvals page shows the
    decided approval.
12. **Cancel** — start a second run → Cancel → status Cancelled.
13. **Retry** — (via API) resume a failed run → completes without duplicates.
14. **Unauthorized** — logged-out `/app` redirects to `/login`; user B
    cannot open user A's run (`RUN_NOT_FOUND`).

## Sign-off

Record: date, environment, commit, tester, per-step result, failures.
