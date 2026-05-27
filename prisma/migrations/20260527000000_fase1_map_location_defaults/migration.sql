-- ============================================================
-- Fase 1 schema-wijzigingen (2026-05-27)
--
-- 1. Drop hardcoded DB-defaults van DailyInfo locatievelden.
--    Enige bron van waarheid: src/lib/domain.ts DEFAULT_LOCATION.
--    Seed schrijft deze velden altijd expliciet.
--
-- 2. Hernoem 7 tabellen naar snake_case via @@map.
--    Sadhana-tabellen deden dit al; de overige worden nu gelijkgetrokken.
-- ============================================================

-- 1. Drop locatie-defaults van DailyInfo (vóór de rename)
ALTER TABLE "DailyInfo" ALTER COLUMN "locationName" DROP DEFAULT;
ALTER TABLE "DailyInfo" ALTER COLUMN "locationLat" DROP DEFAULT;
ALTER TABLE "DailyInfo" ALTER COLUMN "locationLon" DROP DEFAULT;

-- 2. Hernoem tabellen naar snake_case
ALTER TABLE "Category"         RENAME TO "categories";
ALTER TABLE "Event"            RENAME TO "events";
ALTER TABLE "EventCategory"    RENAME TO "event_categories";
ALTER TABLE "EventSeriesEntry" RENAME TO "event_series_entries";
ALTER TABLE "EventOccurrence"  RENAME TO "event_occurrences";
ALTER TABLE "DailyInfo"        RENAME TO "daily_info";
ALTER TABLE "UserPreference"   RENAME TO "user_preferences";

-- 3. Hernoem PK/unique constraints (en hun backing indexes)

ALTER TABLE "categories"         RENAME CONSTRAINT "Category_pkey"         TO "categories_pkey";
-- Unique indexes (Prisma maakt geen named constraints voor @unique — gebruik ALTER INDEX)
ALTER INDEX "Category_name_key"                               RENAME TO "categories_name_key";

ALTER TABLE "events"             RENAME CONSTRAINT "Event_pkey"          TO "events_pkey";
ALTER INDEX "Event_namingKey_key"                             RENAME TO "events_namingKey_key";

ALTER TABLE "event_categories"   RENAME CONSTRAINT "EventCategory_pkey"  TO "event_categories_pkey";
ALTER INDEX "EventCategory_eventId_categoryId_key"            RENAME TO "event_categories_eventId_categoryId_key";
ALTER TABLE "event_categories"   RENAME CONSTRAINT "EventCategory_eventId_fkey"    TO "event_categories_eventId_fkey";
ALTER TABLE "event_categories"   RENAME CONSTRAINT "EventCategory_categoryId_fkey" TO "event_categories_categoryId_fkey";

ALTER TABLE "event_series_entries" RENAME CONSTRAINT "EventSeriesEntry_pkey"               TO "event_series_entries_pkey";
ALTER INDEX "EventSeriesEntry_parentEventId_childEventId_key" RENAME TO "event_series_entries_parentEventId_childEventId_key";
ALTER TABLE "event_series_entries" RENAME CONSTRAINT "EventSeriesEntry_parentEventId_fkey" TO "event_series_entries_parentEventId_fkey";
ALTER TABLE "event_series_entries" RENAME CONSTRAINT "EventSeriesEntry_childEventId_fkey"  TO "event_series_entries_childEventId_fkey";

ALTER TABLE "event_occurrences"  RENAME CONSTRAINT "EventOccurrence_pkey"         TO "event_occurrences_pkey";
ALTER INDEX "EventOccurrence_eventId_date_key"                RENAME TO "event_occurrences_eventId_date_key";
ALTER TABLE "event_occurrences"  RENAME CONSTRAINT "EventOccurrence_eventId_fkey" TO "event_occurrences_eventId_fkey";

ALTER TABLE "daily_info"         RENAME CONSTRAINT "DailyInfo_pkey"     TO "daily_info_pkey";
ALTER INDEX "DailyInfo_date_key"                              RENAME TO "daily_info_date_key";

ALTER TABLE "user_preferences"   RENAME CONSTRAINT "UserPreference_pkey" TO "user_preferences_pkey";

-- 4. Hernoem plain indexes (geen constraints)

ALTER INDEX "Category_sortOrder_idx"                     RENAME TO "categories_sortOrder_idx";

ALTER INDEX "Event_eventType_idx"                        RENAME TO "events_eventType_idx";
ALTER INDEX "Event_recurrenceType_idx"                   RENAME TO "events_recurrenceType_idx";
ALTER INDEX "Event_tags_idx"                             RENAME TO "events_tags_idx";

ALTER INDEX "EventCategory_eventId_sortOrder_idx"        RENAME TO "event_categories_eventId_sortOrder_idx";
ALTER INDEX "EventCategory_categoryId_idx"               RENAME TO "event_categories_categoryId_idx";

ALTER INDEX "EventSeriesEntry_parentEventId_idx"         RENAME TO "event_series_entries_parentEventId_idx";
ALTER INDEX "EventSeriesEntry_childEventId_idx"          RENAME TO "event_series_entries_childEventId_idx";

ALTER INDEX "EventOccurrence_date_idx"                   RENAME TO "event_occurrences_date_idx";
ALTER INDEX "EventOccurrence_endDate_idx"                RENAME TO "event_occurrences_endDate_idx";

ALTER INDEX "DailyInfo_tithi_idx"                        RENAME TO "daily_info_tithi_idx";
ALTER INDEX "DailyInfo_sankranti_idx"                    RENAME TO "daily_info_sankranti_idx";
ALTER INDEX "DailyInfo_sankranti_date_idx"               RENAME TO "daily_info_sankranti_date_idx";
