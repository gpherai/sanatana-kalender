-- Finding 1: Drop stray unique constraint on Event.name
-- Schema has name String (not @unique); namingKey is the machine-readable unique key.
-- Init migration created Event_name_key but no later migration dropped it.
DROP INDEX IF EXISTS "Event_name_key";

-- Finding 2: Drop orphaned tables from init migration (removed from schema, never dropped)
DROP TABLE IF EXISTS "LunarEvent";
DROP TABLE IF EXISTS "MoonPhase";

-- Finding 3: Drop redundant non-unique indexes superseded by unique constraints
-- Category_name_key (unique) already covers all lookups on Category.name
DROP INDEX IF EXISTS "Category_name_idx";
-- DailyInfo_date_key (unique) already covers all lookups on DailyInfo.date
DROP INDEX IF EXISTS "DailyInfo_date_idx";

-- Finding 4: Add missing FK indexes for practiceId on Sadhana join tables
CREATE INDEX "sadhana_session_items_practiceId_idx" ON "sadhana_session_items"("practiceId");
CREATE INDEX "sadhana_routine_items_practiceId_idx" ON "sadhana_routine_items"("practiceId");
