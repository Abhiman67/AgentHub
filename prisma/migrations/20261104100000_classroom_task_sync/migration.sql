ALTER TABLE "Task" ADD COLUMN "externalProvider" TEXT;
ALTER TABLE "Task" ADD COLUMN "externalId" TEXT;
ALTER TABLE "Task" ADD COLUMN "externalUrl" TEXT;
ALTER TABLE "Task" ADD COLUMN "externalStatus" TEXT;
CREATE UNIQUE INDEX "Task_ownerId_externalProvider_externalId_key" ON "Task"("ownerId", "externalProvider", "externalId");
