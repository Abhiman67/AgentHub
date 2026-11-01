ALTER TABLE "Task"
ADD COLUMN "subjectId" TEXT REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Task_subjectId_status_dueDate_idx"
ON "Task"("subjectId", "status", "dueDate");
