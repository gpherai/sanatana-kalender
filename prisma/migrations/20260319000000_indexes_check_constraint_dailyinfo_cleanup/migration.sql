-- CreateIndex: missing indexes on Event for filter queries
CREATE INDEX "Event_recurrenceType_idx" ON "Event"("recurrenceType");
CREATE INDEX "Event_importance_idx" ON "Event"("importance");

-- AddCheckConstraint: moonPhasePercent must be between 0 and 100
ALTER TABLE "DailyInfo" ADD CONSTRAINT "DailyInfo_moonPhasePercent_check" CHECK ("moonPhasePercent" >= 0 AND "moonPhasePercent" <= 100);

-- DropColumn: redundant string fields (names derivable from enum/number)
ALTER TABLE "DailyInfo" DROP COLUMN "maasName";
ALTER TABLE "DailyInfo" DROP COLUMN "sunSignName";
ALTER TABLE "DailyInfo" DROP COLUMN "moonSignName";
