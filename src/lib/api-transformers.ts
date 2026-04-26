import { getMoonPhaseType, getMoonPhaseEmoji, getMoonPhaseName } from "@/lib/moon-phases";
import { detectSpecialDay } from "@/lib/panchanga-helpers";
import type { DailyPanchangaFull } from "@/server/panchanga";
import { addDayForDisplay, formatDateLocal } from "@/lib/date-utils";
import type { findEventOccurrences } from "@/repositories/event.repository";

type EventOccurrence = Awaited<ReturnType<typeof findEventOccurrences>>[number];

/**
 * Transform a Prisma EventOccurrence (with event includes) to the shared
 * CalendarEventResponse wire format. Used by the API route and SSR services
 * to guarantee consistent output.
 */
export function transformOccurrenceToCalendarEvent(occ: EventOccurrence) {
  const endDate = occ.endDate ?? occ.date;
  return {
    id: occ.id,
    eventId: occ.event.id,
    title: occ.event.name,
    start: formatDateLocal(occ.date),
    end: formatDateLocal(addDayForDisplay(endDate)),
    allDay: true,
    resource: {
      description: occ.event.description,
      eventType: occ.event.eventType,
      categories: occ.event.categories.map((ec) => ec.category),
      tithi: occ.event.tithi,
      nakshatra: occ.event.nakshatra,
      maas: occ.event.maas,
      tags: occ.event.tags,
      notes: occ.notes,
      startTime: occ.startTime,
      endTime: occ.endTime,
      originalEndDate: occ.endDate ? formatDateLocal(occ.endDate) : null,
      seriesParentEventIds: occ.event.seriesChildEntries.map((e) => e.parentEventId),
      seriesDayNumber: occ.event.seriesChildEntries[0]?.dayNumber ?? null,
      hasSeriesChildren: occ.event.seriesParentEntries.length > 0,
      recurrenceType: occ.event.recurrenceType,
    },
  };
}

/**
 * Transform Panchanga data to the shared /api/daily-info response format.
 * Used by API routes and server-rendered pages to keep all Panchanga display
 * fields consistent.
 */
export function transformToApiResponse(panchanga: DailyPanchangaFull) {
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
    moonriseUtcIso: panchanga.moonriseUtcIso,
    moonsetUtcIso: panchanga.moonsetUtcIso,

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
    // Purnima/Amavasya: use the astronomical moonPhaseEvent (not the sunrise-rule tithi)
    // to ensure the correct calendar day is marked (e.g., April 2 not April 1).
    // All other tithis (Ekadashi, Chaturthi, Pradosham, Ashtami): use tithi-based detection.
    specialDay: (() => {
      const date = new Date(panchanga.date);
      if (panchanga.moonPhaseEvent?.type === "full") {
        return {
          type: "purnima",
          name: "Purnima",
          description: "Volle Maan - Heilige dag",
          emoji: "🌕",
        };
      }
      if (panchanga.moonPhaseEvent?.type === "new") {
        return {
          type: "amavasya",
          name: "Amavasya",
          description: "Nieuwe Maan - Voorouderdag",
          emoji: "🌑",
        };
      }
      if (!panchanga.tithi) return null;
      const sd = detectSpecialDay(
        {
          number: panchanga.tithi.number,
          name: panchanga.tithi.name,
          paksha: panchanga.tithi.paksha,
        },
        date
      );
      // Exclude Purnima/Amavasya from tithi-based path — handled by moonPhaseEvent above
      if (sd?.type === "purnima" || sd?.type === "amavasya") return null;
      return sd
        ? { type: sd.type, name: sd.name, description: sd.description, emoji: sd.emoji }
        : null;
    })(),

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

    // Exact moon phase event (Swiss Ephemeris binary search)
    moonPhaseEvent: panchanga.moonPhaseEvent ?? null,

    // Metadata
    meta: {
      engine: panchanga.meta.engine,
      calculationDate: new Date().toISOString(),
    },
  };
}
