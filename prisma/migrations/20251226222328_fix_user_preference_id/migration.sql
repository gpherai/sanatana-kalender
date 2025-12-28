-- AlterTable
ALTER TABLE "UserPreference" ALTER COLUMN "id" SET DEFAULT 'default';

-- Migrate existing records to use "default" ID
-- This ensures consistency with API routes that expect id="default"
UPDATE "UserPreference"
SET id = 'default'
WHERE id != 'default'
  AND NOT EXISTS (
    SELECT 1 FROM "UserPreference" WHERE id = 'default'
  );

-- Clean up any duplicate records (keep only one with id="default")
DELETE FROM "UserPreference"
WHERE id != 'default';
