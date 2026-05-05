-- moonriseUtcIso and moonsetUtcIso were added in 20260403000000 but accidentally
-- dropped from schema.prisma. They are still used in panchanga service and API
-- transformers. Columns already exist in DB — no-op for the DB, restores schema sync.
-- (No ALTER TABLE needed: columns are already present from the 20260403000000 migration.)

-- Add missing indexes on DailyInfo.sankranti (present in schema since initial design
-- but never captured in a migration).
CREATE INDEX IF NOT EXISTS "DailyInfo_sankranti_idx" ON "DailyInfo"("sankranti");
CREATE INDEX IF NOT EXISTS "DailyInfo_sankranti_date_idx" ON "DailyInfo"("sankranti", "date");
