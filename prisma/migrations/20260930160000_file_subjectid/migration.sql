-- Repair: Phase 4 migration created Subject tables but omitted File.subjectId.
ALTER TABLE "File" ADD COLUMN "subjectId" TEXT REFERENCES "Subject"("id") ON DELETE SET NULL;
