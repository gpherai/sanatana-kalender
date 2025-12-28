import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { errorResponse, serverError } from "@/lib/api-response";
import { panchangaService } from "@/services/panchanga.service";
import { DEFAULT_LOCATION } from "@/lib/constants";
import { getMoonPhaseType, getMoonPhaseEmoji, getMoonPhaseName } from "@/lib/moon-phases";
import { detectSpecialDay } from "@/lib/panchanga-helpers";
import type { DailyPanchangaFull } from "@/server/panchanga";
import { DateTime } from "luxon";

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Transform Panchanga data to API response format
 * Includes both old fields (for compatibility) and new Vedic fields
 */
function transformToApiResponse(panchanga: DailyPanchangaFull) {
  const illuminationPct = Math.round(panchanga.moon.illuminationPct);
  const moonPhaseType = getMoonPhaseType(illuminationPct, panchanga.moon.waxing);

  return {
    // Date & Location
    date: panchanga.date,
    locationName: panchanga.location.name,
    locationLat: panchanga.location.lat,
    locationLon: panchanga.location.lon,

    // Sun times (EXISTING FIELDS - compatible with old API)
    sunrise: panchanga.sunriseLocal,
    sunset: panchanga.sunsetLocal,

    // Moon rise/set (calculated using Swiss Ephemeris swe_rise_trans)
    moonrise: panchanga.moonriseLocal,
    moonset: panchanga.moonsetLocal,

    // Moon phase (EXISTING FIELDS - compatible with old API)
    moonPhasePercent: illuminationPct,
    moonPhaseType: moonPhaseType,
    moonPhaseName: getMoonPhaseName(moonPhaseType),
    moonPhaseEmoji: getMoonPhaseEmoji(illuminationPct, panchanga.moon.waxing),
    isWaxing: panchanga.moon.waxing,

    // =========================================================================
    // NEW FIELDS: Vedic Panchanga Data
    // =========================================================================

    // Vara (Sanskrit weekday)
    vara: {
      name: panchanga.vara.name,
    },

    // Tithi (lunar day) with end time
    tithi: {
      number: panchanga.tithi.number,
      name: panchanga.tithi.name,
      paksha: panchanga.tithi.paksha,
      endTime: panchanga.tithi.endLocal ?? null,
      endUtcIso: panchanga.tithi.endUtcIso ?? null,
    },

    // Nakshatra (lunar mansion) with pada and end time
    nakshatra: {
      number: panchanga.nakshatra.number,
      name: panchanga.nakshatra.name,
      pada: panchanga.nakshatra.pada,
      endTime: panchanga.nakshatra.endLocal ?? null,
      endUtcIso: panchanga.nakshatra.endUtcIso ?? null,
    },

    // Yoga (Sun-Moon angular relationship)
    yoga: {
      number: panchanga.yoga.number,
      name: panchanga.yoga.name,
      endTime: panchanga.yoga.endLocal ?? null,
      endUtcIso: panchanga.yoga.endUtcIso ?? null,
    },

    // Karana (half-tithi)
    karana: {
      number: panchanga.karana.number,
      name: panchanga.karana.name,
      type: panchanga.karana.type,
      endTime: panchanga.karana.endLocal ?? null,
      endUtcIso: panchanga.karana.endUtcIso ?? null,
    },

    // Inauspicious times
    rahuKalam: panchanga.rahuKalam
      ? {
          start: panchanga.rahuKalam.startLocal,
          end: panchanga.rahuKalam.endLocal,
        }
      : null,

    yamagandam: panchanga.yamagandam
      ? {
          start: panchanga.yamagandam.startLocal,
          end: panchanga.yamagandam.endLocal,
        }
      : null,

    // Ayanamsa (precession correction)
    ayanamsa: {
      name: panchanga.ayanamsa.name,
      degrees: panchanga.ayanamsa.degrees,
    },

    // Special day detection (server-calculated for consistency and caching)
    specialDay: panchanga.tithi
      ? (() => {
          const specialDay = detectSpecialDay({
            number: panchanga.tithi.number,
            name: panchanga.tithi.name,
            paksha: panchanga.tithi.paksha,
          });
          return specialDay
            ? {
                type: specialDay.type,
                name: specialDay.name,
                description: specialDay.description,
                emoji: specialDay.emoji,
              }
            : null;
        })()
      : null,

    // =========================================================================
    // DRIK PANCHANG EXTENDED FIELDS
    // =========================================================================

    // Maas (Lunar Month)
    maas: panchanga.maas
      ? {
          name: panchanga.maas.name,
          type: panchanga.maas.type,
          lunarDay: panchanga.maas.lunarDay,
          paksha: panchanga.maas.paksha,
        }
      : undefined,

    // Vikrama Samvat
    vikramaSamvat: panchanga.vikramaSamvat
      ? {
          year: panchanga.vikramaSamvat.year,
          name: panchanga.vikramaSamvat.name,
        }
      : undefined,

    // Samvatsara (60-year cycle)
    samvatsara: panchanga.samvatsara
      ? {
          name: panchanga.samvatsara.name,
          number: panchanga.samvatsara.number,
        }
      : undefined,

    // Shaka Samvat
    shakaSamvat: panchanga.shakaSamvat
      ? {
          year: panchanga.shakaSamvat.year,
          name: panchanga.shakaSamvat.name,
        }
      : undefined,

    // Sun Sign (Rashi)
    sunSign: panchanga.sunSign
      ? {
          number: panchanga.sunSign.number,
          name: panchanga.sunSign.name,
          uptoLocal: panchanga.sunSign.uptoLocal ?? null,
          uptoUtcIso: panchanga.sunSign.uptoUtcIso ?? null,
        }
      : undefined,

    // Moon Sign (Rashi)
    moonSign: panchanga.moonSign
      ? {
          number: panchanga.moonSign.number,
          name: panchanga.moonSign.name,
          uptoLocal: panchanga.moonSign.uptoLocal ?? null,
          uptoUtcIso: panchanga.moonSign.uptoUtcIso ?? null,
        }
      : undefined,

    // Pravishte/Gate
    pravishte: panchanga.pravishte
      ? {
          daysSinceSankranti: panchanga.pravishte.daysSinceSankranti,
          currentRashi: panchanga.pravishte.currentRashi,
          lastSankrantiDate: panchanga.pravishte.lastSankrantiDate,
        }
      : undefined,

    // Multiple Transitions (if elements end before next sunrise)
    nextTithi: panchanga.nextTithi
      ? {
          number: panchanga.nextTithi.number,
          name: panchanga.nextTithi.name,
          paksha: panchanga.nextTithi.paksha,
          endLocal: panchanga.nextTithi.endLocal ?? null,
          endUtcIso: panchanga.nextTithi.endUtcIso ?? null,
        }
      : undefined,

    nextNakshatra: panchanga.nextNakshatra
      ? {
          number: panchanga.nextNakshatra.number,
          name: panchanga.nextNakshatra.name,
          pada: panchanga.nextNakshatra.pada,
          endLocal: panchanga.nextNakshatra.endLocal ?? null,
          endUtcIso: panchanga.nextNakshatra.endUtcIso ?? null,
        }
      : undefined,

    nextYoga: panchanga.nextYoga
      ? {
          number: panchanga.nextYoga.number,
          name: panchanga.nextYoga.name,
          endLocal: panchanga.nextYoga.endLocal ?? null,
          endUtcIso: panchanga.nextYoga.endUtcIso ?? null,
        }
      : undefined,

    nextKarana: panchanga.nextKarana
      ? {
          number: panchanga.nextKarana.number,
          name: panchanga.nextKarana.name,
          type: panchanga.nextKarana.type,
          endLocal: panchanga.nextKarana.endLocal ?? null,
          endUtcIso: panchanga.nextKarana.endUtcIso ?? null,
        }
      : undefined,

    // Metadata
    meta: {
      engine: panchanga.meta.engine,
      calculationDate: new Date().toISOString(),
    },
  };
}

// =============================================================================
// API ROUTE HANDLER
// =============================================================================

/**
 * GET /api/daily-info
 *
 * Query params:
 * - date: Single date (YYYY-MM-DD)
 * - start, end: Date range (YYYY-MM-DD)
 *
 * Without params: Returns today's data
 *
 * Location and timezone are fetched from UserPreference.
 * Results are cached for performance.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dateParam = searchParams.get("date");
    const startParam = searchParams.get("start");
    const endParam = searchParams.get("end");

    // =========================================================================
    // STEP 1: Get user preferences for location and timezone
    // =========================================================================
    const preferences = await prisma.userPreference.findUnique({
      where: { id: "default" },
    });

    const location = preferences
      ? {
          name: preferences.locationName,
          lat: preferences.locationLat,
          lon: preferences.locationLon,
        }
      : DEFAULT_LOCATION;

    const timezone = preferences?.timezone ?? DEFAULT_LOCATION.timezone;

    // =========================================================================
    // STEP 2: Parse and validate date parameters
    // =========================================================================

    if (dateParam) {
      // ---------------------------------------------------------------------
      // Single date mode
      // ---------------------------------------------------------------------

      // IMPORTANT: Parse date in the selected timezone, not UTC!
      // This ensures we calculate for the correct calendar day.
      const dt = DateTime.fromISO(dateParam, { zone: timezone });

      if (!dt.isValid) {
        return errorResponse("Ongeldige datum formaat. Gebruik YYYY-MM-DD.", 400);
      }

      const date = dt.toJSDate();

      // Calculate Panchanga using service layer
      const panchanga = await panchangaService.calculateDaily(date, location, timezone);

      // Transform to API response format
      const response = transformToApiResponse(panchanga);

      return NextResponse.json(response);
    } else if (startParam && endParam) {
      // ---------------------------------------------------------------------
      // Date range mode
      // ---------------------------------------------------------------------

      const startDt = DateTime.fromISO(startParam, { zone: timezone });
      const endDt = DateTime.fromISO(endParam, { zone: timezone });

      if (!startDt.isValid || !endDt.isValid) {
        return errorResponse("Ongeldige datum formaat. Gebruik YYYY-MM-DD.", 400);
      }

      const start = startDt.toJSDate();
      const end = endDt.toJSDate();

      if (start > end) {
        return errorResponse("Startdatum moet voor einddatum liggen.", 400);
      }

      // Limit to max 90 days for API requests
      const diffDays = Math.ceil(endDt.diff(startDt, "days").days) + 1;
      if (diffDays > 90) {
        return errorResponse("Maximum bereik is 90 dagen.", 400);
      }

      // Calculate range using service layer
      const panchangas = await panchangaService.calculateRange(start, end, location, timezone);

      // Transform all results
      const responses = panchangas.map(transformToApiResponse);

      return NextResponse.json(responses);
    } else {
      // ---------------------------------------------------------------------
      // Default: Today's data
      // ---------------------------------------------------------------------

      const today = new Date();
      const panchanga = await panchangaService.calculateDaily(today, location, timezone);
      const response = transformToApiResponse(panchanga);

      return NextResponse.json(response);
    }
  } catch (error) {
    console.error("[API] GET /api/daily-info error:", error);
    return serverError("Kon Panchanga niet berekenen");
  }
}
