-- moonriseUtcIso and moonsetUtcIso were added in 20260403000000 but dropped manually
-- at some point. They are still used in panchanga service and API transformers.
ALTER TABLE "DailyInfo" ADD COLUMN IF NOT EXISTS "moonriseUtcIso" TEXT;
ALTER TABLE "DailyInfo" ADD COLUMN IF NOT EXISTS "moonsetUtcIso"  TEXT;
