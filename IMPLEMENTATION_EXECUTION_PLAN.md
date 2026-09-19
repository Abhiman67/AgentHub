# AgentHub — Complete Implementation Execution Plan

## Instructions for the coding agent

You are working inside the AgentHub repository. Read this document, `README.md`, `design.md`, `planning.md`, and `REMAINING.md` before modifying code.

The goal is to evolve AgentHub from a functional Next.js student-productivity MVP into a safe, local-first multi-agent platform comparable in architecture to modern agent workspaces.

Do not claim that a feature is complete if it is only mocked, visually represented or partially wired. Every completed feature must work through the UI, API/runtime, persistence layer and tests.

---

## 1. Current codebase

AgentHub currently contains:

- Next.js App Router application
- React 19 and TypeScript
- Auth.js credentials authentication
- Prisma with SQLite
- Student onboarding
- Six agent templates
- Conversation UI with SSE streaming protocol
- Mock AI provider
- Optional OpenAI and Gemini HTTP calls
- Projects, tasks, files, career and approval pages
- Basic ownership checks and validation
- Unit tests

Important files:

```text
src/auth.ts                         Auth.js configuration
src/proxy.ts                        Protected route guard
src/lib/db.ts                       Prisma singleton
src/lib/ai.ts                       Current mock/OpenAI/Gemini streaming
src/lib/agents.ts                   Built-in agent templates
src/lib/approvals.ts                Approval expiry helper
src/lib/parser.ts                   File extraction
src/lib/usage.ts                    Usage tracking
src/lib/validations.ts              Zod schemas
src/lib/local-drivers.ts            Initial local CLI driver boundary
src/components/                     Shared UI components
src/app/app/                        Authenticated workspace
src/app/api/                        API routes
prisma/schema.prisma                Current data model
```

The existing app must continue to work during migration. Implement changes in small phases and run checks after each phase.

---

## 2. Target product

AgentHub is a local-first AI team for students.

Students should be able to:

- Create specialized agents
- Select a model or local CLI engine per agent
- Chat with agents using streaming responses
- Give agents access to approved files and project folders
- See agent activity and tool calls
- Approve or deny sensitive actions
- Create tasks and projects through agents
- Use multiple agents on one objective
- Review persistent memories
- Run routines manually or on a schedule
- Keep private files and conversations local by default

The product is not a generic chatbot. Each agent must have a role, context, permissions and tools.

---

## 3. Target architecture

```text
Electron desktop shell
        ↓
React + TypeScript renderer
        ↓ HTTP commands + SSE event stream
Local AgentHub harness on 127.0.0.1
        ↓
Agent runtime and orchestrator
        ↓
Provider drivers
├── Gemini CLI
├── Claude Code
├── Codex CLI
├── Ollama
└── Mock driver for tests
        ↓
Controlled tools
├── File tools
├── Project/Git tools
├── Study tools
├── Task tools
├── Career tools
└── Optional browser tools
```

The renderer must never directly execute a CLI, shell command or filesystem operation. All of those must go through the harness and permission system.

The application may continue to run as a web development app during development. Electron packaging can be added after the harness works reliably.

---

## 4. Non-negotiable safety rules

1. Never use `shell: true` with user-generated input.
2. Use `spawn(command, args, options)` with an argument array.
3. Bind the local harness to `127.0.0.1` only.
4. Require a per-session random authentication token between renderer and harness.
5. Never expose provider secrets to the browser.
6. Validate every input with Zod or an equivalent schema.
7. Verify ownership of every user, project, agent, file, conversation and task ID.
8. Restrict local tools to explicitly approved workspace paths.
9. Resolve paths and reject traversal, symlink escapes and paths outside the workspace.
10. Require approval before writing, deleting, sending, submitting or running risky commands.
11. Allow the user to interrupt one run and stop all active runs.
12. Treat uploaded documents, websites and source code as untrusted data.
13. Never allow retrieved content to override system instructions or safety rules.
14. Do not silently replace a failed real provider with a fake answer.
15. Never commit `.env`, API keys, cookies, private resumes, databases or user files.

---

## 5. Phase 0 — Baseline and repository hygiene

### Tasks

1. Confirm the app starts with the documented command.
2. Confirm database migrations work.
3. Run:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

4. Fix all existing errors before adding features.
5. Add or verify `.env.example`.
6. Add a `README` section describing local provider setup.
7. Initialize Git if the repository has no Git history.
8. Add a CI workflow running install, Prisma generation, lint, typecheck, tests and build.

### Acceptance criteria

- A clean checkout can install and run.
- CI passes on a clean environment.
- Build failures are reproducible and documented.
- No secrets are tracked.

---

## 6. Phase 1 — Runtime contracts

Create shared contracts in `src/lib` initially, or in a shared package if the repository becomes a monorepo.

### Provider types

```ts
type ProviderId =
  | "mock"
  | "gemini-cli"
  | "claude-code"
  | "codex-cli"
  | "ollama";
```

### Normalized events

```ts
type AgentEvent =
  | { type: "turn_started"; turnId: string }
  | { type: "text_delta"; turnId: string; text: string }
  | { type: "thinking"; turnId: string; label: string }
  | { type: "tool_started"; turnId: string; tool: ToolCall }
  | { type: "tool_finished"; turnId: string; toolCallId: string; result: unknown }
  | { type: "approval_required"; turnId: string; approval: ApprovalRequest }
  | { type: "file_changed"; turnId: string; path: string; diff?: string }
  | { type: "warning"; turnId: string; message: string }
  | { type: "turn_completed"; turnId: string; messageId: string }
  | { type: "turn_failed"; turnId: string; message: string };
```

### Driver interface

```ts
interface AgentDriver {
  providerId: ProviderId;
  detect(): Promise<ProviderStatus>;
  listModels(): Promise<ModelInfo[]>;
  startTurn(input: StartTurnInput): Promise<DriverTurn>;
  interrupt(turnId: string): Promise<void>;
}
```

Implement the mock driver against this interface first. Then make all real providers conform to exactly the same contract.

### Acceptance criteria

- UI and runtime depend only on normalized events.
- Provider-specific parsing is isolated inside drivers.
- Mock driver passes the same tests required of real drivers.

---

## 7. Phase 2 — Local harness

Create a server module, preferably under `src/harness` or `server`.

### Responsibilities

- Start on a loopback port
- Authenticate renderer requests
- Register providers and tools
- Start and track agent turns
- Publish SSE events
- Interrupt active turns
- Persist conversations and events
- Handle shutdown cleanup

### Required endpoints

```text
GET  /api/v1/health
GET  /api/v1/providers
POST /api/v1/providers/:id/check
GET  /api/v1/providers/:id/models
GET  /api/v1/agents
POST /api/v1/agents/:id/turns
GET  /api/v1/turns/:id/events
POST /api/v1/turns/:id/interrupt
GET  /api/v1/approvals
POST /api/v1/approvals/:id/approve
POST /api/v1/approvals/:id/deny
```

### Process handling

- Use `spawn` with arrays.
- Track every child process by `turnId`.
- Capture stdout as provider data.
- Keep stderr out of user responses and redact it from logs.
- Add timeout and maximum output limits.
- Kill the process and descendants on interrupt.
- Clean all active processes during shutdown.

### Acceptance criteria

- Harness health endpoint works.
- Mock provider can run through the harness.
- Renderer receives SSE events.
- Interrupt stops the process and marks the turn interrupted.
- No child process remains after completion or failure.

---

## 8. Phase 3 — Provider drivers

Implement drivers in this order:

1. Mock driver
2. Ollama
3. Gemini CLI
4. Claude Code
5. Codex CLI

### Driver behavior

Each driver must:

- Detect executable or service availability.
- Report a helpful unavailable reason.
- Report models where possible.
- Start a turn with system instructions, history and context.
- Convert provider output into normalized events.
- Handle malformed output.
- Handle non-zero exit codes.
- Support interruption.
- Never expose credentials.

Do not guess undocumented CLI flags. Read the installed provider documentation or expose configurable command arguments in settings.

### Provider status UI

Display:

```text
Ollama       Available · 3 models
Gemini CLI   Available · Authenticated
Claude Code  Not found · Setup guide
Codex CLI    Not found · Setup guide
```

### Acceptance criteria

- At least one real local provider works end to end.
- Missing providers do not break the application.
- The user can select a provider per agent.
- Failed provider responses show an explicit error, not an invisible fake fallback.

---

## 9. Phase 4 — Agent runtime

### Agent fields

Each agent must support:

- Name
- Role
- Description
- Provider
- Model
- System instructions
- Memory enabled/disabled
- Allowed tools
- Allowed workspaces
- Approval policy
- Enabled state

### Runtime sequence

```text
Receive message
→ Load agent config
→ Load authorized workspace context
→ Load memory
→ Load recent history
→ Start provider driver
→ Normalize events
→ Intercept tool requests
→ Ask approval when required
→ Execute approved tool
→ Return tool result to provider
→ Save response and activity
```

### Context order

```text
Safety instructions
Agent instructions
Student profile summary
Approved memory
Active project context
Retrieved file context
Recent conversation
Current request
```

Limit history and context sizes. Summarize older conversations rather than sending unlimited transcripts.

### Acceptance criteria

- Agent settings persist.
- Provider/model selection persists.
- Conversation history is server-backed.
- Runtime status is visible in the chat UI.
- Run errors and interruption states are persisted.

---

## 10. Phase 5 — Tools

Create a registry-based tool system.

```ts
interface AgentTool<TInput, TResult> {
  name: string;
  description: string;
  inputSchema: ZodSchema<TInput>;
  risk: "read" | "draft" | "write" | "external" | "destructive";
  execute(input: TInput, context: ToolContext): Promise<TResult>;
}
```

### First tools

Implement:

- `read_file`
- `search_files`
- `list_workspace_files`
- `create_task`
- `list_tasks`
- `create_milestone`
- `read_git_status`
- `read_git_diff`
- `generate_quiz`
- `generate_flashcards`
- `summarize_document`

### Later tools

- `write_file`
- `apply_patch`
- `run_tests`
- `run_command_in_sandbox`
- `search_web`
- `draft_email`
- `create_calendar_event`
- `browser_navigate`
- `browser_click`
- `send_email`
- `submit_application`

### Tool context

Every tool receives:

- User ID
- Agent ID
- Workspace ID
- Conversation ID
- Allowed paths
- Approval state
- Cancellation signal

### Acceptance criteria

- Tools are not callable unless registered.
- Tool inputs are schema validated.
- Ownership and path checks happen before execution.
- Tool activity appears in the UI.
- Tool results return to the agent runtime.

---

## 11. Phase 6 — Approvals and safety

### Risk policy

| Risk | Example | Required behavior |
|---|---|---|
| Read | Read selected notes | Allow within boundary |
| Draft | Generate cover letter | Save as draft |
| Write | Edit source file | Approval required |
| External | Send email | Approval required |
| Destructive | Delete file | Block or explicit approval |

### Approval lifecycle

```text
pending → approved → executed
pending → denied
pending → expired
```

Store:

- Agent
- User
- Tool
- Exact action
- Inputs
- Risk level
- Creation time
- Expiry time
- Decision
- Execution result

Add an audit log separate from usage metrics.

### Acceptance criteria

- Sensitive actions pause the run.
- Approval UI shows exact action and affected files/recipients.
- Denial prevents execution.
- Expired approvals cannot execute.
- Stop-all action interrupts active runs.

---

## 12. Phase 7 — File, memory and retrieval system

### File pipeline

```text
Select file
→ Validate MIME and size
→ Store original locally or in object storage
→ Extract text in a worker
→ Chunk text
→ Create embeddings if enabled
→ Store metadata and chunks
→ Mark ready
```

Never trust the extension alone. Inspect MIME type and enforce size limits.

### File statuses

```text
uploading
processing
ready
failed
deleted
```

### Memory

Add a real memory model with:

- Scope: profile, agent, project or conversation
- Content
- Source
- Confidence
- Created/updated timestamps
- User-approved flag
- Deleted timestamp

Do not silently save every conversation. Show memory candidates to the user.

### Retrieval rules

- Only retrieve authorized files.
- Prefer active project context.
- Show source file and page when possible.
- Say when no relevant source was found.
- Never invent citations.

---

## 13. Phase 8 — Multi-agent orchestration

### Example

```text
User: Prepare me for my final-year project viva.

Project Guide   → reviews project architecture
Study Coach     → explains technical concepts
Interview Coach → prepares viva questions
Writing Buddy   → improves the presentation narrative
Lead agent      → synthesizes the final preparation pack
```

### Requirements

- A lead agent creates a bounded plan.
- Child agents receive only required context.
- Child agents cannot bypass permissions.
- Maximum depth and child-agent count are enforced.
- Each child run has its own status.
- User can interrupt the parent workflow.
- Final answer identifies contributing agents.

### Acceptance criteria

- One request can invoke at least two agents.
- Activity timeline shows progress.
- Failed child runs are recoverable.
- No unbounded recursive spawning is possible.

---

## 14. Phase 9 — Student workflows

### Study Coach

- Upload notes
- Ask questions with citations
- Generate summary
- Generate flashcards
- Generate quiz
- Create study tasks
- Track weak topics

### Project Guide

- Create project
- Add milestones
- Read approved project files
- Inspect Git status
- Suggest architecture
- Create documentation outline
- Generate viva questions
- Propose file changes as diffs

### Career Scout

- Import resume
- Analyze skills
- Identify gaps
- Compare with a job description
- Draft cover letter
- Track application
- Prepare interview questions

### Code Mentor

- Read selected code
- Explain errors
- Suggest tests
- Propose patches
- Show diff before changes

All external submissions remain human-approved.

---

## 15. Phase 10 — Data and API improvements

### Required changes

- Add cursor pagination.
- Add idempotency keys to create endpoints.
- Standardize error responses.
- Add ownership checks for every foreign ID.
- Add indexes for conversation/project/user queries.
- Add audit log table.
- Replace stringified JSON arrays with Prisma JSON fields or relations.
- Move large file content out of database rows.
- Add DB-aware health checks.

### Standard error response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Project name is required",
    "details": {}
  }
}
```

---

## 16. Phase 11 — Authentication and privacy

Implement:

- Email verification
- Password reset
- Session revocation after password/account changes
- Optional Google OAuth
- Strong security headers
- Data export
- Account deletion and file cleanup
- Privacy consent records
- User-visible data retention policy
- Provider credential management

Use server-side authorization on every API route. Frontend route protection is not enough.

---

## 17. Phase 12 — Scheduling and integrations

Add only after manual agent runs are reliable.

### Routines

- Daily study plan
- Weekly project review
- Internship search
- Deadline reminder

Requirements:

- Disabled by default
- Visible in settings
- Pausable
- Bounded retries
- Run history
- External action approval

### Integrations

Add incrementally:

1. GitHub read access
2. Calendar draft events
3. Gmail draft creation
4. Browser research in an isolated context
5. Sending/submission only after extensive approval testing

---

## 18. Database migration direction

Current local development uses SQLite. Keep it for the first local runtime if useful, but validate PostgreSQL before hosted deployment.

Required future models:

```text
Provider
Model
Agent
AgentTool
Workspace
Conversation
Message
AgentRun
AgentEvent
Memory
File
FileChunk
Task
Approval
AuditLog
UsageEvent
Routine
```

PostgreSQL migration requirements:

- Run migrations against PostgreSQL 16.
- Add `pgvector` only after retrieval design is stable.
- Use JSON columns for flexible configuration.
- Configure connection pooling.
- Add backups and restore testing.

---

## 19. Testing plan

### Unit tests

Test:

- Driver parsing
- Event normalization
- Provider detection
- Approval transitions
- Permission checks
- Path boundaries
- Usage quotas
- Memory ranking
- Task transitions
- Input validation

### Integration tests

Test:

- Signup/login
- Protected routes
- Conversation persistence
- Streaming API
- File processing
- Project ownership
- Task ownership
- Approval execution
- Provider failure
- Process interruption

### End-to-end tests

Test this complete path:

```text
Signup
→ Onboarding
→ Provider setup
→ Create Study Coach
→ Send real local message
→ Upload notes
→ Ask question with citation
→ Create task
→ Create project
→ Run Project Guide
→ Review approval
→ Open career tracker
→ Export/delete data
```

### Security tests

- IDOR attempts
- Path traversal
- Symlink escape
- Malicious file MIME
- Oversized upload
- Prompt injection
- Invalid approval replay
- Expired approval
- Cross-origin harness request
- Child-process cleanup

---

## 20. Observability and operations

Add:

- Structured logs with redaction
- Error tracking
- Provider latency metrics
- Agent run success/failure metrics
- Tool execution audit events
- Storage usage monitoring
- Local diagnostics screen
- Production uptime check
- Cost/spend alerts for hosted providers

Never log full private messages, resumes or file contents in analytics.

---

## 21. Required UI improvements

Add to the existing design:

- Provider setup page
- Engine/model picker per agent
- Agent activity timeline
- Tool activity cards
- Approval cards with diffs/previews
- Stop generating button
- Stop all agents button
- Memory management page
- Provider error and fallback banner
- Empty/loading/error states
- Helpful/not-helpful message feedback
- First-run setup checklist

Keep the existing AgentHub design language:

- Warm off-white background
- Orange primary actions
- Navy focused panels
- Colored agent categories
- Rounded cards
- Clear editorial headings
- Student-friendly copy

---

## 22. Definition of done

The local-first milestone is complete only when:

- AgentHub launches as a desktop-capable application.
- The local harness runs on loopback.
- At least one real CLI/local provider works.
- The provider can stream a response.
- The user can interrupt it.
- Agent configurations persist.
- Conversations persist.
- Files have authorized context boundaries.
- At least five tools work through a registry.
- Sensitive tools require approvals.
- Tool results return to the agent.
- Agent activity is visible.
- At least two agents can collaborate.
- Memory is visible and deletable.
- Student workflows use real persisted data.
- No fake response is presented as a real provider response.
- Security and ownership tests pass.
- Typecheck, lint, unit, integration and end-to-end tests pass.
- Setup and troubleshooting documentation is complete.

---

## 23. Exact execution order

Follow this order:

1. Baseline checks and Git/CI.
2. Fix all ownership and security issues.
3. Add shared provider/event contracts.
4. Finish the local harness.
5. Connect the mock driver through the harness.
6. Connect Ollama or one real CLI provider.
7. Replace direct mock chat fallback with explicit provider state.
8. Add provider setup and model selection UI.
9. Add tool registry and read-only tools.
10. Add approval broker and audit logging.
11. Add safe file/project tools.
12. Add memory and retrieval.
13. Add real Study Coach, Project Guide and Career Scout workflows.
14. Add multi-agent orchestration.
15. Add task routines and integrations.
16. Validate PostgreSQL/S3/Redis deployment.
17. Add production monitoring and billing only after quotas work.
18. Run security, accessibility, performance and end-to-end release checks.

Do not skip directly to browser automation or autonomous computer control.

---

## 24. Final instruction

The coding agent must work in small verified increments. Before every architectural change, inspect the existing implementation and preserve working behavior. Before declaring completion, show which requirement was implemented, which files changed, which tests ran and which external setup is still required.

The final product should be a safe, student-focused local agent workspace—not an unsafe shell wrapper and not a collection of mocked chatbot screens.

