-- AlterTable
ALTER TABLE "DailyInfo" ADD COLUMN     "isAdhika" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "includeAdhika" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isAdhikaOnly" BOOLEAN NOT NULL DEFAULT false;
