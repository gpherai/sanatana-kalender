-- ============================================================
-- Fase 4: Converteer tijdvelden van TEXT naar TIME
--
-- Betreft: Event.startTime/endTime, EventOccurrence.startTime/endTime,
--          DailyInfo: sunrise, sunset, moonrise, moonset, en alle *EndTime/*Time velden.
--
-- Bestaande "HH:mm" en "HH:mm:ss" string waarden worden via ::time gecast.
-- NULL-waarden worden als NULL behouden.
-- ============================================================

-- events
ALTER TABLE "events"
  ALTER COLUMN "startTime" TYPE TIME USING CASE WHEN "startTime" IS NULL THEN NULL ELSE "startTime"::time END,
  ALTER COLUMN "endTime"   TYPE TIME USING CASE WHEN "endTime"   IS NULL THEN NULL ELSE "endTime"::time   END;

-- event_occurrences
ALTER TABLE "event_occurrences"
  ALTER COLUMN "startTime" TYPE TIME USING CASE WHEN "startTime" IS NULL THEN NULL ELSE "startTime"::time END,
  ALTER COLUMN "endTime"   TYPE TIME USING CASE WHEN "endTime"   IS NULL THEN NULL ELSE "endTime"::time   END;

-- daily_info
ALTER TABLE "daily_info"
  ALTER COLUMN "sunrise"              TYPE TIME USING CASE WHEN "sunrise"              IS NULL THEN NULL ELSE "sunrise"::time              END,
  ALTER COLUMN "sunset"               TYPE TIME USING CASE WHEN "sunset"               IS NULL THEN NULL ELSE "sunset"::time               END,
  ALTER COLUMN "moonrise"             TYPE TIME USING CASE WHEN "moonrise"             IS NULL THEN NULL ELSE "moonrise"::time             END,
  ALTER COLUMN "moonset"              TYPE TIME USING CASE WHEN "moonset"              IS NULL THEN NULL ELSE "moonset"::time              END,
  ALTER COLUMN "tithiEndTime"         TYPE TIME USING CASE WHEN "tithiEndTime"         IS NULL THEN NULL ELSE "tithiEndTime"::time         END,
  ALTER COLUMN "nakshatraEndTime"     TYPE TIME USING CASE WHEN "nakshatraEndTime"     IS NULL THEN NULL ELSE "nakshatraEndTime"::time     END,
  ALTER COLUMN "yogaEndTime"          TYPE TIME USING CASE WHEN "yogaEndTime"          IS NULL THEN NULL ELSE "yogaEndTime"::time          END,
  ALTER COLUMN "karanaEndTime"        TYPE TIME USING CASE WHEN "karanaEndTime"        IS NULL THEN NULL ELSE "karanaEndTime"::time        END,
  ALTER COLUMN "sankrantiTime"        TYPE TIME USING CASE WHEN "sankrantiTime"        IS NULL THEN NULL ELSE "sankrantiTime"::time        END,
  ALTER COLUMN "sunSignUpto"          TYPE TIME USING CASE WHEN "sunSignUpto"          IS NULL THEN NULL ELSE "sunSignUpto"::time          END,
  ALTER COLUMN "moonSignUpto"         TYPE TIME USING CASE WHEN "moonSignUpto"         IS NULL THEN NULL ELSE "moonSignUpto"::time         END,
  ALTER COLUMN "nextTithiEndTime"     TYPE TIME USING CASE WHEN "nextTithiEndTime"     IS NULL THEN NULL ELSE "nextTithiEndTime"::time     END,
  ALTER COLUMN "nextNakshatraEndTime" TYPE TIME USING CASE WHEN "nextNakshatraEndTime" IS NULL THEN NULL ELSE "nextNakshatraEndTime"::time END,
  ALTER COLUMN "nextYogaEndTime"      TYPE TIME USING CASE WHEN "nextYogaEndTime"      IS NULL THEN NULL ELSE "nextYogaEndTime"::time      END,
  ALTER COLUMN "nextKaranaEndTime"    TYPE TIME USING CASE WHEN "nextKaranaEndTime"    IS NULL THEN NULL ELSE "nextKaranaEndTime"::time    END;
