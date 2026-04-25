-- Align database defaults with src/lib/domain.ts DEFAULT_LOCATION.
ALTER TABLE "DailyInfo" ALTER COLUMN "locationLat" SET DEFAULT 52.07809868016908;
ALTER TABLE "DailyInfo" ALTER COLUMN "locationLon" SET DEFAULT 4.33091146659494;

-- UserPreference is no longer a location source.
ALTER TABLE "UserPreference"
  DROP COLUMN "timezone",
  DROP COLUMN "locationName",
  DROP COLUMN "locationLat",
  DROP COLUMN "locationLon";
