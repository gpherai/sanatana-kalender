-- AlterEnum: add PRADOSH value to RuleType
-- This value was added to schema.prisma but the migration was never created.
ALTER TYPE "RuleType" ADD VALUE IF NOT EXISTS 'PRADOSH';
