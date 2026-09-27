-- AlterTable
ALTER TABLE "File" ADD COLUMN "failureReason" TEXT;
ALTER TABLE "File" ADD COLUMN "storageKey" TEXT;

-- CreateTable
CREATE TABLE "FileChunk" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FileChunk_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FileChunk_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IntegrationAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "scopes" TEXT NOT NULL DEFAULT '[]',
    "accessTokenEncrypted" TEXT,
    "refreshTokenEncrypted" TEXT,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "IntegrationAccount_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JobRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "payload" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'queued',
    "retries" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "nextAttemptAt" DATETIME,
    "lastError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT,
    CONSTRAINT "JobRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "FileChunk_ownerId_fileId_idx" ON "FileChunk"("ownerId", "fileId");

-- CreateIndex
CREATE UNIQUE INDEX "FileChunk_fileId_index_key" ON "FileChunk"("fileId", "index");

-- CreateIndex
CREATE INDEX "IntegrationAccount_ownerId_idx" ON "IntegrationAccount"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationAccount_ownerId_provider_key" ON "IntegrationAccount"("ownerId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "JobRecord_idempotencyKey_key" ON "JobRecord"("idempotencyKey");

-- CreateIndex
CREATE INDEX "JobRecord_type_status_idx" ON "JobRecord"("type", "status");
