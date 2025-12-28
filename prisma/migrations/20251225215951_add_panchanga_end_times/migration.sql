-- AlterTable
ALTER TABLE "DailyInfo" ADD COLUMN     "karanaEndTime" TEXT,
ADD COLUMN     "karanaName" TEXT,
ADD COLUMN     "karanaType" TEXT,
ADD COLUMN     "nakshatraEndTime" TEXT,
ADD COLUMN     "tithiEndTime" TEXT,
ADD COLUMN     "yogaEndTime" TEXT,
ADD COLUMN     "yogaName" TEXT,
ALTER COLUMN "locationLat" SET DEFAULT 52.078525871758096,
ALTER COLUMN "locationLon" SET DEFAULT 4.331036597783044;

-- CreateIndex
CREATE INDEX "DailyInfo_tithi_idx" ON "DailyInfo"("tithi");
