-- Remove CUSTOM from RuleType enum
-- No rows in events use CUSTOM (verified before migration)
ALTER TYPE "RuleType" RENAME TO "RuleType_old";
CREATE TYPE "RuleType" AS ENUM ('TITHI', 'SOLAR', 'NAKSHATRA', 'TITHI_NAKSHATRA', 'WEEKDAY_TITHI', 'PRADOSH');
ALTER TABLE "events" ALTER COLUMN "ruleType" TYPE "RuleType" USING "ruleType"::text::"RuleType";
DROP TYPE "RuleType_old";
