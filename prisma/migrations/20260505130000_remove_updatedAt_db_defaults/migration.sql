-- Remove DB-level DEFAULT CURRENT_TIMESTAMP from @updatedAt columns on sadhana tables.
-- These defaults were added in 20260428000000 when the columns were created, but
-- Prisma's @updatedAt annotation manages the value from the client — no DB default needed.
ALTER TABLE "sadhana_goals"         ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "sadhana_practices"     ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "sadhana_routine_items" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "sadhana_session_items" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "sadhana_sessions"      ALTER COLUMN "updatedAt" DROP DEFAULT;
