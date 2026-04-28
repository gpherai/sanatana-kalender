-- Fix schema drift: drop columns that exist in DB but not in Prisma schema
-- Drop Event.importance (old field, replaced by EventType)
DROP INDEX IF EXISTS "Event_importance_idx";
ALTER TABLE "Event" DROP COLUMN "importance";
DROP TYPE IF EXISTS "Importance";

-- Drop UserPreference.weekStartsOn (unused)
ALTER TABLE "UserPreference" DROP COLUMN "weekStartsOn";

-- Drop Event.parentEventId (old direct self-ref, replaced by EventSeriesEntry junction table)
ALTER TABLE "Event" DROP CONSTRAINT IF EXISTS "Event_parentEventId_fkey";
DROP INDEX IF EXISTS "Event_parentEventId_idx";
ALTER TABLE "Event" DROP COLUMN "parentEventId";

-- Add updatedAt to sadhana tables (for audit trail / optimistic locking)
ALTER TABLE "sadhana_practices" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "sadhana_sessions" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "sadhana_session_items" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "sadhana_goals" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add createdAt + updatedAt to sadhana_routine_items (missing both)
ALTER TABLE "sadhana_routine_items" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "sadhana_routine_items" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
