ALTER TABLE "File" ADD COLUMN "careerGoalId" TEXT;
CREATE INDEX "File_ownerId_careerGoalId_idx" ON "File"("ownerId", "careerGoalId");
