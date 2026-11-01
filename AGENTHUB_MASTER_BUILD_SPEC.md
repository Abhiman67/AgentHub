# Backoff — Master 0–100 Product & Engineering Build Specification

**Document status:** Implementation contract for a coding agent  
**Product:** Backoff  
**Category:** AI operating system for student progress  
**Primary audience:** Ambitious university students, especially technical and engineering students  
**Target quality:** Production SaaS MVP, designed for safe expansion  
**Billing:** Explicitly deferred  
**Computer control:** Explicitly excluded

This document is the source of truth for turning Backoff into a coherent, production-quality product. Execute it phase by phase. Do not attempt a destructive rewrite or invent behavior that is not specified here. Preserve working functionality while replacing placeholders with complete flows.

Related documents:

- `AGENTIC_ARCHITECTURE_IMPLEMENTATION.md` — existing architecture foundation
- `NEXT_IMPLEMENTATION_PLAN.md` — near-term implementation plan
- `REMAINING.md` — historical production-readiness audit
- `student-workspace-prototype.html` — visual direction prototype

## 1. Product definition

### 1.1 Product promise

Backoff turns student overwhelm into a clear, guided path forward. It combines a personal workspace, structured learning/project/career planning, and a team of specialized AI agents that keep work moving safely in the background.

### 1.2 Core loop

```text
Capture → Understand → Organize → Plan → Execute → Reflect → Improve
```

Every major feature must strengthen this loop. Avoid isolated AI chat features that do not produce useful artifacts, decisions, plans, progress, or next actions.

### 1.3 Positioning

Backoff is not a generic chatbot, a task list, or an automation bot. It is a student progress system with:

- persistent context across courses, projects, files, goals, and career work;
- specialized agents with clearly bounded responsibilities;
- proactive recommendations and scheduled checks;
- human approval before consequential external actions;
- evidence-based progress rather than vague productivity scores;
- a calm, readable workspace that makes the next action obvious.

### 1.4 Product principles

1. **Clarity before cleverness.** Every page must answer “what matters now?”
2. **Evidence before confidence.** Agents cite source items and label assumptions.
3. **Assist, do not impersonate.** External actions are drafts or approval-gated.
4. **One source of truth.** User data belongs in typed domain records, not only chat history.
5. **Persistent but controllable.** Background responsibilities can be paused, inspected, edited, and deleted.
6. **Progress over busyness.** Measure completed learning outcomes and meaningful milestones.
7. **Privacy by default.** Least privilege, clear scopes, revocation, auditability.
8. **Accessible and calm.** Keyboard support, readable density, clear status, no anxiety-inducing noise.

## 2. Scope

### 2.1 In scope

- Public marketing site with clear conversion paths.
- Authenticated student workspace.
- Today dashboard and unified activity feed.
- Courses/subjects, study plans, revision sessions, and learning progress.
- Projects with milestones, tasks, deliverables, risks, and project agent support.
- Career goals, applications, preparation plans, and career agent support.
- Files, notes, links, source extraction, and searchable knowledge.
- Specialized AI agents and persistent responsibilities.
- Planner, context/memory, tool runtime, approvals, notifications, and audit logs.
- Safe integrations through API/MCP adapters.
- Background workers and resumable agent runs.
- Observability, error states, security controls, tests, staging, and production deployment.

### 2.2 Explicitly out of scope for this release

- Billing, subscriptions, invoices, payment providers, and plan enforcement.
- Computer control, browser automation, desktop control, unrestricted shell access, or simulated user input.
- Autonomous sending of email, publishing content, deleting external data, or changing external records without approval.
- A public agent marketplace.
- Multi-tenant enterprise administration beyond the minimum workspace boundary.
- Training or fine-tuning a foundation model.

If a task conflicts with these exclusions, stop and report it instead of silently expanding scope.

## 3. Information architecture

### 3.1 Public routes

- `/` — landing page and primary value proposition.
- `/how-it-works` — product loop, agents, safety, and examples.
- `/pricing` — placeholder only; explain that billing is coming later without fake checkout.
- `/agents` — agent team overview and responsibilities.
- `/login`, `/signup`, `/forgot-password` — authentication.
- `/privacy`, `/terms`, `/security` — trust and legal content.

Public navigation must never show “Dashboard” as if it were available without authentication. Use “Sign in” and “Get started” CTAs. Authenticated navigation may show “Today” or “Workspace”.

### 3.2 Authenticated routes

- `/app` and `/app/today` — Today dashboard.
- `/app/learning` — courses, subjects, revision, and learning progress.
- `/app/learning/[subjectId]` — subject workspace.
- `/app/projects` — projects overview.
- `/app/projects/[projectId]` — project workspace.
- `/app/career` — career overview.
- `/app/career/[goalId]` — career goal/application workspace.
- `/app/progress` — evidence-based progress and review.
- `/app/agents` — agent team, responsibilities, and run history.
- `/app/agents/[agentId]` — agent detail and configuration.
- `/app/knowledge` — files, notes, links, and search.
- `/app/tasks` — unified tasks and planner.
- `/app/notifications` — alerts, approvals, and activity.
- `/app/settings` — profile, workspace, integrations, privacy, notifications, and data controls.
- `/app/settings/integrations` — API connections and scopes.
- `/app/settings/data` — export, deletion request, retention, and consent.

Every authenticated page needs loading, empty, error, permission-denied, and retry states. No page may render a blank screen when a query fails.

## 4. Landing page requirements

The landing page must feel like a credible SaaS product, not a navigation demo.

### 4.1 Required sections

1. Header: logo, product links, sign in, primary CTA.
2. Hero: specific student outcome, short explanation, primary and secondary CTA.
3. Product visual: Today workspace with plan, agent recommendations, progress, and source context.
4. Problem section: fragmented notes, missed deadlines, scattered career work, generic AI answers.
5. Workflow section: capture → organize → plan → execute → reflect.
6. Agent team section: Study Coach, Project Guide, Career Scout, Writing Buddy, Code Mentor, Interview Coach.
7. Use-case panels: semester planning, project execution, exam revision, internship preparation.
8. Trust/safety section: user control, approvals, source citations, privacy, no hidden actions.
9. Social-proof placeholder section that does not fabricate logos or testimonials.
10. FAQ covering data, integrations, background work, safety, and pricing status.
11. Final CTA.
12. Footer with product, resources, legal, support, status, and social placeholders.

### 4.2 Content rules

- Do not claim guaranteed grades, jobs, or autonomous outcomes.
- Do not use fake customer logos, fabricated metrics, or fake testimonials.
- Explain background work as “checks and suggestions” unless an actual responsibility is configured.
- Keep “AI” subordinate to the student outcome; the page sells progress, not model access.
- All links must resolve to an intentional route or a clearly labeled placeholder.

## 5. Core user experience

### 5.1 Onboarding

Collect only what is needed to produce a useful first day:

1. Name and timezone.
2. Degree/program and current term.
3. Subjects or courses.
4. Current projects.
5. One near-term academic goal and one career goal.
6. Optional source import.
7. Notification preferences.
8. Consent for background recommendations and explicit integration scopes.

At completion, create a starter Today view, not a blank dashboard. Seed one optional study responsibility and one optional weekly review suggestion, both editable.

### 5.2 Today page

The Today page is the product’s home. It must contain:

- greeting and current date/timezone;
- top three recommended priorities with reason and source;
- due soon and overdue items;
- active projects and their next milestones;
- study plan progress;
- career actions;
- agent recommendations separated from user-created tasks;
- pending approvals;
- recent activity and run status;
- quick capture for note, task, file, link, or goal.

Every recommendation must support: accept, edit, dismiss, snooze, explain, and report incorrect.

### 5.3 Learning

Learning supports subjects, outcomes, resources, revision sessions, questions, and evidence. A subject page must show:

- course metadata and exam/assessment dates;
- syllabus or learning outcomes;
- mastery state per topic: unknown, learning, practiced, confident, needs review;
- source materials;
- generated revision plan;
- upcoming sessions;
- unresolved questions;
- agent suggestions with evidence.

Do not represent an LLM confidence score as academic mastery. Mastery changes only from explicit user actions or recorded evidence.

### 5.4 Projects

Projects support objective, scope, milestones, tasks, deliverables, dependencies, risks, notes, files, collaborators, and review cadence. The project agent may identify risks and propose next actions, but may not silently alter deadlines or publish work.

### 5.5 Career

Career supports goals, target roles, skills, applications, deadlines, resume versions, portfolio evidence, interview preparation, and follow-ups. Email actions are draft-only by default. Never fabricate experience, achievements, or application status.

## 6. Agent team

### 6.1 Agent responsibilities

| Agent | Owns | Can propose | Must not do |
|---|---|---|---|
| Study Coach | subjects, revision, questions | sessions, explanations, review reminders | claim mastery or guarantee results |
| Project Guide | project plans, milestones, risks | task breakdowns, risk alerts, status summaries | change scope/deadlines silently |
| Career Scout | career goals, roles, applications | research, skill gaps, preparation plans | apply or send messages automatically |
| Writing Buddy | drafts, structure, clarity | outlines, edits, feedback | impersonate the user or hide generated content |
| Code Mentor | code learning, debugging context | explanations, tests, refactors | run arbitrary machine control or deploy code |
| Interview Coach | interview goals and practice | questions, rubrics, feedback | present invented feedback as objective truth |

### 6.2 Agent response contract

Every agent response must include, where applicable:

- concise answer or recommendation;
- source references;
- assumptions;
- confidence/uncertainty label;
- suggested next action;
- required approval, if any;
- structured artifact when the response creates a plan, task, note, or draft.

### 6.3 Agent run state machine

```text
queued → planning → awaiting_approval → executing → completed
                         │                 │
                         └→ rejected       ├→ paused
                                           ├→ failed
                                           └→ cancelled
```

Persist every transition with timestamp, actor, reason, and correlation ID. Runs must be resumable and idempotent.

## 7. Persistent responsibilities and background work

A responsibility is a user-approved recurring or event-triggered instruction owned by an agent.

### 7.1 Responsibility fields

```ts
type AgentResponsibility = {
  id: string;
  workspaceId: string;
  agentId: string;
  title: string;
  instruction: string;
  trigger: { type: 'schedule' | 'event' | 'threshold'; value: string };
  scope: { entityIds?: string[]; sourceIds?: string[] };
  actionPolicy: 'suggest_only' | 'draft_only' | 'approval_required';
  status: 'active' | 'paused' | 'archived';
  lastRunAt?: string;
  nextRunAt?: string;
  createdAt: string;
  updatedAt: string;
};
```

### 7.2 Rules

- Default to `suggest_only`.
- A responsibility cannot send, publish, delete, or modify external records.
- Each run has a maximum step count, token budget, wall-clock timeout, and retry policy.
- Duplicate triggers must be deduplicated with an idempotency key.
- Users can pause all responsibilities from settings.
- Notifications must be rate limited and grouped.
- Failed runs must explain the failure and offer retry or disable.

## 8. Target architecture

```text
Next.js App Router
        │
        ▼
API Gateway / Route Handlers
auth · validation · rate limits · SSE · request IDs
        │
        ├──────────────► PostgreSQL + pgvector
        ├──────────────► Object Storage
        └──────────────► Redis / Queue
                              │
                              ▼
                    Background Worker Runtime
                              │
                              ▼
                    Agent Orchestrator
       runs · plans · steps · retries · resume · cancel
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
       Planner     Context/Memory   LLM Gateway
          │              │              │
          └──────────────┼──────────────┘
                         ▼
                 Permission & Safety
                         │
                         ▼
                   Tool Runtime
              internal tools + MCP/API adapters
```

### 8.1 Architectural boundaries

- UI never calls an LLM provider directly.
- API routes never contain long-running agent loops.
- Orchestrator never bypasses permission checks.
- Tool adapters never receive broader credentials than their declared scope.
- Memory retrieval never silently exposes another workspace’s data.
- Background jobs must use the same domain services as foreground requests.

### 8.2 Execution modes

Support:

- `JOB_EXECUTION_MODE=inline` for local development and deterministic tests.
- `JOB_EXECUTION_MODE=redis` for staging/production.

The domain contract must remain identical in both modes. A job may be enqueued once and safely retried.

## 9. Domain model

Implement typed schemas, migrations, repositories, and service-layer validation for:

- `User`, `Profile`, `Workspace`, `WorkspaceMember`;
- `Subject`, `Topic`, `LearningOutcome`, `RevisionSession`, `MasteryEvidence`;
- `Project`, `Milestone`, `Task`, `Deliverable`, `ProjectRisk`;
- `CareerGoal`, `TargetRole`, `Application`, `Skill`, `CareerArtifact`;
- `KnowledgeItem`, `Note`, `File`, `FileChunk`, `SourceReference`;
- `Agent`, `Conversation`, `Message`, `AgentResponsibility`;
- `AgentRun`, `AgentStep`, `ToolCall`, `Approval`;
- `Notification`, `AuditEvent`, `IntegrationConnection`, `IntegrationScope`.

All records need IDs, workspace ownership, created/updated timestamps, and soft-delete or archival behavior where appropriate. Use foreign keys and indexes. Never rely on client-provided workspace IDs without authorization checks.

### 9.1 Data invariants

- A user may access only workspaces where they are a member.
- A child record cannot belong to a different workspace than its parent.
- Archived records are excluded from default queries.
- External IDs are unique per integration connection, not globally.
- Run and approval records are append-audited.
- Source references preserve the source item, location, and extraction timestamp.

## 10. Context and memory

Use three layers:

1. **Working context:** current conversation, selected page, active task, recent events.
2. **Structured memory:** profile, preferences, goals, subjects, projects, agent settings.
3. **Retrieval memory:** chunked source content with embeddings, metadata, and access filters.

Memory controls required:

- view why an item was remembered;
- edit or delete memory;
- exclude a source from retrieval;
- clear conversation context;
- export user data;
- workspace-wide retention policy;
- retrieval citations in agent responses.

Never store secrets, raw access tokens, or unnecessary sensitive data in prompts or vector content.

## 11. Tool runtime and permissions

### 11.1 Tool manifest

Every tool declares:

```ts
type ToolManifest = {
  name: string;
  version: string;
  description: string;
  inputSchema: unknown;
  outputSchema: unknown;
  risk: 'read' | 'draft' | 'write' | 'destructive';
  requiredScopes: string[];
  supportsDryRun: boolean;
  timeoutMs: number;
};
```

### 11.2 Approval policy

- Read-only internal tools: may run automatically.
- External reads: require connected integration and declared scope.
- Draft creation: may run automatically when user enabled it.
- External writes, sends, publishes, deletes: always require explicit approval.
- Destructive actions: require confirmation with a plain-language impact summary.

No computer-control tool is permitted. No unrestricted shell tool is permitted.

### 11.3 Initial integration order

1. Google Drive — read-only import.
2. Google Classroom — read-only course/deadline import.
3. Calendar — read plus draft event creation.
4. GitHub — read plus draft issue/PR summaries.
5. Notion — read plus draft-only writing.
6. Gmail — read metadata where necessary and draft-only replies; no automatic sending.

Each integration requires OAuth state validation, encrypted token storage, scope display, disconnect, refresh handling, error recovery, and audit events.

## 12. API contract

Use consistent JSON envelopes, validation errors, request IDs, and authenticated workspace scoping.

### 12.1 Core endpoints

```text
GET    /api/me
GET    /api/today
GET    /api/notifications
PATCH  /api/notifications/:id

GET    /api/subjects
POST   /api/subjects
GET    /api/subjects/:id
PATCH  /api/subjects/:id
GET    /api/subjects/:id/progress
POST   /api/subjects/:id/revision-plan

GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PATCH  /api/projects/:id
GET    /api/projects/:id/risks

GET    /api/career/goals
POST   /api/career/goals
GET    /api/career/goals/:id
PATCH  /api/career/goals/:id

GET    /api/knowledge
POST   /api/knowledge
POST   /api/files/presign
POST   /api/files/:id/process
GET    /api/search?q=...

GET    /api/agents
GET    /api/agents/:id
GET    /api/agents/:id/runs
POST   /api/agents/:id/chat

GET    /api/responsibilities
POST   /api/responsibilities
PATCH  /api/responsibilities/:id
POST   /api/responsibilities/:id/pause
POST   /api/responsibilities/:id/resume
DELETE /api/responsibilities/:id

GET    /api/agent-runs
GET    /api/agent-runs/:id
POST   /api/agent-runs
POST   /api/agent-runs/:id/cancel
POST   /api/agent-runs/:id/resume
GET    /api/agent-runs/:id/events

GET    /api/approvals
POST   /api/approvals/:id/approve
POST   /api/approvals/:id/reject

GET    /api/integrations
POST   /api/integrations/:provider/connect
POST   /api/integrations/:provider/callback
POST   /api/integrations/:provider/disconnect
```

Preserve existing working endpoints and add compatibility adapters when renaming. Update frontend consumers together with API changes.

### 12.2 Error contract

```json
{
  "error": {
    "code": "WORKSPACE_LOAD_FAILED",
    "message": "We could not load this workspace.",
    "details": {},
    "requestId": "req_123",
    "retryable": true
  }
}
```

Never expose provider stack traces, secrets, SQL, or internal file paths to users.

## 13. File and knowledge pipeline

1. Create upload intent with size/type validation.
2. Upload to object storage using a short-lived signed URL.
3. Record file metadata and checksum.
4. Virus/malware scan.
5. Extract text using type-specific parser.
6. Normalize and chunk with source locations.
7. Generate embeddings through the LLM gateway.
8. Store vectors with workspace/source ACL metadata.
9. Mark processing status: pending, processing, ready, failed.
10. Surface retry and delete controls.

Support plain text, Markdown, PDF, common office files, and links according to available dependencies. Do not claim a file is searchable until indexing succeeds.

## 14. UI quality standard

- Use a consistent design token system for color, spacing, type, radius, shadows, and motion.
- Support light/dark themes only if both are complete.
- Use semantic HTML and keyboard navigation.
- Every interactive control has an accessible name and visible focus state.
- Dialogs trap focus and close safely.
- Tables and cards have mobile layouts.
- Async actions show pending, success, and failure states.
- Optimistic updates must have rollback behavior.
- Empty states explain the value and provide one primary action.
- Destructive actions are visually and semantically distinct.
- Avoid dense dashboards with unprioritized cards.

Required reusable components: `AppShell`, `PageHeader`, `StatusBadge`, `MetricCard`, `Timeline`, `ActivityItem`, `AgentCard`, `RecommendationCard`, `ApprovalCard`, `SourceCitation`, `EmptyState`, `ErrorState`, `Skeleton`, `CommandMenu`, `ConfirmDialog`, `Toast`, `DataTable`, `MobileNav`.

## 15. Security and privacy

- Validate authentication on every server-side mutation.
- Enforce workspace authorization in service code, not only UI.
- Use CSRF protection where cookie auth requires it.
- Hash passwords with a modern password hash if password auth exists.
- Encrypt integration tokens at rest and never log them.
- Redact secrets and personal content from logs.
- Apply rate limits to auth, chat, uploads, integrations, and run creation.
- Validate file type, size, content, and extraction limits.
- Protect against prompt injection from imported documents: treat source text as untrusted data.
- Treat tool outputs as untrusted; validate against schemas before use.
- Add audit events for sign-in, integration changes, approvals, exports, deletion, and external actions.
- Provide account deletion and data export workflows.
- Add security headers and safe content policy appropriate to the app.
- Document retention and subprocessors before launch.

## 16. Observability and analytics

### 16.1 Operational telemetry

Track request ID, route, latency, status, workspace-safe actor ID, job ID, run ID, provider latency, token usage, and error category. Never log raw prompts, source documents, access tokens, or message bodies by default.

Required dashboards/alerts:

- API error rate and p95 latency;
- job failure, retry, and queue age;
- LLM timeout and provider error rate;
- integration refresh failures;
- file-processing failure rate;
- approval backlog;
- database and storage health.

### 16.2 Product events

Use stable event names:

`signup_completed`, `onboarding_completed`, `quick_capture_created`, `subject_created`, `revision_plan_generated`, `project_created`, `career_goal_created`, `agent_chat_started`, `recommendation_accepted`, `recommendation_dismissed`, `responsibility_created`, `responsibility_paused`, `agent_run_completed`, `agent_run_failed`, `approval_requested`, `approval_approved`, `approval_rejected`, `integration_connected`, `file_indexed`, `weekly_review_completed`.

Do not use analytics to store the full contents of user work.

## 17. Testing strategy

### 17.1 Unit tests

Test validation schemas, authorization policies, planners, state transitions, retry/backoff, deduplication, recommendation ranking, mastery calculations, and redaction.

### 17.2 Integration tests

Test database repositories, API contracts, file processing, queue adapters, LLM gateway mocks, OAuth callback validation, token refresh, and tool permission enforcement.

### 17.3 End-to-end tests

Cover:

1. signup → onboarding → Today;
2. create subject → add source → generate revision plan;
3. create project → milestone → agent recommendation → accept;
4. create career goal → draft application action → approval;
5. create responsibility → scheduled run → notification → pause;
6. failed workspace load → user-visible retry;
7. unauthorized workspace access blocked;
8. integration disconnect revokes access;
9. file upload failure and retry;
10. mobile navigation and keyboard-only flow.

### 17.4 Quality gates

Before merging a phase:

- typecheck passes;
- lint passes;
- unit/integration tests pass;
- production build passes;
- migrations apply on a clean database;
- no broken internal links;
- no console errors on critical routes;
- accessibility checks pass for changed UI;
- error states are manually verified;
- documentation and environment variables are updated.

## 18. Broken-link and logic audit

Create a route inventory from the filesystem and navigation components. For every link:

1. Resolve internal hrefs against actual routes.
2. Verify auth boundaries.
3. Verify dynamic parameters and not-found behavior.
4. Check redirects for loops.
5. Check CTA behavior in logged-out and logged-in states.
6. Check API calls behind each page.
7. Check loading/error/empty states.
8. Check stale placeholder routes and dead buttons.

Add an automated route/link smoke test. Maintain `docs/route-inventory.md` with route, owner, auth requirement, API dependencies, status, and last verification date. Any broken link or dead action is a release blocker for that route.

## 19. Delivery phases

### Phase 0 — Baseline and safety

Inventory routes, components, APIs, environment variables, migrations, tests, and current failures. Start the app, run build/typecheck/lint/tests, capture baseline. Do not modify behavior until baseline is recorded.

### Phase 1 — Foundation hardening

Normalize auth, workspace scoping, API error envelopes, environment validation, database migrations, logging, design tokens, and shared UI states.

### Phase 2 — SaaS shell and public site

Complete landing page, public routes, legal/trust content, authenticated app shell, responsive navigation, and route guards. Remove misleading logged-out dashboard links.

### Phase 3 — Today and capture

Implement Today dashboard, quick capture, unified tasks, activity, recommendations, approvals, and robust loading/error/empty states.

### Phase 4 — Learning workspace

Implement subjects, topics, outcomes, files, revision sessions, evidence-based progress, and Study Coach flows.

### Phase 5 — Projects and career

Implement projects, milestones, risks, deliverables, career goals, applications, skills, and specialist agent flows.

### Phase 6 — Agent runtime

Implement planner, context assembly, LLM gateway, structured outputs, run state machine, retries, cancellation, resumability, citations, and tool permission enforcement.

### Phase 7 — Responsibilities and workers

Implement persistent responsibilities, schedules/events, Redis worker mode, idempotency, notification grouping, run history, pause/resume, and failure recovery.

### Phase 8 — Integrations and knowledge

Implement object storage pipeline, search, vectors, then integrations in the defined order. Test scope boundaries and approval flows.

### Phase 9 — Production readiness

Complete security review, accessibility, performance, observability, rate limits, backups, recovery procedures, privacy documentation, route smoke tests, and staging deployment.

### Phase 10 — Launch and iteration

Launch a closed beta, monitor activation and failure metrics, collect feedback, fix critical issues, and only then expand availability. Billing remains deferred.

## 20. Definition of done

The product is ready for MVP release only when:

- a new student can sign up and reach a useful Today page;
- the student can create subjects, projects, and career goals;
- files and notes can become searchable context with citations;
- agents produce bounded, useful recommendations and artifacts;
- responsibilities run in background worker mode and can be paused;
- no external write happens without approval;
- all critical routes have complete loading, empty, error, and retry behavior;
- workspace isolation is tested;
- critical internal links are verified automatically;
- production build, migrations, tests, and deployment checks pass;
- privacy, security, data export, and deletion behavior are documented;
- monitoring can detect failed jobs, broken integrations, and API regressions;
- the landing page accurately describes what exists today;
- no billing or computer-control claims appear in the product.

## 21. Coding-agent operating instructions

Execute this document in phases, not as one speculative rewrite.

For each phase:

1. Inspect the current implementation and related docs.
2. State the exact files and behavior in scope.
3. Preserve unrelated user changes.
4. Implement the smallest coherent slice.
5. Add or update tests before declaring completion.
6. Run the quality gates.
7. Perform a manual route and error-state check.
8. Update documentation and route inventory.
9. Report changed files, commands run, results, known limitations, and next phase.

Do not:

- invent APIs or environment variables without documenting them;
- hide errors with empty arrays or fake success responses;
- add billing;
- add computer control or unrestricted shell execution;
- silently change authentication or data semantics;
- claim an integration works without an end-to-end test or an explicit mocked limitation;
- replace real data with hard-coded demo content in production routes;
- mark a phase complete when tests or critical routes are failing.

## 22. Final product definition

When complete, Backoff should feel like a focused student operating system: a calm place where a student can see what matters, understand why it matters, ask a specialized agent for help, turn that help into structured work, and trust that background assistance is visible, bounded, reversible, and grounded in their own information.

The competitive advantage is not “more AI.” It is persistent student context plus specialized responsibilities plus safe execution plus a coherent progress workspace.

