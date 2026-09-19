# AgentHub — Implementation Roadmap & Remaining Work

**Status:** Working MVP (Core architecture & baseline features implemented)  
**Last Updated:** September 2026  
**Purpose:** Actionable, categorized task list to advance AgentHub from working prototype to production-grade, evaluatable academic software.

---

## 📊 Quick Status Summary

| Area | Completion | Current Status | Primary Next Step |
| :--- | :---: | :--- | :--- |
| **Foundation & Architecture** | 100% | Next.js 16, Prisma 6, Auth.js, DB indexes, security headers | Done |
| **Agent Workspace & Chat** | 95% | SSE streaming, multi-agent directory, feedback loops, stop button | Live API key testing |
| **Safety & Human-in-the-Loop** | 100% | Full approval dashboard, 7d TTL auto-expiry, audit log | Done |
| **Files & Study Coach** | 90% | File uploads, MIME sniffing, RAG semantic chunking & citations | Done |
| **Planner & Projects** | 100% | Milestone tracking, Today/Week/Calendar views, task progress | Done |
| **Career & Resume** | 100% | ATS match engine, application tracker, draft cover letters | Done |
| **Reliability & Ops** | 90% | Latency health probe, React ErrorBoundary, HSTS headers | Done |

---

## 🧩 Category 1: Core AI & Chat Experience

> Focus: Real-time intelligence, user control during streaming, and student feedback loops.

- [ ] **[P0] Activate Live LLM Provider Integration**
  - **Details:** Verify and test Google Gemini (`gemini-1.5-flash`) and OpenAI (`gpt-4o-mini`) live streaming in `src/lib/ai.ts`.
  - **Fallback:** Maintain graceful fallback to `mockStream` if no API key is supplied.
  - **Files:** `src/lib/ai.ts`, `.env.example`

- [x] **[P0] "Stop Generating" Abort Control in Chat**
  - **Details:** Expose an explicit abort controller button in the chat input toolbar when an SSE stream is active so students can halt generation immediately.
  - **Files:** `src/app/app/agents/[agentId]/page.tsx`, `src/lib/ai.ts`

- [x] **[P1] Message Helpfulness Feedback (👍 / 👎)**
  - **Details:** Add thumbs-up / thumbs-down buttons to agent response bubbles that write to `usage_events` table for evaluation and model tuning.
  - **Files:** `src/components/ChatMessage.tsx`, `src/app/app/agents/[agentId]/page.tsx`, `src/app/api/usage/route.ts`

- [x] **[P1] Contextual Suggested Prompts**
  - **Details:** Connect agent-specific starter prompts (`SUGGESTED_PROMPTS`) directly to the UI based on the active agent template (Study Coach, Code Mentor, etc.).
  - **Files:** `src/app/app/agents/[agentId]/page.tsx`

- [x] **[P2] Server-Synced Active Conversation State**
  - **Details:** Migrate active conversation tracking from `localStorage` to server-backed URL state (`/app/agents/[id]?c=[conversationId]`) to support multi-device consistency.
  - **Files:** `src/app/app/agents/[agentId]/page.tsx`

---

## 🛡️ Category 2: Human-in-the-Loop (HITL) Safety & Governance

> Focus: Academic integrity, deterministic approvals, and auditability (maps to Washington Accord WP2/EA4).

- [x] **[P0] Dedicated `/app/approvals` Management Dashboard**
  - **Details:** Create a first-class UI page listing all pending, approved, denied, and expired approvals instead of only showing them inside chat transcripts.
  - **Files:** `src/app/app/approvals/page.tsx`, `src/app/api/approvals/route.ts`

- [x] **[P1] Automated Expiry & TTL Enforcement**
  - **Details:** Enforce 7-day Time-To-Live (TTL) expiration on pending approval tickets automatically, preventing stale execution of destructive actions.
  - **Files:** `src/app/api/approvals/[id]/route.ts`, `src/lib/approvals.ts`

- [x] **[P1] Dedicated Audit Log Table**
  - **Details:** Separate security audit events (`actor`, `action`, `target`, `timestamp`, `ip`) from general billing usage counters in the Prisma schema.
  - **Files:** `prisma/schema.prisma`, `src/lib/audit.ts`

- [x] **[P2] Red-Team Academic Integrity Guardrails**
  - **Details:** Reinforce system prompts to enforce Socratic teaching rather than writing complete assignments or exam answers.
  - **Files:** `src/lib/ai.ts` (`PLATFORM_SYSTEM_POLICY`)

---

## 📚 Category 3: Documents, Notes & RAG Pipeline

> Focus: Note ingestion, semantic chunking, and verifiable source citations for Study Coach.

- [x] **[P1] Document Chunking & Ingestion Pipeline**
  - **Details:** Split uploaded lecture notes and PDFs into distinct semantic chunks rather than storing monolithic text strings in database rows.
  - **Files:** `src/app/api/files/route.ts`, `src/lib/chunking.ts`

- [x] **[P1] Verifiable Citation UI Linking**
  - **Details:** Make citation tags in agent responses clickable, opening the source document preview directly at the relevant section.
  - **Files:** `src/app/app/agents/[agentId]/page.tsx`, `src/components/Dialog.tsx`

- [x] **[P2] Upload Validation & MIME Sniffing**
  - **Details:** Validate file headers/MIME types beyond simple file extension checking before processing uploads (PDF, TXT, MD, DOCX).
  - **Files:** `src/app/api/files/route.ts`

- [x] **[P2] Vector Embeddings Preparation (`pgvector`)**
  - **Details:** Structure database schema and chunking utilities to support vector embeddings for semantic document search when switching to PostgreSQL.
  - **Files:** `src/lib/chunking.ts`, `prisma/schema.prisma`

---

## ⚙️ Category 4: Backend, Database & Security Hardening

> Focus: Application security, database performance, and operational health.

- [x] **[P0] Real Database Health Check**
  - **Details:** Update `/api/health` from a static `OK` response to execute a real `SELECT 1` query on the Prisma database and return system latency.
  - **Files:** `src/app/api/health/route.ts`

- [x] **[P0] Production Security Headers**
  - **Details:** Configure essential HTTP security headers (Content Security Policy, X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security) in `next.config.ts`.
  - **Files:** `next.config.ts`

- [x] **[P1] Database Index Optimization**
  - **Details:** Add performance indexes to frequently queried relational fields:
    ```prisma
    @@index([userId, projectId])
    @@index([userId, updatedAt])
    ```
  - **Files:** `prisma/schema.prisma`

- [x] **[P1] Usage Quota & Rate Limit Enforcement**
  - **Details:** Enforce plan limits (Free: 100 messages, Pro: 2000 messages) at the API boundary, returning clean 429/402 status codes when exceeded.
  - **Files:** `src/lib/quotas.ts`, `src/app/api/conversations/[id]/route.ts`

- [x] **[P2] React Error Boundaries**
  - **Details:** Implement React Error Boundaries around chat streaming and heavy dashboard views to prevent an unexpected render error from crashing the entire app.
  - **Files:** `src/components/ErrorBoundary.tsx`, `src/app/app/layout.tsx`

---

## 🎯 Category 5: Student Workspace Features (Career, Planner, Projects)

> Focus: Functional depth across non-chat modules.

- [x] **[P1] Career: Resume Keyword & Skill Gap Analysis**
  - **Details:** Enhance the resume analyzer to parse uploaded resume text against target job descriptions and output prioritized skill gaps with ATS score evaluation.
  - **Files:** `src/app/app/career/page.tsx`, `src/app/api/career/analyze/route.ts`

- [x] **[P1] Onboarding: 3-Step First-Run Checklist**
  - **Details:** Add an introductory checklist on the dashboard for first-time users (1. Upload Notes → 2. Ask Study Coach → 3. Create First Project).
  - **Files:** `src/app/app/page.tsx`

- [x] **[P2] Projects: Two-Way Milestone Linking**
  - **Details:** Milestone task completion directly updates the project progress bar and status indicator.
  - **Files:** `src/app/app/projects/[projectId]/page.tsx`

- [x] **[P2] UI Polish: Empty, Loading & Skeleton States**
  - **Details:** Add clean skeletons and empty states across Career, Planner, and Project views.
  - **Files:** `src/app/app/career/page.tsx`, `src/app/app/projects/[projectId]/page.tsx`

---

## 🚀 Suggested Implementation Sprints

### 🟢 Sprint 1: High-Impact Core (Immediate Focus)
1. Security headers in `next.config.ts`
2. Real DB ping in `/api/health`
3. "Stop Generating" abort button in chat
4. Message helpfulness feedback (👍/👎)
5. Add missing Prisma indexes

### 🟡 Sprint 2: Safety & Governance Hub
1. Central `/app/approvals` dashboard page
2. Automated 7-day TTL expiry cleanup
3. Quota check enforcement on chat & file endpoints

### ⚪ Sprint 3: Document RAG & Career Depth
1. Text chunking for notes & lecture slides
2. Resume keyword analyzer upgrade
3. First-run student checklist on dashboard
