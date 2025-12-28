-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('FESTIVAL', 'PUJA', 'VRAT', 'JAYANTI', 'TITHI', 'SANKRANTI', 'ECLIPSE', 'OTHER');

-- CreateEnum
CREATE TYPE "RecurrenceType" AS ENUM ('NONE', 'YEARLY_LUNAR', 'YEARLY_SOLAR', 'MONTHLY_LUNAR', 'MONTHLY_SOLAR');

-- CreateEnum
CREATE TYPE "Importance" AS ENUM ('MAJOR', 'MODERATE', 'MINOR');

-- CreateEnum
CREATE TYPE "CalendarView" AS ENUM ('month', 'week', 'day', 'agenda');

-- CreateEnum
CREATE TYPE "Paksha" AS ENUM ('SHUKLA', 'KRISHNA');

-- CreateEnum
CREATE TYPE "Tithi" AS ENUM ('PRATIPADA_SHUKLA', 'DWITIYA_SHUKLA', 'TRITIYA_SHUKLA', 'CHATURTHI_SHUKLA', 'PANCHAMI_SHUKLA', 'SHASHTHI_SHUKLA', 'SAPTAMI_SHUKLA', 'ASHTAMI_SHUKLA', 'NAVAMI_SHUKLA', 'DASHAMI_SHUKLA', 'EKADASHI_SHUKLA', 'DWADASHI_SHUKLA', 'TRAYODASHI_SHUKLA', 'CHATURDASHI_SHUKLA', 'PURNIMA', 'PRATIPADA_KRISHNA', 'DWITIYA_KRISHNA', 'TRITIYA_KRISHNA', 'CHATURTHI_KRISHNA', 'PANCHAMI_KRISHNA', 'SHASHTHI_KRISHNA', 'SAPTAMI_KRISHNA', 'ASHTAMI_KRISHNA', 'NAVAMI_KRISHNA', 'DASHAMI_KRISHNA', 'EKADASHI_KRISHNA', 'DWADASHI_KRISHNA', 'TRAYODASHI_KRISHNA', 'CHATURDASHI_KRISHNA', 'AMAVASYA');

-- CreateEnum
CREATE TYPE "Nakshatra" AS ENUM ('ASHWINI', 'BHARANI', 'KRITTIKA', 'ROHINI', 'MRIGASHIRA', 'ARDRA', 'PUNARVASU', 'PUSHYA', 'ASHLESHA', 'MAGHA', 'PURVA_PHALGUNI', 'UTTARA_PHALGUNI', 'HASTA', 'CHITRA', 'SWATI', 'VISHAKHA', 'ANURADHA', 'JYESHTHA', 'MULA', 'PURVA_ASHADHA', 'UTTARA_ASHADHA', 'SHRAVANA', 'DHANISHTA', 'SHATABHISHA', 'PURVA_BHADRAPADA', 'UTTARA_BHADRAPADA', 'REVATI');

-- CreateEnum
CREATE TYPE "Maas" AS ENUM ('CHAITRA', 'VAISHAKHA', 'JYESHTHA', 'ASHADHA', 'SHRAVANA', 'BHADRAPADA', 'ASHWIN', 'KARTIK', 'MARGASHIRSHA', 'PAUSHA', 'MAGHA', 'PHALGUNA');

-- CreateEnum
CREATE TYPE "MoonPhaseType" AS ENUM ('NEW_MOON', 'WAXING_CRESCENT', 'FIRST_QUARTER', 'WAXING_GIBBOUS', 'FULL_MOON', 'WANING_GIBBOUS', 'LAST_QUARTER', 'WANING_CRESCENT');

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "eventType" "EventType" NOT NULL DEFAULT 'OTHER',
    "recurrenceType" "RecurrenceType" NOT NULL DEFAULT 'NONE',
    "importance" "Importance" NOT NULL DEFAULT 'MODERATE',
    "categoryId" TEXT,
    "tithi" "Tithi",
    "nakshatra" "Nakshatra",
    "maas" "Maas",
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventOccurrence" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "endDate" DATE,
    "startTime" TEXT,
    "endTime" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventOccurrence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyInfo" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "locationName" TEXT NOT NULL DEFAULT 'Den Haag',
    "locationLat" DOUBLE PRECISION NOT NULL DEFAULT 52.0705,
    "locationLon" DOUBLE PRECISION NOT NULL DEFAULT 4.3007,
    "sunrise" TEXT,
    "sunset" TEXT,
    "moonrise" TEXT,
    "moonset" TEXT,
    "moonPhasePercent" INTEGER NOT NULL DEFAULT 0,
    "moonPhaseType" "MoonPhaseType",
    "isWaxing" BOOLEAN NOT NULL DEFAULT true,
    "tithi" "Tithi",
    "nakshatra" "Nakshatra",
    "maas" "Maas",
    "paksha" "Paksha",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LunarEvent" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "eventType" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LunarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MoonPhase" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "phase" "MoonPhaseType" NOT NULL,
    "illumination" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MoonPhase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreference" (
    "id" TEXT NOT NULL,
    "currentTheme" TEXT NOT NULL DEFAULT 'spiritual-minimal',
    "defaultView" "CalendarView" NOT NULL DEFAULT 'month',
    "weekStartsOn" INTEGER NOT NULL DEFAULT 1,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Amsterdam',
    "locationName" TEXT NOT NULL DEFAULT 'Den Haag',
    "locationLat" DOUBLE PRECISION NOT NULL DEFAULT 52.0705,
    "locationLon" DOUBLE PRECISION NOT NULL DEFAULT 4.3007,
    "visibleEventTypes" "EventType"[] DEFAULT ARRAY[]::"EventType"[],
    "visibleCategories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "notificationDaysBefore" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE INDEX "Category_name_idx" ON "Category"("name");

-- CreateIndex
CREATE INDEX "Category_sortOrder_idx" ON "Category"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Event_name_key" ON "Event"("name");

-- CreateIndex
CREATE INDEX "Event_eventType_idx" ON "Event"("eventType");

-- CreateIndex
CREATE INDEX "Event_categoryId_idx" ON "Event"("categoryId");

-- CreateIndex
CREATE INDEX "Event_tags_idx" ON "Event" USING GIN ("tags");

-- CreateIndex
CREATE INDEX "EventOccurrence_date_idx" ON "EventOccurrence"("date");

-- CreateIndex
CREATE INDEX "EventOccurrence_endDate_idx" ON "EventOccurrence"("endDate");

-- CreateIndex
CREATE UNIQUE INDEX "EventOccurrence_eventId_date_key" ON "EventOccurrence"("eventId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyInfo_date_key" ON "DailyInfo"("date");

-- CreateIndex
CREATE INDEX "DailyInfo_date_idx" ON "DailyInfo"("date");

-- CreateIndex
CREATE INDEX "LunarEvent_date_idx" ON "LunarEvent"("date");

-- CreateIndex
CREATE UNIQUE INDEX "MoonPhase_date_key" ON "MoonPhase"("date");

-- CreateIndex
CREATE INDEX "MoonPhase_date_idx" ON "MoonPhase"("date");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventOccurrence" ADD CONSTRAINT "EventOccurrence_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
