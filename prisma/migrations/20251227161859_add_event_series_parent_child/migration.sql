-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "parentEventId" TEXT;

-- CreateIndex
CREATE INDEX "Event_parentEventId_idx" ON "Event"("parentEventId");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_parentEventId_fkey" FOREIGN KEY ("parentEventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
