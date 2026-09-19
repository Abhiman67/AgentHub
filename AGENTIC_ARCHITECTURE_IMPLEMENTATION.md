# AgentHub Agentic Architecture — Detailed Implementation Specification

## 0. Purpose

This document is the implementation contract for evolving AgentHub from its current MVP into a reliable, permission-aware, multi-agent student SaaS platform.

The coding agent must use this document as the source of truth for the architecture work. The existing application must be evolved incrementally. Do not rewrite the product from scratch and do not remove working MVP functionality.

The final system should support this workflow:

```text
User goal
  → Agent understands the goal
  → Planner creates structured steps
  → Context layer retrieves relevant information
  → Agent executes safe internal steps
  → Sensitive steps pause for approval
  → Background jobs resume long-running work
  → User sees progress, evidence and final results
```

## 1. Current project baseline

The current project is a Next.js monolith containing:

- Next.js App Router
- React and TypeScript
- Auth.js credentials authentication
- Prisma ORM
- SQLite database
- Public marketing pages
- Authenticated student workspace
- Specialized agents
- Streaming chat UI
- Projects, tasks, files and career pages
- Usage tracking
- Approval cards
- Audit events
- Password reset flow
- Workspace membership and invitations
- OpenAI/Gemini integration points
- Mock AI fallback for local development
- Docker and CI configuration

Important current locations:

```text
src/app/                 Pages and API route handlers
src/components/          Shared UI components
src/lib/                 Database, AI, validation and domain logic
src/auth.ts              Auth.js configuration
src/proxy.ts             Route protection
prisma/schema.prisma     Database schema
src/app/globals.css      Existing design system
```

Preserve the existing warm editorial visual language, responsive layout and student-focused positioning.

## 2. Explicit scope decisions

### Build now

- Agent orchestration
- Persistent agent runs
- Agent plans and steps
- Context assembly
- Typed internal tools
- Permission and approval enforcement
- Tool-call auditability
- Background job foundation
- PostgreSQL migration path
- File chunking and retrieval foundation
- Reliable retries and cancellation
- Agent progress UI
- Testing and observability foundations

### Do not build now

- Billing implementation or payment activation
- Computer control
- Browser automation
- Desktop automation
- Unrestricted shell execution
- Automatic email sending
- Automatic job applications
- Autonomous destructive actions
- Real-time multiplayer editing
- University administration features

Billing routes may remain in the repository, but no new billing work should be included in this architecture migration. Computer-control workers must not be added.

## 3. Target architecture

```text
                        ┌──────────────────────┐
                        │     Next.js UI       │
                        │ Marketing + Workspace│
                        └──────────┬───────────┘
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │     API Gateway      │
                        │ Auth / Validation    │
                        │ Rate limits / SSE    │
                        └──────────┬───────────┘
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │  Agent Orchestrator  │
                        │ Runs / Plans / Steps │
                        │ Retry / Cancel       │
                        └──────┬──────┬────────┘
                               │      │
                 ┌─────────────┘      └─────────────┐
                 ▼                                  ▼
        ┌──────────────────┐              ┌──────────────────┐
        │ Planner          │              │ Context & Memory │
        │ Goal breakdown   │              │ Profile          │
        │ Structured steps │              │ Conversations    │
        │ Re-planning      │              │ Projects         │
        └────────┬─────────┘              │ Files            │
                 │                        │ Tasks            │
                 ▼                        │ Citations        │
        ┌──────────────────┐              │ Semantic memory  │
        │ LLM Gateway      │◄─────────────┘
        │ OpenAI           │
        │ Gemini           │
        │ Future providers │
        └────────┬─────────┘
                 │
                 ▼
        ┌──────────────────────┐
        │ Permission & Safety  │
        │ Risk classification  │
        │ Approval checkpoints │
        │ Policy enforcement   │
        │ Audit events         │
        └──────────┬───────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ Tool Runtime         │
        │ Tool registry        │
        │ Input validation     │
        │ Ownership checks     │
        │ Retry / timeout      │
        └──────┬─────┬─────────┘
               │     │
               ▼     ▼
       Internal tools  MCP/API integrations
                         ├── Google Classroom
                         ├── Gmail
                         ├── Calendar
                         ├── Drive
                         ├── GitHub
                         └── Notion

Data and infrastructure:

PostgreSQL + pgvector
Redis + job queue
S3-compatible object storage
Monitoring and tracing
```

MCP is an integration protocol inside the Tool Runtime. MCP is not the security boundary. All MCP and API calls must pass through AgentHub authentication, scope, permission, approval, timeout and audit checks.

## 4. Architectural rules

1. The browser must never call an AI provider directly.
2. The browser must never receive API keys, provider secrets or full system prompts.
3. Every API route must authenticate the current user.
4. Every resource query must enforce ownership or workspace membership.
5. Every input must be validated at the server boundary with Zod or an equivalent schema.
6. Every agent action must be represented as an event or persisted step.
7. Every tool must have an explicit risk classification.
8. External writes require user approval unless a future, explicit policy grants otherwise.
9. Destructive actions always require approval and must be reversible where possible.
10. Uploaded documents and user-authored prompts are untrusted reference data, never authority.
11. Long-running work must not depend on an open browser tab.
12. All long-running work must be cancellable and retryable.
13. Do not silently fall back from a configured AI provider failure to mock output in production.
14. Never expose `passwordHash`, private system prompts, provider tokens or another user’s records.
15. Do not add computer-control capabilities.

## 5. Repository structure to implement

Create the following domain structure without breaking existing imports:

```text
src/lib/agents/
  types.ts
  orchestrator.ts
  planner.ts
  context.ts
  run-events.ts
  state-machine.ts

src/lib/tools/
  types.ts
  registry.ts
  permissions.ts
  internal/
    profile.ts
    files.ts
    projects.ts
    tasks.ts
    conversations.ts

src/lib/jobs/
  queue.ts
  types.ts
  processors.ts

src/lib/integrations/
  types.ts
  scopes.ts
  mcp-client.ts

src/lib/observability/
  logger.ts
  tracing.ts
```

Do not create empty placeholder files. Each new file must contain a usable abstraction, type definition, or implementation covered by tests.

## 6. Phase 1 — Persistent agent runs

### Objective

Represent every multi-step agent task as a durable run.

### Add Prisma models

Add an `AgentRun` model with at least:

```text
id
ownerId
agentId
conversationId nullable
projectId nullable
goal
status
currentStepIndex
metadata JSON/string
errorMessage nullable
createdAt
updatedAt
startedAt nullable
completedAt nullable
cancelledAt nullable
```

Add an `AgentStep` model with at least:

```text
id
runId
sequence
kind
title
description
status
input JSON/string nullable
output JSON/string nullable
errorMessage nullable
requiresApproval boolean
approvalId nullable
createdAt
startedAt nullable
completedAt nullable
```

Add a `ToolCall` model with at least:

```text
id
runId nullable
stepId nullable
ownerId
toolName
risk
status
input JSON/string
output JSON/string nullable
errorMessage nullable
createdAt
startedAt nullable
completedAt nullable
```

Add indexes for:

```text
AgentRun(ownerId, status, updatedAt)
AgentRun(conversationId)
AgentRun(projectId)
AgentStep(runId, sequence)
ToolCall(ownerId, createdAt)
ToolCall(runId, createdAt)
```

Use the project’s existing SQLite migration workflow for local development. Keep the schema portable to PostgreSQL.

### Run status enum

Use a centralized TypeScript constant or enum:

```text
queued
planning
awaiting_approval
running
paused
completed
failed
cancelled
```

Do not scatter status strings throughout page components and route handlers.

### Transition rules

Allowed transitions:

```text
queued → planning
planning → running
planning → awaiting_approval
planning → failed
running → awaiting_approval
running → paused
running → completed
running → failed
running → cancelled
awaiting_approval → running
awaiting_approval → cancelled
paused → running
paused → cancelled
```

Reject invalid transitions with a typed domain error. Write a test for every valid and invalid transition.

## 7. Phase 2 — Agent types and orchestrator

### Core types

Create types similar to:

```ts
type AgentRunStatus =
  | "queued"
  | "planning"
  | "awaiting_approval"
  | "running"
  | "paused"
  | "completed"
  | "failed"
  | "cancelled";

type AgentRunRequest = {
  agentId: string;
  goal: string;
  conversationId?: string;
  projectId?: string;
  contextFileIds?: string[];
};

type AgentEvent =
  | { type: "run_created"; runId: string }
  | { type: "plan_created"; runId: string; stepCount: number }
  | { type: "step_started"; runId: string; stepId: string; title: string }
  | { type: "step_completed"; runId: string; stepId: string }
  | { type: "tool_started"; runId: string; toolCallId: string; toolName: string }
  | { type: "tool_completed"; runId: string; toolCallId: string; toolName: string }
  | { type: "approval_required"; runId: string; approvalId: string }
  | { type: "message_delta"; runId: string; text: string }
  | { type: "run_completed"; runId: string }
  | { type: "run_failed"; runId: string; message: string };
```

### Orchestrator responsibilities

The orchestrator must:

1. Verify the authenticated owner.
2. Verify that the agent belongs to the user.
3. Verify project and file ownership when supplied.
4. Create an `AgentRun` in `queued` state.
5. Build a bounded context object.
6. Ask the planner for structured steps.
7. Persist every step before executing it.
8. Execute only registered tools.
9. Route risky tools through the permission layer.
10. Pause when approval is required.
11. Persist tool input and output safely.
12. Emit progress events for the UI.
13. Handle timeout, cancellation and provider failures.
14. Mark the final state transactionally.

The API route must not contain the entire orchestration algorithm.

## 8. Phase 3 — Planner

The planner converts a user goal into a structured, bounded plan.

Planner output must be schema-validated. Do not accept arbitrary model JSON.

Example:

```ts
type PlanStep = {
  title: string;
  description: string;
  kind: "reasoning" | "retrieval" | "tool" | "draft" | "approval";
  toolName?: string;
  requiresApproval: boolean;
  input?: Record<string, unknown>;
};
```

Planner rules:

- Limit maximum steps per run.
- Limit maximum tool calls per step.
- Reject unknown tool names.
- Reject missing required fields.
- Never allow the planner to invent permissions.
- Never allow the planner to bypass approval.
- Do not expose raw chain-of-thought to the user.
- Show concise step descriptions and outcomes instead.

For local development, the planner may use deterministic templates. Provider-backed planning can be added behind the same interface.

## 9. Phase 4 — Context and memory

### Context builder

Create a context builder that accepts:

```text
userId
agentId
conversationId
projectId
fileIds
currentGoal
```

It should return a bounded context containing:

- User profile fields required for the task
- Agent role and safe instructions
- Recent conversation messages
- Relevant project details
- Relevant tasks
- Relevant file metadata
- Retrieved file chunks
- Source identifiers and citations

Never include:

- Password hashes
- Authentication tokens
- Unrelated users’ data
- Internal provider keys
- Hidden platform secrets
- Unbounded full database dumps

### Storage plan

Initial production target:

```text
PostgreSQL       relational application data
pgvector         file and memory embeddings
Object storage   original uploaded files
Redis            queue, locks and rate limits
```

Do not create a separate vector database unless measured scale requires it.

### File retrieval

Implement:

1. Upload original file to object storage.
2. Create file metadata row.
3. Queue extraction job.
4. Extract text in a worker.
5. Split text into bounded chunks.
6. Create embeddings.
7. Store chunks and embeddings.
8. Mark file `ready`.
9. On failure, mark file `failed` with a safe reason code.
10. Retrieve top relevant chunks for a run.
11. Include citations in the agent response.

The current synchronous SQLite path may remain temporarily for local development, but the interfaces must allow replacement by the queued pipeline.

## 10. Phase 5 — Tool registry

Create a central registry. Tools must not be selected through arbitrary string dispatch scattered across the codebase.

Required tool shape:

```ts
type ToolRisk =
  | "read_only"
  | "draft_only"
  | "workspace_write"
  | "external_write"
  | "destructive";

type AgentTool<Input = unknown, Output = unknown> = {
  name: string;
  description: string;
  risk: ToolRisk;
  inputSchema: ZodSchema<Input>;
  execute: (input: Input, context: ToolContext) => Promise<Output>;
};
```

### Initial internal tools

Implement and test:

```text
get_profile
search_files
get_file_metadata
get_project
get_project_tasks
create_task
update_task
create_project
update_project
attach_file_to_project
create_draft
create_approval
```

Every tool must:

- Validate input.
- Check ownership.
- Enforce the user/workspace scope.
- Enforce its risk policy.
- Have a timeout.
- Return a typed result.
- Write a `ToolCall` record.
- Avoid leaking secrets in output.

## 11. Phase 6 — Permission and approval layer

Centralize permissions in one module.

```text
read_only
  → may execute immediately

draft_only
  → may create a draft, never send or publish

workspace_write
  → requires approval unless explicitly permitted by product policy

external_write
  → always requires explicit approval

destructive
  → always requires approval and confirmation details
```

Approval records must include:

- Owner
- Agent
- Run
- Tool call
- Human-readable title
- Description
- Payload summary
- Risk level
- Expiration timestamp
- Status
- Decision timestamp
- Decision actor

Approvals must be single-use. Reject expired, already-decided or cross-user approval requests.

The UI must display:

- What will happen
- Which tool will run
- Which data will be used
- Whether the action is external
- Approve button
- Deny button
- Expiration state

## 12. Phase 7 — API surface

Add the following API routes or equivalent route handlers:

```text
POST   /api/agent-runs
GET    /api/agent-runs
GET    /api/agent-runs/[runId]
POST   /api/agent-runs/[runId]/cancel
POST   /api/agent-runs/[runId]/resume
GET    /api/agent-runs/[runId]/events

GET    /api/tools
GET    /api/approvals
POST   /api/approvals/[id]/approve
POST   /api/approvals/[id]/deny
```

Every route must:

- Authenticate.
- Validate route parameters.
- Validate request body.
- Enforce ownership.
- Return consistent JSON errors.
- Avoid returning internal system prompts.
- Set appropriate no-store headers for private data.

Suggested error format:

```json
{
  "error": {
    "code": "RUN_NOT_FOUND",
    "message": "Agent run was not found.",
    "requestId": "..."
  }
}
```

Do not expose stack traces in production responses.

## 13. Phase 8 — Background jobs

Add a queue abstraction before choosing a production provider.

Required job types:

```text
file.extract
file.chunk
file.embed
agent.run
agent.resume
agent.retry
usage.aggregate
```

Each job must support:

- Stable job ID
- Idempotency key
- Retry count
- Exponential backoff
- Maximum execution time
- Dead-letter/failure status
- Structured logs
- Cancellation where practical

Do not duplicate tasks when a network request is retried.

## 14. Phase 9 — External API integrations

Do not implement all integrations at once. Build an adapter interface:

```ts
type IntegrationAdapter = {
  provider: string;
  listCapabilities(): Promise<Capability[]>;
  execute(input: IntegrationRequest): Promise<IntegrationResult>;
};
```

### Integration order

1. Google Drive — read selected files.
2. Google Classroom — read courses and assignments.
3. Calendar — read availability and draft events.
4. GitHub — read repositories and draft issues.
5. Notion — read selected pages and create drafts.
6. Gmail — draft emails only.

For every provider:

- Store OAuth tokens encrypted.
- Request minimum scopes.
- Provide disconnect/revoke UI.
- Never log access tokens.
- Enforce per-user provider ownership.
- Add timeout and retry policy.
- Require approval for external writes.
- Add mock adapters for tests.

Computer control is not an integration option.

## 15. Phase 10 — Frontend experience

Add an agent-run experience inside the current chat/workspace UI.

### Required UI states

```text
Starting
Planning
Plan ready
Running step
Waiting for approval
Paused
Completed
Failed with retry
Cancelled
```

### Run panel

Display:

- Goal
- Current status
- Plan steps
- Completed steps
- Current step
- Tool calls
- Approval requests
- Citations
- Retry action
- Cancel action
- Created/updated timestamps

### Accessibility requirements

- Use semantic buttons and headings.
- Provide `aria-live` for progress updates.
- Do not rely on color alone for status.
- Ensure keyboard access to approval controls.
- Provide visible focus styles.
- Preserve readable error text.
- Disable duplicate submissions while requests are active.

### Error behavior

Every client fetch must handle:

- Network failure
- Unauthorized response
- Validation error
- Server error
- Timeout
- Aborted request

Show a recoverable message and a retry action. Do not leave the UI permanently loading.

## 16. Phase 11 — Database migration

Migrate local development from SQLite toward PostgreSQL without breaking the product.

Steps:

1. Audit SQLite-specific schema choices.
2. Replace string-encoded JSON fields with Prisma `Json` fields where safe.
3. Add PostgreSQL datasource configuration.
4. Add development PostgreSQL Compose service.
5. Run migrations against PostgreSQL.
6. Add pgvector migration/extension plan.
7. Add connection-pool configuration.
8. Seed standard agents.
9. Verify cascade and ownership behavior.
10. Add PostgreSQL integration tests.

Keep SQLite available only as a lightweight local option if it does not diverge from production behavior.

## 17. Phase 12 — Observability

Add structured logging with:

- Request ID
- User ID hash or internal ID where safe
- Run ID
- Step ID
- Tool call ID
- Provider name
- Duration
- Status
- Error code

Never log:

- Passwords
- API keys
- OAuth tokens
- Full private file contents
- Full user message content in production logs

Add monitoring for:

- API errors
- AI provider errors
- Run failures
- Tool failures
- Queue backlog
- File processing failures
- Token/cost usage
- Database latency
- Approval wait time

The health endpoint must verify the database and required dependencies rather than returning a static success response.

## 18. Testing requirements

### Unit tests

Cover:

- Run state transitions
- Planner schema validation
- Tool input validation
- Permission decisions
- Approval expiry
- Ownership checks
- Context size limits
- Retry behavior
- Idempotency behavior

### Integration tests

Cover:

- Create run
- Persist plan
- Execute safe tool
- Pause for approval
- Approve and resume
- Deny and cancel
- Retry a failed step
- Cross-user access rejection
- File retrieval with citations

### End-to-end journey

Automate:

```text
Sign up
→ Onboarding
→ Open agent
→ Start goal
→ Review plan
→ Approve task creation
→ Verify task
→ Upload file
→ Retrieve file context
→ Complete run
→ View usage and audit event
```

### Security tests

Test:

- IDOR on every user-owned resource
- Unauthorized API access
- Expired approval reuse
- Prompt injection in uploaded files
- Tool name injection
- Oversized input
- Replayed requests
- Duplicate job submission
- Sensitive response-field leakage

## 19. Definition of done for the first architecture milestone

The first milestone is complete only when:

- `AgentRun`, `AgentStep` and `ToolCall` exist.
- Run state transitions are centralized and tested.
- A user can start a run from the workspace.
- The planner creates a validated plan.
- The plan is visible in the UI.
- `create_task` works as an internal tool.
- Task creation is approval-gated.
- Approval can be approved or denied.
- The run resumes after approval.
- The task appears in the task planner.
- All steps and tool calls are auditable.
- Failed runs show retry UI.
- Runs can be cancelled.
- Cross-user ownership tests pass.
- Existing chat, files, projects and settings continue working.
- Typecheck, lint, tests and production build pass.

## 20. Recommended implementation order

Implement in this exact order:

1. Audit current chat and approval flows.
2. Add agent-run database models and migration.
3. Add centralized run status machine.
4. Add domain types.
5. Add orchestrator service.
6. Add planner with deterministic local implementation.
7. Add context builder.
8. Add internal tool registry.
9. Add permission service.
10. Connect `create_task` to approval flow.
11. Add agent-run API routes.
12. Add progress UI to the workspace.
13. Add retry and cancellation.
14. Add unit and integration tests.
15. Add background job abstraction.
16. Move file extraction into jobs.
17. Add PostgreSQL and pgvector path.
18. Add object storage.
19. Add observability.
20. Add external API adapters one at a time.

Do not jump to external integrations before the internal tool and approval loop is reliable.

## 21. Completion reporting

At the end of every implementation phase, report:

- Files changed
- Database migrations added
- APIs added or changed
- UI behavior added
- Tests added
- Commands executed
- Known limitations
- Any migration or deployment action still required

Do not claim production readiness until the staging environment, PostgreSQL path, background jobs, observability and end-to-end journey have been verified.

