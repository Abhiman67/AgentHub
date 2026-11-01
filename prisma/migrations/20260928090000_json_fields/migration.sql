-- Milestone 6: convert string-encoded JSON columns to native Json.
-- SQLite stores both as TEXT and existing values are valid JSON arrays,
-- so this rebuild preserves every record. On PostgreSQL the same Prisma
-- schema maps these to JSONB (fresh staging DB via db push; see docs).
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "institution" TEXT,
    "degree" TEXT,
    "semester" TEXT,
    "goals" JSON NOT NULL DEFAULT '[]',
    "subjects" JSON NOT NULL DEFAULT '[]',
    "skills" JSON NOT NULL DEFAULT '[]',
    "interests" JSON NOT NULL DEFAULT '[]',
    "studyHours" INTEGER,
    "careerTarget" TEXT,
    "onboardingDone" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Profile" ("id", "userId", "institution", "degree", "semester", "goals", "subjects", "skills", "interests", "studyHours", "careerTarget", "onboardingDone", "updatedAt") SELECT "id", "userId", "institution", "degree", "semester", "goals", "subjects", "skills", "interests", "studyHours", "careerTarget", "onboardingDone", "updatedAt" FROM "Profile";
DROP TABLE "Profile";
ALTER TABLE "new_Profile" RENAME TO "Profile";
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

CREATE TABLE "new_Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL DEFAULT 'major',
    "status" TEXT NOT NULL DEFAULT 'active',
    "targetDate" DATETIME,
    "linkedAgentIds" JSON NOT NULL DEFAULT '[]',
    "members" JSON NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Project_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Project" ("id", "ownerId", "name", "description", "type", "status", "targetDate", "linkedAgentIds", "members", "createdAt", "updatedAt") SELECT "id", "ownerId", "name", "description", "type", "status", "targetDate", "linkedAgentIds", "members", "createdAt", "updatedAt" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE INDEX "Project_ownerId_idx" ON "Project"("ownerId");

CREATE TABLE "new_IntegrationAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "scopes" JSON NOT NULL DEFAULT '[]',
    "accessTokenEncrypted" TEXT,
    "refreshTokenEncrypted" TEXT,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "IntegrationAccount_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_IntegrationAccount" ("id", "ownerId", "provider", "scopes", "accessTokenEncrypted", "refreshTokenEncrypted", "expiresAt", "createdAt", "updatedAt") SELECT "id", "ownerId", "provider", "scopes", "accessTokenEncrypted", "refreshTokenEncrypted", "expiresAt", "createdAt", "updatedAt" FROM "IntegrationAccount";
DROP TABLE "IntegrationAccount";
ALTER TABLE "new_IntegrationAccount" RENAME TO "IntegrationAccount";
CREATE INDEX "IntegrationAccount_ownerId_idx" ON "IntegrationAccount"("ownerId");
CREATE UNIQUE INDEX "IntegrationAccount_ownerId_provider_key" ON "IntegrationAccount"("ownerId", "provider");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
