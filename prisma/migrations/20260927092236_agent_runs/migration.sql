-- CreateTable
CREATE TABLE "AgentRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "conversationId" TEXT,
    "projectId" TEXT,
    "goal" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "currentStepIndex" INTEGER NOT NULL DEFAULT 0,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "cancelledAt" DATETIME,
    CONSTRAINT "AgentRun_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AgentRun_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AgentRun_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AgentRun_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AgentStep" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "runId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'queued',
    "input" TEXT,
    "output" TEXT,
    "errorMessage" TEXT,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "approvalId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    CONSTRAINT "AgentStep_runId_fkey" FOREIGN KEY ("runId") REFERENCES "AgentRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ToolCall" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "runId" TEXT,
    "stepId" TEXT,
    "ownerId" TEXT NOT NULL,
    "toolName" TEXT NOT NULL,
    "risk" TEXT NOT NULL DEFAULT 'read_only',
    "status" TEXT NOT NULL DEFAULT 'queued',
    "input" TEXT NOT NULL DEFAULT '{}',
    "output" TEXT,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    CONSTRAINT "ToolCall_runId_fkey" FOREIGN KEY ("runId") REFERENCES "AgentRun" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ToolCall_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "AgentStep" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ToolCall_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Approval" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "payload" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "runId" TEXT,
    "toolCallId" TEXT,
    "risk" TEXT NOT NULL DEFAULT 'workspace_write',
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" DATETIME,
    CONSTRAINT "Approval_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Approval_runId_fkey" FOREIGN KEY ("runId") REFERENCES "AgentRun" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Approval_toolCallId_fkey" FOREIGN KEY ("toolCallId") REFERENCES "ToolCall" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Approval" ("agentId", "createdAt", "decidedAt", "description", "id", "ownerId", "payload", "status", "title") SELECT "agentId", "createdAt", "decidedAt", "description", "id", "ownerId", "payload", "status", "title" FROM "Approval";
DROP TABLE "Approval";
ALTER TABLE "new_Approval" RENAME TO "Approval";
CREATE INDEX "Approval_ownerId_status_idx" ON "Approval"("ownerId", "status");
CREATE INDEX "Approval_runId_idx" ON "Approval"("runId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "AgentRun_ownerId_status_updatedAt_idx" ON "AgentRun"("ownerId", "status", "updatedAt");

-- CreateIndex
CREATE INDEX "AgentRun_conversationId_idx" ON "AgentRun"("conversationId");

-- CreateIndex
CREATE INDEX "AgentRun_projectId_idx" ON "AgentRun"("projectId");

-- CreateIndex
CREATE INDEX "AgentStep_runId_sequence_idx" ON "AgentStep"("runId", "sequence");

-- CreateIndex
CREATE INDEX "ToolCall_ownerId_createdAt_idx" ON "ToolCall"("ownerId", "createdAt");

-- CreateIndex
CREATE INDEX "ToolCall_runId_createdAt_idx" ON "ToolCall"("runId", "createdAt");

-- CreateIndex
CREATE INDEX "Conversation_userId_projectId_idx" ON "Conversation"("userId", "projectId");

-- CreateIndex
CREATE INDEX "Conversation_userId_updatedAt_idx" ON "Conversation"("userId", "updatedAt");
