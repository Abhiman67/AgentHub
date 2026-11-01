ALTER TABLE "File" ADD COLUMN "projectId" TEXT;
CREATE INDEX "File_ownerId_projectId_idx" ON "File"("ownerId", "projectId");
