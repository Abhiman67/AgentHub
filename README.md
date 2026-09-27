# AgentHub — Your AI Student Team

> **Your goals in. Momentum out.**

AgentHub gives every student a personal team of specialized AI agents — **Study Coach, Project Guide, Career Scout, Writing Buddy, Code Mentor, and Interview Coach** — orchestrated inside a unified workspace for coursework, software projects, career growth, and daily execution.

Built on an autonomous **Agentic Architecture** with a deterministic state machine, permission-controlled tool registry, external integrations (including MCP support), asynchronous job processing, and human-in-the-loop safety approvals.

---

## 🌟 Core Pillars

- 🧠 **Autonomous Agentic Engine:** Step-by-step planning and orchestration with streaming run events (SSE), pause/resume, and real-time execution tracking.
- 🛡️ **Human-in-the-Loop Safety:** Sensitive and destructive actions (e.g. external API calls, deletions, application submissions) are gated by an explicit approval queue with a 7-day TTL.
- 📚 **Study & Research RAG:** Note parsing and sliding-window chunking (PDF, DOCX, TXT, Markdown) with source citations, flashcard generation, and quiz synthesis.
- 🛠️ **Extensible Tool Registry:** Permission-scoped internal tools allowing agents to interact with tasks, projects, files, conversations, and user profile data.
- 🔌 **Integrations & MCP:** Encrypted credential vault (AES-256-GCM) supporting GitHub, Notion, Google Drive, and Model Context Protocol (MCP) servers.
- ⚡ **Background Job Processing:** Robust async queue with exponential backoff, worker retry policies, and automated cleanup.
- 📊 **Full Observability:** Structured JSON logging, distributed trace context, Sentry error monitoring, and runtime platform metrics.

---

## 🤖 The Agent Team

| Agent | Focus Area | Key Capabilities |
|---|---|---|
| **Study Coach** | Academic mastery & exam prep | Note analysis, syllabus breakdown, revision schedules, citation-backed Q&A |
| **Project Guide** | Milestone scoping & architecture | Project breakdown, deliverable tracking, milestone planning, code architecture |
| **Career Scout** | Professional placement & growth | Resume keyword gap analysis, application tracking pipeline, DRAFT cover letters |
| **Writing Buddy** | Composition & proofreading | Thesis structuring, tone adjustments, essay feedback, argument outlining |
| **Code Mentor** | Software engineering & debugging | Code explanations, algorithm walkthroughs, error diagnosis, test case design |
| **Interview Coach** | Behavioral & technical prep | Mock interviews, STAR method coaching, instant constructive feedback |
| **Custom Agents** | User-defined specialist workflows | Configurable system instructions protected by global safety constraints |

---

## 🏗️ System Architecture

```text
                                 ┌─────────────────────────┐
                                 │   Next.js 16 Web App    │
                                 │ (React 19 + Tailwind 4) │
                                 └───────────┬─────────────┘
                                             │ HTTP / SSE
                                             ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 AgentHub Platform Core                                 │
│                                                                                        │
│  ┌───────────────────────┐   ┌───────────────────────────┐   ┌───────────────────────┐ │
│  │   Agent Orchestrator  │──▶│    AgentRun State Machine │──▶│   Event Stream (SSE)  │ │
│  │ (Planner + Step Exec) │   │ (QUEUED ➔ EXEC ➔ FINISHED)│   │  /agent-runs/[id]/... │ │
│  └──────────┬────────────┘   └───────────────────────────┘   └───────────────────────┘ │
│             │                                                                          │
│             ├──────────────────────────┬──────────────────────────┐                    │
│             ▼                          ▼                          ▼                    │
│  ┌───────────────────────┐   ┌───────────────────┐   ┌───────────────────────────────┐ │
│  │   Tool Runtime Engine │   │   Approval Gate   │   │     External Integrations     │ │
│  │ Tasks, Projects, Files│   │ Sensitive Actions │   │ GitHub, Notion, Drive, MCP    │ │
│  │ Scoped Permissions    │   │ 7-day Expiry TTL  │   │ AES-256-GCM Encrypted Vault   │ │
│  └───────────────────────┘   └───────────────────┘   └───────────────────────────────┘ │
│             │                          │                          │                    │
│             ▼                          ▼                          ▼                    │
│  ┌───────────────────────────────────────────────────────────────────────────────────┐ │
│  │                       Data & Background Storage Subsystem                         │ │
│  │  Prisma 6 ORM  │  PostgreSQL / SQLite  │  RAG Chunking  │  Async Background Jobs  │ │
│  └───────────────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### AgentRun State Machine

Agent executions follow a strict, deterministic state machine:
```text
  [QUEUED] ──▶ [PLANNING] ──▶ [EXECUTING] ──▶ [COMPLETED]
                   │               │
                   ▼               ▼
          [AWAITING_APPROVAL]  [FAILED]
                   │
         (Approved / Denied)
                   │
                   ▼
         [RESUMED / CANCELLED]
```

---

## 🧱 Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript strict mode, Tailwind CSS v4, Lucide Icons.
- **Authentication:** Auth.js v5 (NextAuth) with bcrypt-12 credentials hashing, JWT sessions, and route guard proxy.
- **Database & ORM:** Prisma 6 with SQLite for local development (`prisma/dev.db`) and PostgreSQL + `pgvector` for production deployments.
- **Validation:** Zod schemas on all mutating API routes and tool parameters.
- **Background Jobs:** Lightweight DB/Redis-backed polling queue with exponential backoff, worker retry limits, and dead-letter handling.
- **Security & Encryption:** AES-256-GCM token encryption for third-party OAuth and integration credentials.
- **Observability:** Structured JSON logger, distributed tracing (`x-trace-id`), Sentry error hooks, and real-time `/api/metrics`.
- **Testing:** Vitest test runner (41 unit and integration tests passing).

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `20.x` or higher (`22.x` recommended)
- **Package Manager**: [Bun](https://bun.sh) (recommended) or `npm`
- **Docker** (optional, for Postgres + Redis local testing)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Abhiman67/AgentHub.git
cd AgentHub
cp .env.example .env
bun install
```
*(If using npm: `npm install`)*

### 2. Initialize Database & Seed
```bash
bunx prisma migrate dev
bun run db:seed
```
This generates your Prisma Client, applies the schema migrations, and seeds standard agent templates and demo data.

### 3. Start Development Server
```bash
bun run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🧭 Walkthrough: The 5-Minute Tour

1. **Sign Up & Onboarding:** Navigate to `/signup`, register an account, and complete the 4-step onboarding (Education, Goals, Context, Agents). Your selected goals automatically provision active agents.
2. **Autonomous Agent Run:** Go to `/app/agents/[agentId]`, send a complex goal like `"Break down my machine learning project and create a weekly task plan"`. The Run Panel will display the planner decomposing your goal, generating steps, and streaming real-time status.
3. **Safety Approval:** When an agent proposes a destructive action or external sync, inspect the pending approval card at `/app/approvals`. Review the payload diff and approve or deny.
4. **Study & File RAG:** Upload `.pdf`, `.md`, or `.txt` notes in `/app/files`. Inspect document chunks and run study synthesis (flashcards and quizzes).
5. **Project & Task Integration:** Check `/app/projects` and `/app/tasks`. Notice tasks created and linked by agents are scheduled with due dates and priority filters.
6. **Integrations Vault:** Visit `/app/settings/integrations` to connect GitHub, Notion, Google Drive, or custom MCP servers with AES-256 encrypted credentials.

---

## 📜 Available Scripts

| Script | Command | Purpose |
|---|---|---|
| **Dev** | `bun run dev` | Starts local Next.js dev server with hot reload |
| **Build** | `bun run build` | Generates Prisma client and compiles production Next.js bundle |
| **Start** | `bun run start` | Runs the compiled production build |
| **Test** | `bun run test` | Runs the complete Vitest test suite (41 tests) |
| **Typecheck** | `bun run typecheck` | Validates TypeScript types across the entire project (`tsc --noEmit`) |
| **Lint** | `bun run lint` | Runs ESLint 9 with Next.js rules |
| **Format** | `bun run format` | Formats all code with Prettier |
| **Seed DB** | `bun run db:seed` | Populates database with default agents and fixtures |
| **Prisma Studio** | `bun run db:studio` | Opens visual database browser GUI |
| **Docker Postgres**| `bun run db:postgres` | Spins up PostgreSQL & Redis via Docker and applies migrations |

---

## 🗂️ Project Directory Structure

```text
AgentHub/
├── prisma/
│   ├── schema.prisma                        # Unified database models
│   ├── seed.ts                              # Initial fixture seeder
│   ├── pgvector.sql                         # PostgreSQL vector extension setup
│   └── migrations/                          # Versioned migration history
├── src/
│   ├── app/
│   │   ├── (public)/                        # Landing, pricing, how-it-works, auth pages
│   │   ├── app/                             # Authenticated workspace:
│   │   │   ├── page.tsx                     # Workspace overview & quick stats
│   │   │   ├── agents/                      # Agent directory & multi-turn chat
│   │   │   ├── projects/                    # Project scoping, milestones & activity
│   │   │   ├── tasks/                       # Kanban / list task planner
│   │   │   ├── files/                       # File manager & study RAG
│   │   │   ├── career/                      # Resume analysis & application tracker
│   │   │   ├── approvals/                   # Human-in-the-loop review queue
│   │   │   └── settings/                    # Profile, memory, integrations vault
│   │   └── api/                             # REST API endpoints:
│   │       ├── agent-runs/                  # Run lifecycle, step control, SSE events
│   │       ├── tools/                       # Tool discovery & execution registry
│   │       ├── integrations/                # Connected accounts & MCP proxy
│   │       ├── files/                       # Uploads, chunking, and study generation
│   │       ├── approvals/                   # Approval decision actions
│   │       ├── metrics/                     # System health & performance metrics
│   │       └── ...                          # Auth, projects, tasks, profile
│   ├── components/                          # UI components (RunPanel, IntegrationsPanel, SideNav, Topbar)
│   ├── lib/
│   │   ├── agents/                          # Planner, orchestrator, state machine, SSE events
│   │   ├── tools/                           # Tool registry, permissions, internal handlers
│   │   ├── integrations/                    # MCP client, OAuth accounts, crypto vault
│   │   ├── jobs/                            # Async queue, workers, processor handlers
│   │   ├── storage/                         # Local & S3 storage abstraction
│   │   ├── observability/                   # Structured logger, distributed tracer, Sentry
│   │   ├── chunking.ts                      # Sliding-window document chunking
│   │   └── db.ts                            # Prisma database client singleton
│   ├── auth.ts                              # Auth.js configuration
│   └── proxy.ts                             # Edge-compatible security route guard
├── docker-compose.yml                       # Production Postgres 16 & Redis stack
├── vitest.config.ts                         # Vitest configuration
└── package.json                             # Dependencies & scripts
```

---

## 🔌 API Summary

| Endpoint | Method | Description |
|---|---|---|
| `/api/agent-runs` | `GET`, `POST` | List agent runs or initiate a new autonomous run |
| `/api/agent-runs/[id]` | `GET` | Retrieve detailed status, steps, and output of a run |
| `/api/agent-runs/[id]/events` | `GET` | Real-time Server-Sent Events (SSE) stream for run progression |
| `/api/agent-runs/[id]/cancel` | `POST` | Abort a running or pending agent run |
| `/api/agent-runs/[id]/resume` | `POST` | Resume an agent run paused on approval |
| `/api/tools` | `GET` | List all registered tools and required permissions |
| `/api/integrations` | `GET`, `POST` | Manage connected third-party integrations & MCP servers |
| `/api/integrations/[provider]/execute` | `POST` | Execute a scoped remote integration action |
| `/api/approvals` | `GET` | List pending human-in-the-loop approvals |
| `/api/approvals/[id]/[action]` | `POST` | Approve or deny a gated action (`approve` / `deny`) |
| `/api/files` | `GET`, `POST` | Upload files and trigger automatic chunking |
| `/api/files/[id]/study` | `POST` | Generate study flashcards and revision quizzes |
| `/api/metrics` | `GET` | System health, active run counts, and performance metrics |

---

## 🔐 Security & Governance

- **Credential Encryption:** All OAuth access tokens, refresh tokens, and integration API keys are encrypted at rest using **AES-256-GCM** with unique initialization vectors (`src/lib/integrations/crypto.ts`).
- **Human-in-the-Loop Guardrails:** Every external write, deletion, or third-party dispatch requires approval. Pending approvals automatically expire after **7 days**.
- **Role & Scope Authorization:** All API routes strictly verify ownership against the authenticated JWT session.
- **Audit Logging:** Security-critical operations log immutable audit events for traceability.

---

## 🧪 Testing & Validation

Run the automated test suite:
```bash
bun run test
```

The test suite validates:
- **Agent Run State Machine:** Transition integrity (`QUEUED ➔ PLANNING ➔ EXECUTING ➔ COMPLETED`), invalid transition rejection, and step updates.
- **Approval Lifecycle:** 7-day expiration checks, approval/denial resolution, and execution unblocking.
- **Job Processing Engine:** Enqueueing, exponential backoff retries, and error handling.
- **Data Validation & Safety:** Zod schema constraints, sanitization, and quota enforcement.

To verify TypeScript typing without compiling:
```bash
bun run typecheck
```

---

## 🐳 Production Deployment

### Docker Compose (Full Stack)
Run AgentHub alongside PostgreSQL 16 and Redis:
```bash
docker compose up -d --build
bunx prisma migrate deploy
```

### Environment Configuration
Ensure production environment variables are set in `.env`:
```bash
DATABASE_URL="postgresql://agenthub:agenthub@db:5432/agenthub?schema=public"
AUTH_SECRET="use-a-strong-32-byte-hex-or-base64-secret"
NEXTAUTH_URL="https://your-domain.com"
ENCRYPTION_SECRET="32-byte-hex-key-for-integrations-aes-256-gcm"
REDIS_URL="redis://redis:6379"
```

---

## 📄 License

ISC License — see `package.json` for details.
