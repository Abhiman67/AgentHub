# Backoff — Exact Next Implementation Plan

## 1. Purpose

This document tells the coding agent exactly what to implement next in Backoff.

It assumes that the first agentic architecture foundation has already been added:

- `AgentRun`, `AgentStep` and `ToolCall` database models
- Agent-run state machine
- Planner
- Context builder
- Tool registry
- Permission helpers
- Approval-aware orchestrator
- Agent-run APIs
- Run progress UI
- Job queue foundation
- Integration adapter foundation
- Observability helpers

The goal now is to make the first complete agent workflow reliable:

```text
User opens an agent
  → User enters a goal
  → Backoff creates a persistent run
  → Planner creates validated steps
  → Safe steps execute
  → Risky steps pause for approval
  → User approves or denies
  → Run resumes or cancels
  → Workspace data is updated
  → Run completes with an audit trail
```

Do not start external integrations, billing, computer control or a large UI redesign until this workflow is reliable.

## 2. Non-negotiable rules

1. Do not rewrite the application.
2. Preserve existing public pages and authenticated workspace functionality.
3. Do not add computer control or browser automation.
4. Do not enable billing work; billing remains deferred.
5. Do not add real external integrations before internal tools work reliably.
6. Every database access must enforce the current user or workspace scope.
7. Every request body must be validated server-side.
8. Every risky tool action must require a visible approval.
9. Every run, step, approval and tool call must be traceable.
10. Every failure must be recoverable or clearly terminal.
11. Do not expose passwords, secrets, provider tokens, system prompts or unrelated user data.
12. Do not claim an item is complete until its acceptance criteria and tests pass.

## 3. Current baseline audit

Before changing code, inspect and record:

```text
src/lib/agents/orchestrator.ts
src/lib/agents/planner.ts
src/lib/agents/context.ts
src/lib/agents/state-machine.ts
src/lib/tools/registry.ts
src/lib/tools/permissions.ts
src/components/RunPanel.tsx
src/components/ApprovalCard.tsx
src/app/api/agent-runs/route.ts
src/app/api/approvals/[id]/[action]/route.ts
prisma/schema.prisma
```

Run these commands before implementation:

```bash
npm run typecheck
npm run lint
npm test
npx next build --webpack
```

If a command fails before your changes, record the baseline failure separately. Do not hide or rewrite unrelated failures.

## 4. Milestone 1 — Make the internal agent workflow correct

### Objective

Make one internal workflow work end to end:

```text
Goal: Create a task to revise databases tomorrow
  → Plan is created
  → Task creation requires approval
  → Approval is shown
  → Approve action resumes run
  → Task is created once
  → Run becomes completed
```

### 4.1 Inspect the current planner

Open:

```text
src/lib/agents/planner.ts
```

Verify that the planner:

- Returns a typed plan.
- Enforces a maximum number of steps.
- Uses only known tool names.
- Marks task/project mutation steps as requiring approval.
- Does not allow the model or user to choose an unsafe risk level.
- Does not produce arbitrary executable code.
- Produces deterministic output for the local implementation.

Add or update tests for:

- Empty goals.
- Very long goals.
- Goal containing prompt-injection text.
- Goal requesting task creation.
- Goal requesting an external email.
- Unknown tool names.
- Too many steps.

### 4.2 Inspect the task tool

Open:

```text
src/lib/tools/internal/tasks.ts
```

Verify that `create_task`:

- Validates title.
- Validates optional project ID.
- Validates due date.
- Validates priority.
- Checks project ownership.
- Uses the authenticated owner from `ToolContext`, never a client-provided owner ID.
- Creates exactly one task.
- Returns a minimal safe result.
- Does not expose unrelated records.

Required successful result shape:

```json
{
  "taskId": "...",
  "title": "Revise databases",
  "status": "todo"
}
```

### 4.3 Fix approval execution semantics

When a tool requires approval:

1. Create exactly one approval for the run and step.
2. Set the step to `awaiting_approval`.
3. Set the run to `awaiting_approval`.
4. Stop execution immediately.
5. Do not create the task before approval.
6. Do not create duplicate approvals when the run is refreshed.

When approved:

1. Verify the approval belongs to the current user.
2. Verify it is still pending.
3. Verify it has not expired.
4. Mark it approved atomically.
5. Resume the associated run.
6. Execute the approved tool once.
7. Mark the step completed.
8. Continue remaining steps.
9. Mark the run completed if no steps remain.
10. Write audit events for approval and execution.

When denied:

1. Mark the approval denied.
2. Mark the associated step skipped or cancelled.
3. Mark the run cancelled or completed-with-denial according to the existing domain decision.
4. Do not execute the tool.
5. Write an audit event.

Add a database-level or transaction-level guard against double approval and duplicate execution.

### 4.4 Fix resume behavior

Open:

```text
src/lib/agents/orchestrator.ts
src/app/api/agent-runs/[runId]/resume/route.ts
```

Verify:

- Resuming a completed run is rejected or is a no-op with a clear response.
- Resuming a cancelled run is rejected.
- Resuming a failed run does not duplicate completed steps.
- Resuming an approval-waiting run requires the approval to be decided first.
- Only the owner can resume the run.
- The run status is changed transactionally.
- The current step index is preserved.

## 5. Milestone 2 — Fix the run API contract

### Objective

Make all agent-run endpoints return predictable, secure responses.

### 5.1 Standard response format

Use this error shape everywhere in the new run APIs:

```json
{
  "error": {
    "code": "RUN_NOT_FOUND",
    "message": "Agent run was not found.",
    "requestId": "request-id"
  }
}
```

Do not return raw exception messages when they reveal internal details.

### 5.2 Required endpoint behavior

#### `POST /api/agent-runs`

Input:

```json
{
  "agentId": "required",
  "goal": "required, bounded string",
  "conversationId": "optional",
  "projectId": "optional",
  "contextFileIds": ["optional file IDs"]
}
```

Behavior:

- Require authentication.
- Validate input.
- Check agent ownership.
- Check project ownership.
- Check file ownership.
- Create the run.
- Plan and execute according to the current local execution strategy.
- Return the run and steps.
- Never expose private agent prompts.

#### `GET /api/agent-runs`

Behavior:

- Return only the current user’s runs.
- Support bounded pagination.
- Order by newest update first.
- Never return another user’s run.

#### `GET /api/agent-runs/[runId]`

Behavior:

- Check ownership.
- Return run, steps, approvals and safe tool-call summaries.
- Do not return raw sensitive tool input/output.

#### `POST /api/agent-runs/[runId]/cancel`

Behavior:

- Check ownership.
- Allow only valid cancellation transitions.
- Cancel queued, planning, running, paused and approval-waiting runs where safe.
- Do not cancel completed runs.

#### `POST /api/agent-runs/[runId]/resume`

Behavior:

- Check ownership.
- Reject pending approvals.
- Resume paused or failed runs according to transition rules.
- Do not duplicate completed steps.

#### `GET /api/agent-runs/[runId]/events`

Behavior:

- Return only events for the current user’s run.
- Support bounded polling or SSE.
- Do not keep connections open forever.
- Close cleanly when the run reaches a terminal state.

## 6. Milestone 3 — Improve the RunPanel UI

Open:

```text
src/components/RunPanel.tsx
```

Implement the following UI states:

```text
No run
Starting
Planning
Running
Waiting for approval
Paused
Completed
Failed
Cancelled
```

### Required behavior

- Disable Start while a request is active.
- Clear the input only after successful creation.
- Show the goal and current status.
- Show each step’s title and status.
- Highlight the current step.
- Show a clear approval-required message.
- Show Retry only for failed runs.
- Show Resume only for paused or approval-completed runs.
- Show Cancel only for cancellable states.
- Show Refresh for active runs.
- Stop polling for terminal states.
- Handle expired sessions by linking to login.
- Show a retryable error if polling fails.
- Announce status updates via `aria-live`.
- Provide keyboard-accessible controls.

### Approval UI

The approval card must show:

- Action title.
- What data will be changed.
- Tool name or human-readable action.
- Risk level.
- Expiration.
- Approve button.
- Deny button.
- Disabled state during submission.
- Success or failure message.

Do not show raw JSON to normal users. Provide an optional details disclosure if debugging data is useful.

## 7. Milestone 4 — Add complete automated coverage

### 7.1 Unit tests

Add tests for:

- Planner output.
- State transitions.
- Permission decisions.
- Approval expiration.
- Tool validation.
- Context size limits.
- Idempotency keys.
- Retry/backoff behavior.

### 7.2 Integration tests

Add tests for:

1. Create run.
2. Create plan.
3. Execute safe step.
4. Pause at approval step.
5. Approve request.
6. Execute task tool.
7. Verify task exists.
8. Verify run completes.
9. Verify audit event exists.
10. Deny an approval and verify no task exists.
11. Retry a failed run.
12. Cancel a run.
13. Reject cross-user access.
14. Reject expired approvals.
15. Reject repeated approval requests.

### 7.3 End-to-end test

Create a test for:

```text
Signup
→ Onboarding
→ Agent workspace
→ Start goal
→ Approval appears
→ Approve
→ Task appears in planner
→ Run completes
→ Audit activity visible
```

If a real browser test framework is not yet configured, create a documented manual QA script and add API-level integration tests first.

## 8. Milestone 5 — Make the job queue real

The current queue foundation can execute inline locally. Next, introduce a real Redis-backed execution mode.

### 8.1 Queue requirements

Use Redis and a supported queue library such as BullMQ, unless the project has a stronger existing choice.

Required properties:

- Job ID.
- Idempotency key.
- Retry count.
- Exponential backoff.
- Maximum attempts.
- Timeout.
- Dead-letter state.
- Cancellation flag.
- Structured logging.

### 8.2 First jobs

Implement in this order:

```text
file.extract
file.chunk
file.embed
agent.run
agent.resume
agent.retry
```

### 8.3 Local development behavior

Support two modes:

```text
JOB_EXECUTION_MODE=inline
JOB_EXECUTION_MODE=redis
```

Inline mode is for tests and simple local development. Redis mode is for staging and production.

Do not silently claim a job is completed when it was only queued.

## 9. Milestone 6 — PostgreSQL migration

### 9.1 Goal

Validate the architecture against PostgreSQL before real users or production data.

### 9.2 Required work

1. Start PostgreSQL using Docker Compose.
2. Start Redis using Docker Compose.
3. Create a PostgreSQL environment file with safe local values.
4. Run Prisma migrations against PostgreSQL.
5. Generate Prisma client.
6. Seed standard agents.
7. Run API tests against PostgreSQL.
8. Verify foreign keys and cascade behavior.
9. Verify indexes.
10. Verify concurrent approval behavior.
11. Verify duplicate job handling.
12. Document reset and migration commands.

### 9.3 Schema review

Review all string-encoded JSON fields:

```text
Profile.goals
Profile.subjects
Profile.skills
Profile.interests
Project.linkedAgentIds
Project.members
```

Convert to Prisma `Json` fields when compatible with existing data. Write a migration that preserves current records.

## 10. Milestone 7 — Complete file processing

### Required pipeline

```text
Upload request
  → Validate size, MIME and signature
  → Store file metadata
  → Store original in object storage
  → Enqueue extraction job
  → Extract text
  → Chunk text
  → Create embeddings
  → Store chunks and vectors
  → Mark ready
  → Retrieve relevant chunks for agents
```

### Required file statuses

```text
uploaded
processing
ready
failed
deleted
```

### Required safety behavior

- Enforce maximum file size.
- Validate file signature, not only extension.
- Reject unsupported MIME types.
- Add an antivirus scanning hook.
- Do not pass raw untrusted file instructions into the system prompt.
- Include file IDs and page/chunk references in citations.
- Clean up object-storage files on deletion.
- Do not expose another user’s file content.

## 11. Milestone 8 — Add one real integration

Start with Google Drive because it supports the student file/context use case without requiring external writes.

### Scope

Initial version must be read-only:

- Connect Google account.
- Request minimum Drive read scope.
- List selected files.
- Import selected file metadata.
- Retrieve content where permitted.
- Disconnect account.
- Revoke stored credentials.

### Security

- Encrypt tokens at rest.
- Never log tokens.
- Check owner on every account lookup.
- Check token expiry.
- Request minimum scopes.
- Store provider and user IDs.
- Make disconnect idempotent.
- Add mock provider for tests.

Do not add Gmail sending, calendar writes or GitHub mutations in this milestone.

## 12. Milestone 9 — Observability and production readiness

Add structured logs for:

- Request ID.
- User ID.
- Run ID.
- Step ID.
- Tool-call ID.
- Job ID.
- Provider.
- Duration.
- Status.
- Error code.

Add metrics for:

- Run completion rate.
- Run failure rate.
- Average run duration.
- Approval wait duration.
- Tool failure rate.
- File processing failure rate.
- Queue backlog.
- AI provider latency.
- AI provider errors.
- Token/cost usage.

Never log:

- Passwords.
- API keys.
- OAuth tokens.
- Full private files.
- Full private messages.

## 13. Milestone 10 — Staging validation

Create a staging environment with:

```text
Next.js application
PostgreSQL
Redis
Object storage
AI provider
Sentry or equivalent
```

Run this validation script:

```text
1. Create a new user.
2. Complete onboarding.
3. Open Study Coach.
4. Start a goal.
5. Confirm a run is created.
6. Confirm steps are visible.
7. Confirm approval appears for task creation.
8. Approve the task.
9. Confirm exactly one task is created.
10. Confirm the run completes.
11. Upload a PDF.
12. Confirm processing state.
13. Confirm file becomes ready.
14. Ask a question grounded in the file.
15. Confirm citation appears.
16. Open usage page.
17. Open audit page.
18. Cancel a second run.
19. Retry a failed run.
20. Confirm unauthorized access is rejected.
```

Record the result, environment, commit identifier and any failures.

## 14. Product decisions that must not be guessed

If implementation reaches one of these decisions, stop and record the decision rather than inventing behavior:

- Whether denied approvals mark a run `cancelled` or `completed_with_denial`.
- Whether workspace members can run agents on shared projects.
- Which user roles can approve external actions.
- Which file types are allowed in production.
- Which OAuth scopes the product legally needs.
- Whether a user’s memories are automatically retained or require opt-in.
- Whether a run may continue after a user logs out.
- How long run history is retained.

Use the safest behavior by default: deny, pause, minimize data and require explicit approval.

## 15. Definition of done

This plan is complete only when:

- The internal task-creation workflow works end to end.
- Runs are persistent and resumable.
- Approval is atomic and cannot be replayed.
- No duplicate task is created on retry.
- Cross-user access is rejected.
- Run progress is visible and accessible.
- Failed and cancelled states are clear.
- Unit and integration tests pass.
- PostgreSQL has been validated.
- Redis job mode has been validated.
- File processing is asynchronous and citation-aware.
- At least one read-only external integration is validated or explicitly deferred.
- Observability is active in staging.
- The full staging validation script passes.
- Billing remains intentionally deferred.
- Computer control is absent.

## 16. Required completion report

When each milestone is finished, the coding agent must report:

```text
Milestone:
Status:
Files changed:
Database migrations:
APIs added/changed:
UI changes:
Tests added:
Commands run:
Results:
Known limitations:
Next milestone:
```

Do not report “production ready” if the work has only passed local SQLite tests.

