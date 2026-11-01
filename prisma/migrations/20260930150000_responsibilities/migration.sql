CREATE TABLE "AgentResponsibility" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "instruction" TEXT NOT NULL DEFAULT '',
    "triggerType" TEXT NOT NULL DEFAULT 'schedule',
    "triggerValue" TEXT NOT NULL DEFAULT 'daily',
    "scopeIds" JSON NOT NULL DEFAULT '[]',
    "actionPolicy" TEXT NOT NULL DEFAULT 'suggest_only',
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastRunAt" DATETIME,
    "nextRunAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AgentResponsibility_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AgentResponsibility_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "AgentResponsibility_status_nextRunAt_idx" ON "AgentResponsibility"("status", "nextRunAt");
CREATE INDEX "AgentResponsibility_ownerId_status_idx" ON "AgentResponsibility"("ownerId", "status");

CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "link" TEXT NOT NULL DEFAULT '',
    "groupedKey" TEXT,
    "readAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "Notification_ownerId_readAt_createdAt_idx" ON "Notification"("ownerId", "readAt", "createdAt");
CREATE INDEX "Notification_ownerId_groupedKey_idx" ON "Notification"("ownerId", "groupedKey");
