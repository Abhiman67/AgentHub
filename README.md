# AgentHub — Your AI Student Team

> Your goals in. Momentum out.

AgentHub gives every student a personal team of specialized AI agents — **Study Coach, Project Guide, Career Scout, Writing Buddy, Code Mentor, Interview Coach** — inside one calm workspace for studying, projects, careers, and daily planning.

- **Study smarter:** upload notes, get revision plans, flashcards, and quizzes with source citations.
- **Build better:** scope projects into milestones, link agents and files to project context.
- **Get ahead:** review resumes, track applications, draft cover letters (always as drafts needing approval).
- **Stay in control:** every external or destructive action requires your explicit approval.

**Status:** Working MVP (all 8 build phases implemented). Not yet production-ready — see [REMAINING.md](./REMAINING.md) for the full gap analysis. Product spec: [design.md](./design.md). Build contract: [planning.md](./planning.md).

---

## ✨ Features

| Area | What works |
|---|---|
| Public site | Landing, agents, how-it-works, pricing, privacy/terms, login/signup |
| Auth | Email/password (Auth.js credentials, bcrypt-12, JWT sessions), protected `/app` + `/onboarding`, login rate-limiting |
| Onboarding | 4 steps (education → goals → context → agents); goals drive agent activation |
| Agents | 6 templates + custom agents (safety notice; custom prompts can't override approvals) |
| Chat | Streaming SSE responses, Markdown-ready bubbles, citations, approval cards, conversation list/rename/delete, project attach, suggested prompts, retry |
| Files | PDF/TXT/MD/DOCX upload (10 MB), preview, summarize/flashcards/quiz, per-file delete + status |
| Projects | CRUD, detail (milestones, linked agents, members, activity), agent linking, project-scoped chat context |
| Planner | Today / Week / Calendar views, priorities, due dates, completion tracking |
| Career | Resume keyword analysis + skill-gap plan, application tracker (`saved → offer/rejected`), DRAFT cover letters |
| Safety | Approval lifecycle (`pending → approved/denied/expired`, 7-day TTL), audit usage events, human-in-the-loop copy throughout |
| Usage | Plan display, message/file counts, approval stats, checkout stub |

---

## 🧱 Tech stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript strict, Tailwind CSS v4, reference-ported design system in `src/app/globals.css`
- **Auth:** Auth.js v5 (credentials provider, JWT sessions, `src/proxy.ts` route guard)
- **Data:** Prisma 6 + SQLite locally (`prisma/dev.db`), Postgres in production (migration history in `prisma/migrations`)
- **Validation:** Zod on all mutating APIs
- **AI:** `ChatEvent`/`ChatInput` streaming protocol (`src/lib/ai.ts`) — **mock provider by default**, no keys needed; swap in OpenAI/Gemini per interface
- **Tests:** Vitest (status transitions, approval expiry, input validation)
- **Package manager:** Bun (npm works too, slower with the configured mirror)

---

## 🚀 Getting started

### Prerequisites
- Node 20+ (22 recommended), Bun 1.x

### 1. Install
```bash
cp .env.example .env
bun install
```

### 2. Database
```bash
bunx prisma migrate dev   # creates SQLite DB + client (first run)
```

### 3. Run
```bash
bun run dev
```
Open **http://localhost:3000** → Sign up → Onboarding → `/app`.

### The 5-minute tour
1. Sign up, complete onboarding (pick goals — agents activate from them).
2. Open **Study Coach**, upload a `.txt`/`.md` note file, ask a question — sources appear above the answer.
3. Create a **project**, link an agent, open the project detail for milestones.
4. Add tasks with due dates; check **Today / Week / Calendar** in the planner.
5. Open **Career**, analyze a resume file, save an application, generate a cover-letter draft.
6. Check **Usage** for activity and approvals.

---

## 📜 Scripts

| Command | What it does |
|---|---|
| `bun run dev` | Local dev server (Turbopack) |
| `bun run build` | `prisma generate && next build` — production build |
| `bun run start` | Serve production build |
| `bun run lint` | ESLint (flat config, Next rules) |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run test` | Vitest (7 tests) |
| `bun run format` | Prettier write |
| `bun run db:push` | Push schema without migration (local experiments) |
| `bunx prisma studio` | Visual DB browser |
| `bunx prisma migrate dev --name <x>` | New migration |

---

## 🗂 Project structure

```text
AgentHub/
├── design.md / planning.md / REMAINING.md   # spec, build contract, prod gaps
├── Dockerfile / docker-compose.yml          # Postgres-backed deploy
├── prisma/
│   ├── schema.prisma                        # User, Profile, Agent, Conversation,
│   │                                        # Message, Project, Task, File,
│   │                                        # Application, Approval, UsageEvent
│   └── migrations/                          # versioned history
└── src/
    ├── app/
    │   ├── page.tsx                         # landing (reference style)
    │   ├── agents|how-it-works|pricing|privacy|terms
    │   ├── login|signup|forgot-password|onboarding
    │   ├── api/                             # auth, profile, agents, conversations,
    │   │                                    # files, projects, tasks, applications,
    │   │                                    # approvals, career, usage, subscription, health
    │   └── app/                             # workspace: overview, agents/[id] chat,
    │                                        # projects, tasks, files, career,
    │                                        # usage, settings/*
    ├── components/                          # AppShell, SideNav, Topbar, ApprovalCard, states
    ├── lib/                                 # db, auth helpers, agents, ai, usage,
    │                                        # approvals, validations, rate-limit
    ├── auth.ts / proxy.ts                   # Auth.js config + route guard
    └── middleware.ts                        # (removed — migrated to proxy.ts)
```

### Key routes
- Public: `/`, `/agents`, `/how-it-works`, `/pricing`, `/login`, `/signup`, `/forgot-password`, `/privacy`, `/terms`
- Workspace: `/app` (overview), `/app/agents`, `/app/agents/[agentId]`, `/app/projects`, `/app/projects/[projectId]`, `/app/tasks`, `/app/files`, `/app/career`, `/app/usage`, `/app/settings/*`
- Health: `GET /api/health`

---

## 🔌 API overview

All `/api/*` (except signup/login/health) require a session and enforce owner scoping server-side.

- `POST /api/auth/signup` · Auth.js `[...nextauth]` · `GET/PATCH/DELETE /api/profile`
- `GET/POST /api/agents` · `POST /api/agents/ensure` (goal-based) · `GET /api/agents/[agentId]/conversations`
- `POST /api/conversations` · `GET/PATCH/DELETE /api/conversations/[id]` (SSE stream on POST)
- `GET/POST /api/files` · `GET/DELETE /api/files/[id]` · `GET /api/files/[id]/status` · `POST /api/files/[id]/study`
- `GET/POST /api/projects` · `GET/PATCH/DELETE /api/projects/[projectId]`
- `GET/POST/PATCH/DELETE /api/tasks` · `GET/POST/PATCH/DELETE /api/applications`
- `POST /api/career/analyze` · `POST /api/career/cover-letter`
- `GET/POST /api/approvals` · `POST /api/approvals/[id]/[action]`
- `GET /api/usage` · `GET /api/subscription` · `POST /api/subscription/checkout` (stub)

---

## 🔐 Environment

```bash
# .env (local defaults)
DATABASE_URL="file:./dev.db"
AUTH_SECRET="change-me-to-a-long-random-string"
NEXTAUTH_URL="http://localhost:3000"

# Production Postgres (uncomment + migrate)
# DATABASE_URL="postgresql://user:pass@host:5432/agenthub"

# Deferred (S3 storage, Redis queue, paid AI provider)
# S3_BUCKET=""  REDIS_URL=""  OPENAI_API_KEY=""
```

Never commit `.env`. Rotate `AUTH_SECRET` before any shared deploy.

---

## 🐳 Production deploy

```bash
docker compose up --build        # app + Postgres 16
# then inside app:
bunx prisma migrate deploy
```
Manual path: set Postgres `DATABASE_URL`, run `migrate deploy`, `bun run build && bun run start`. Health: `GET /api/health`. Full production checklist (Sentry, quotas, S3/Redis, analytics, OAuth, backups) lives in [REMAINING.md](./REMAINING.md).

---

## 🧪 Testing & quality

- `bun run test` — unit: task/file transitions, approval TTL, Zod validation.
- `bun run lint` / `bun run typecheck` — must be clean before PR.
- Manual QA matrix (per planning §21): 320/768/desktop widths, keyboard-only flow, slow network, failed AI, failed upload, expired session, empty vs. heavy accounts.
- Known limits: mock AI only, PDF/DOCX extraction stubbed, no e2e automation yet.

---

## 🗺 Roadmap → production

Ordered in [REMAINING.md](./REMAINING.md): fix profile hash over-select → git + CI + staging → observability → Postgres/pgvector validation → real AI provider behind quotas → S3 + queue file pipeline → analytics → auth hardening → beta.

---

## 🤝 Contributing

1. Create a branch from `main`.
2. Keep PRs small; link the planning phase/section they cover.
3. Must pass `lint`, `typecheck`, `test`, `build`.
4. Never commit secrets, `.env`, or `*.db*`.

## 📄 License

ISC — see `package.json`.
