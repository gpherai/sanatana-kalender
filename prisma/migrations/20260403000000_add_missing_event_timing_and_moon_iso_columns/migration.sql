-- CreateEnum
CREATE TYPE "TimingType" AS ENUM ('NISHITA_KAAL', 'PRADOSH_KAAL', 'SUNRISE', 'SUNSET', 'MADHYAHNA');

-- AlterTable Event: add startTime, endTime, timingType
ALTER TABLE "Event"
  ADD COLUMN "startTime"  TEXT,
  ADD COLUMN "endTime"    TEXT,
  ADD COLUMN "timingType" "TimingType";

-- AlterTable DailyInfo: add moonriseUtcIso, moonsetUtcIso
ALTER TABLE "DailyInfo"
  ADD COLUMN "moonriseUtcIso" TEXT,
  ADD COLUMN "moonsetUtcIso"  TEXT;
