/**
 * Recurrence Service
 *
 * Generates EventOccurrences based on Event recurrence rules.
 * Supports lunar (tithi-based) and solar (date-based) recurrence patterns.
 *
 * Features:
 * - YEARLY_LUNAR: Repeats annually on specific tithi (e.g., every Krishna Chaturdashi)
 * - YEARLY_SOLAR: Repeats annually on specific date (e.g., every March 14)
 * - MONTHLY_LUNAR: Repeats monthly on specific tithi (e.g., every Ekadashi = 24x per year)
 * - MONTHLY_SOLAR: Repeats monthly on specific day (e.g., 15th of every month)
 * - NONE: Single occurrence only
 *
 * @module services/recurrence
 */

import type { Event, RecurrenceType, Tithi } from "@prisma/client";
import { Sankranti, EventType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { DEFAULT_LOCATION } from "@/lib/domain";
import { logDebug, logWarn } from "@/lib/utils";
import { formatDateNL } from "@/lib/date-utils";
import { calculateTimingWindow } from "@/lib/timing-utils";
import {
  computeTithiOccurrence,
  groupConsecutiveDays,
  isPredecessorEndsAfterSunrise,
  selectFirstPerYear,
} from "@/engine";

// =============================================================================
// KSHAYA TITHI PREDECESSOR MAP
// =============================================================================

/**
 * Maps each tithi to the one that precedes it in the lunar cycle.
 *
 * A kshaya ("lost") tithi never occurs at sunrise. It starts after sunrise on
 * day D (when its predecessor ends) and ends before sunrise on day D+1.
 * To detect it: find days where the predecessor tithi's tithiEndTime >= sunrise.
 *
 * Example: NAVAMI_SHUKLA in Chaitra 2026 is kshaya.
 *   On Mar 26: ASHTAMI_SHUKLA active at sunrise, ends at 07:18 (> sunrise ~06:33).
 *   → NAVAMI_SHUKLA starts 07:18 on Mar 26. Calendar date = Mar 26.
 */
const TITHI_PREDECESSOR: Partial<Record<Tithi, Tithi>> = {
  PRATIPADA_SHUKLA: "AMAVASYA",
  DWITIYA_SHUKLA: "PRATIPADA_SHUKLA",
  TRITIYA_SHUKLA: "DWITIYA_SHUKLA",
  CHATURTHI_SHUKLA: "TRITIYA_SHUKLA",
  PANCHAMI_SHUKLA: "CHATURTHI_SHUKLA",
  SHASHTHI_SHUKLA: "PANCHAMI_SHUKLA",
  SAPTAMI_SHUKLA: "SHASHTHI_SHUKLA",
  ASHTAMI_SHUKLA: "SAPTAMI_SHUKLA",
  NAVAMI_SHUKLA: "ASHTAMI_SHUKLA",
  DASHAMI_SHUKLA: "NAVAMI_SHUKLA",
  EKADASHI_SHUKLA: "DASHAMI_SHUKLA",
  DWADASHI_SHUKLA: "EKADASHI_SHUKLA",
  TRAYODASHI_SHUKLA: "DWADASHI_SHUKLA",
  CHATURDASHI_SHUKLA: "TRAYODASHI_SHUKLA",
  PURNIMA: "CHATURDASHI_SHUKLA",
  PRATIPADA_KRISHNA: "PURNIMA",
  DWITIYA_KRISHNA: "PRATIPADA_KRISHNA",
  TRITIYA_KRISHNA: "DWITIYA_KRISHNA",
  CHATURTHI_KRISHNA: "TRITIYA_KRISHNA",
  PANCHAMI_KRISHNA: "CHATURTHI_KRISHNA",
  SHASHTHI_KRISHNA: "PANCHAMI_KRISHNA",
  SAPTAMI_KRISHNA: "SHASHTHI_KRISHNA",
  ASHTAMI_KRISHNA: "SAPTAMI_KRISHNA",
  NAVAMI_KRISHNA: "ASHTAMI_KRISHNA",
  DASHAMI_KRISHNA: "NAVAMI_KRISHNA",
  EKADASHI_KRISHNA: "DASHAMI_KRISHNA",
  DWADASHI_KRISHNA: "EKADASHI_KRISHNA",
  TRAYODASHI_KRISHNA: "DWADASHI_KRISHNA",
  CHATURDASHI_KRISHNA: "TRAYODASHI_KRISHNA",
  AMAVASYA: "CHATURDASHI_KRISHNA",
};

// =============================================================================
// TYPES
// =============================================================================

/** Generated occurrence data (ready for database insertion) */
export type { GeneratedOccurrence } from "@/engine";
import type { GeneratedOccurrence } from "@/engine";

/**
 * Recurrence generation options
 */
export interface RecurrenceOptions {
  /** Start date of generation window */
  startDate: Date;
  /** End date of generation window */
  endDate: Date;
  /** Location for lunar calculations (default: Den Haag) */
  location?: { name: string; lat: number; lon: number };
  /** Timezone for time formatting */
  timezone?: string;
  /** Maximum occurrences to generate (safety limit) */
  maxOccurrences?: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_MAX_OCCURRENCES = 1000; // Safety limit

// =============================================================================
// STRATEGY REGISTRIES
// =============================================================================

/**
 * Unified signature for all recurrence strategy functions.
 * Functions that don't need location/timezone simply ignore those parameters.
 */
type RecurrenceStrategy = (
  event: Event,
  startDate: Date,
  endDate: Date,
  location: { name: string; lat: number; lon: number },
  timezone: string
) => Promise<GeneratedOccurrence[]>;

/**
 * Registry of rule-type strategies.
 * Add new ruleType handlers here without modifying the dispatch logic.
 */
const RULE_STRATEGIES: Record<string, RecurrenceStrategy> = {
  SOLAR: generateSolarRuleOccurrences,
  TITHI: generateYearlyLunarOccurrences,
  NAKSHATRA: generateNakshatraRuleOccurrences,
  TITHI_NAKSHATRA: generateNakshatraRuleOccurrences,
  WEEKDAY_TITHI: generateWeekdayTithiOccurrences,
};

/**
 * Registry of recurrenceType strategies.
 * Add new recurrenceType handlers here without modifying the dispatch logic.
 */
const RECURRENCE_STRATEGIES: Record<string, RecurrenceStrategy> = {
  YEARLY_LUNAR: generateYearlyLunarOccurrences,
  YEARLY_SOLAR: generateYearlySolarOccurrences,
  MONTHLY_LUNAR: generateMonthlyLunarOccurrences,
  MONTHLY_SOLAR: generateMonthlySolarOccurrences,
};

// =============================================================================
// MAIN RECURRENCE ENGINE
// =============================================================================

/**
 * Generate occurrences for an event based on its recurrence type.
 *
 * @param event - Event with recurrence configuration
 * @param options - Generation window and settings
 * @returns Array of generated occurrences
 *
 * @example
 * // Generate yearly lunar event (e.g., Maha Shivaratri)
 * const event = {
 *   name: "Maha Shivaratri",
 *   recurrenceType: "YEARLY_LUNAR",
 *   tithi: "CHATURDASHI_KRISHNA"
 * };
 * const occurrences = await generateOccurrences(event, {
 *   startDate: new Date('2025-01-01'),
 *   endDate: new Date('2027-12-31')
 * });
 * // Returns: [Date(2025-02-26), Date(2026-02-15), Date(2027-03-07)]
 */
export async function generateOccurrences(
  event: Event,
  options: RecurrenceOptions
): Promise<GeneratedOccurrence[]> {
  const {
    startDate,
    endDate,
    location = DEFAULT_LOCATION,
    timezone = DEFAULT_LOCATION.timezone,
    maxOccurrences = DEFAULT_MAX_OCCURRENCES,
  } = options;

  logDebug(
    `Generating occurrences for "${event.name}" (${event.recurrenceType})`,
    `from ${startDate.toISOString().split("T")[0]} to ${endDate.toISOString().split("T")[0]}`
  );

  // NONE: No recurrence, return empty
  if (event.recurrenceType === "NONE") {
    return [];
  }

  let occurrences: GeneratedOccurrence[] = [];

  // WEEKDAY_TITHI takes full precedence — handles its own frequency internally
  // (queries all matching tithis, then filters by weekday).
  if (event.ruleType === "WEEKDAY_TITHI") {
    occurrences = await generateWeekdayTithiOccurrences(
      event,
      startDate,
      endDate,
      location,
      timezone
    );
  } else if (
    // Monthly recurrence takes priority over other ruleType-based dispatch.
    // This allows catalog events (which have a ruleType) to still be monthly.
    event.recurrenceType === "MONTHLY_LUNAR" ||
    event.recurrenceType === "MONTHLY_SOLAR"
  ) {
    const strategy = RECURRENCE_STRATEGIES[event.recurrenceType];
    if (!strategy) {
      logWarn(`Unknown recurrence type: ${event.recurrenceType}`);
      return [];
    }
    occurrences = await strategy(event, startDate, endDate, location, timezone);
  } else if (event.ruleType) {
    // Rule-based generation (takes precedence over recurrenceType for yearly events)
    const strategy = RULE_STRATEGIES[event.ruleType];
    if (!strategy) {
      logWarn(`Rule type ${event.ruleType} not yet implemented for event ${event.name}`);
      return [];
    }
    occurrences = await strategy(event, startDate, endDate, location, timezone);
  } else {
    // Fallback to recurrenceType logic
    const strategy = RECURRENCE_STRATEGIES[event.recurrenceType];
    if (!strategy) {
      logWarn(`Unknown recurrence type: ${event.recurrenceType}`);
      return [];
    }
    occurrences = await strategy(event, startDate, endDate, location, timezone);
  }

  // Apply safety limit
  if (occurrences.length > maxOccurrences) {
    logWarn(
      `Generated ${occurrences.length} occurrences for "${event.name}", limiting to ${maxOccurrences}`
    );
    occurrences = occurrences.slice(0, maxOccurrences);
  }

  // Apply dynamic timing if configured
  if (event.timingType) {
    occurrences = await applyDynamicTiming(occurrences, event.timingType);
  } else if (event.startTime || event.endTime) {
    // Fallback: propagate static event-level times to occurrences without panchang-derived times
    occurrences = occurrences.map((occ) => ({
      ...occ,
      startTime: occ.startTime ?? event.startTime ?? undefined,
      endTime: occ.endTime ?? event.endTime ?? undefined,
    }));
  }

  logDebug(`Generated ${occurrences.length} occurrences for "${event.name}"`);

  return occurrences;
}

/**
 * Apply astronomical timing calculations to generated occurrences.
 *
 * For each occurrence, queries DailyInfo for the occurrence date (and the
 * following day for NISHITA_KAAL which needs next-day sunrise). Occurrences
 * that already have a panchang-derived startTime are not overwritten.
 */
async function applyDynamicTiming(
  occurrences: GeneratedOccurrence[],
  timingType: NonNullable<Event["timingType"]>
): Promise<GeneratedOccurrence[]> {
  if (occurrences.length === 0) return occurrences;

  // Collect all dates we need DailyInfo for.
  // NISHITA_KAAL also needs sunrise of the *following* day.
  const datesToFetch = new Set<string>();
  for (const occ of occurrences) {
    const isoDate = occ.date.toISOString().split("T")[0]!;
    datesToFetch.add(isoDate);
    if (timingType === "NISHITA_KAAL") {
      const nextDay = new Date(occ.date);
      nextDay.setDate(nextDay.getDate() + 1);
      datesToFetch.add(nextDay.toISOString().split("T")[0]!);
    }
  }

  // Batch query DailyInfo for all needed dates
  const dailyInfoRows = await prisma.dailyInfo.findMany({
    where: {
      date: { in: Array.from(datesToFetch).map((d) => new Date(d)) },
    },
    select: {
      date: true,
      sunrise: true,
      sunset: true,
    },
  });

  // Index by ISO date string for fast lookup
  const byDate = new Map<string, { sunrise: string | null; sunset: string | null }>();
  for (const row of dailyInfoRows) {
    byDate.set(row.date.toISOString().split("T")[0]!, {
      sunrise: row.sunrise,
      sunset: row.sunset,
    });
  }

  return occurrences.map((occ) => {
    // Never overwrite a time already set by the panchang strategy
    if (occ.startTime) return occ;

    const isoDate = occ.date.toISOString().split("T")[0]!;
    const dayInfo = byDate.get(isoDate);

    let nextSunrise: string | null = null;
    if (timingType === "NISHITA_KAAL") {
      const nextDay = new Date(occ.date);
      nextDay.setDate(nextDay.getDate() + 1);
      nextSunrise = byDate.get(nextDay.toISOString().split("T")[0]!)?.sunrise ?? null;
    }

    const window = calculateTimingWindow(timingType, {
      sunrise: dayInfo?.sunrise ?? null,
      sunset: dayInfo?.sunset ?? null,
      nextSunrise,
    });

    if (!window) {
      logWarn(
        `Could not calculate ${timingType} for ${formatDateNL(occ.date)} — missing DailyInfo`
      );
      return occ;
    }

    return { ...occ, startTime: window.startTime, endTime: window.endTime };
  });
}

// =============================================================================
// SOLAR RULE-BASED GENERATION
// =============================================================================

/**
 * Generate occurrences based on SOLAR rule (Sankranti matching).
 * Matches events to days when specific Sankranti occurs.
 *
 * Example: Makara Sankranti event matches all days with MAKARA_SANKRANTI
 */
async function generateSolarRuleOccurrences(
  event: Event,
  startDate: Date,
  endDate: Date
): Promise<GeneratedOccurrence[]> {
  // Extract sankranti from ruleConfig or direct sankranti field
  const sankrantiName =
    (event.ruleConfig as Record<string, unknown>)?.sankranti || event.sankranti;

  if (!sankrantiName) {
    logWarn(`SOLAR rule for event "${event.name}" has no sankranti specified`);
    return [];
  }

  // Validate sankrantiName is a valid Sankranti enum value before passing to Prisma
  const validSankrantiValues = Object.values(Sankranti) as string[];
  if (!validSankrantiValues.includes(String(sankrantiName))) {
    logWarn(
      `SOLAR rule for event "${event.name}" has invalid sankranti value: "${sankrantiName}"`
    );
    return [];
  }

  // Query DailyInfo for days when this Sankranti occurs
  const dailyData = await prisma.dailyInfo.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
      sankranti: sankrantiName as Sankranti,
    },
    select: {
      date: true,
      sankrantiTime: true,
    },
    orderBy: {
      date: "asc",
    },
  });

  return dailyData.map((day) => ({
    date: day.date,
    startTime: day.sankrantiTime ?? undefined,
  }));
}

// =============================================================================
// YEARLY LUNAR RECURRENCE
// =============================================================================

/**
 * Tithis for which the tithi-rule date (sunrise-based) can diverge from the
 * astronomical phase event by one calendar day.
 *
 * PURNIMA: sunrise-rule day may have 99% illumination while the 180° crossing
 * (moonPhasePercent = 100) falls on the following calendar day.
 * AMAVASYA: same phenomenon at the 0° / new moon crossing.
 *
 * The correction queries the DB for the day with the highest moonPhasePercent
 * (with matching moonPhaseType) in the [candidate, candidate+1] window.
 */
const PHASE_CORRECTION_TITHI: Partial<Record<Tithi, "FULL_MOON" | "NEW_MOON">> = {
  PURNIMA: "FULL_MOON",
  AMAVASYA: "NEW_MOON",
};

/**
 * Corrects tithi-rule dates to the astronomical phase peak day.
 *
 * Both the tithi day (e.g., 99% illumination) and the following day (100%)
 * may exceed the moonPhaseType threshold, so we prefer the day with the
 * highest moonPhasePercent — that is the true astronomical full/new moon.
 *
 * A ±1 day window is sufficient: the moon moves ~12°/day, so the 180°
 * crossing is always within one calendar day of the sunrise-rule PURNIMA day.
 */
async function correctToAstronomicalPhaseDay(
  candidates: Array<{
    date: Date;
    tithiEndTime: string | null;
    maas: string | null;
    isAdhika: boolean;
  }>,
  targetPhase: "FULL_MOON" | "NEW_MOON"
): Promise<
  Array<{
    date: Date;
    tithiEndTime: string | null;
    maas: string | null;
    isAdhika: boolean;
  }>
> {
  if (candidates.length === 0) return candidates;

  // For each candidate, build the [candidate, candidate+1] pair to check.
  const neighborDates = candidates.map(
    (c) => new Date(c.date.getTime() + 24 * 60 * 60 * 1000)
  );
  const allDates = [...candidates.map((c) => c.date), ...neighborDates];

  const phaseRows = await prisma.dailyInfo.findMany({
    where: {
      date: { in: allDates },
      moonPhaseType: targetPhase,
    },
    orderBy: { moonPhasePercent: "desc" }, // highest = peak phase day
    select: { date: true, moonPhasePercent: true },
  });

  // Build a map: ISO date string → moonPhasePercent for O(1) lookup.
  const phaseMap = new Map<string, number>(
    phaseRows.map((r) => [r.date.toISOString(), r.moonPhasePercent ?? 0])
  );

  return candidates.map((candidate) => {
    const candidateIso = candidate.date.toISOString();
    const nextDay = new Date(candidate.date.getTime() + 24 * 60 * 60 * 1000);
    const nextDayIso = nextDay.toISOString();

    const candidatePct = phaseMap.get(candidateIso) ?? -1;
    const nextDayPct = phaseMap.get(nextDayIso) ?? -1;

    // If neither day has the phase type, keep original (seeder gap / edge case).
    if (candidatePct < 0 && nextDayPct < 0) return candidate;

    // Prefer the day with the higher moonPhasePercent (true peak).
    if (nextDayPct > candidatePct) {
      return { ...candidate, date: nextDay };
    }
    return candidate;
  });
}

/**
 * Generate yearly lunar occurrences (e.g., every Krishna Chaturdashi).
 * Searches for matching tithi in each lunar year within the window.
 * Handles spanning tithis (tithi that spans multiple days).
 */
async function generateYearlyLunarOccurrences(
  event: Event,
  startDate: Date,
  endDate: Date,
  _location: { name: string; lat: number; lon: number },
  _timezone: string
): Promise<GeneratedOccurrence[]> {
  if (!event.tithi) {
    logWarn(`Yearly lunar event "${event.name}" has no tithi specified`);
    return [];
  }

  // Build where clause with Adhika support
  const where: Record<string, unknown> = {
    date: {
      gte: startDate,
      lte: endDate,
    },
    tithi: event.tithi,
  };

  // Handle Adhika matching
  if (event.isAdhikaOnly) {
    where.isAdhika = true; // Only Adhika months
  } else if (!event.includeAdhika) {
    where.isAdhika = false; // Only regular months (default)
  }
  // If includeAdhika=true, don't filter isAdhika

  // Fetch daily lunar info from database (with end times)
  const dailyData = await prisma.dailyInfo.findMany({
    where,
    orderBy: {
      date: "asc",
    },
    select: {
      date: true,
      tithiEndTime: true,
      maas: true,
      isAdhika: true,
    },
  });

  // Build maas filter: ruleConfig.maas (array or single) takes priority over event.maas
  const rcMaas = (event.ruleConfig as Record<string, unknown>)?.maas;
  const maasValues: string[] | null = Array.isArray(rcMaas)
    ? (rcMaas as string[])
    : rcMaas
      ? [rcMaas as string]
      : event.maas
        ? [event.maas]
        : null;
  const isMultiMaas = maasValues !== null && maasValues.length > 1;

  // Select the first matching day per year (or per year+maas for multi-maas events)
  const selectedByYear = selectFirstPerYear(dailyData, maasValues, isMultiMaas);

  // Kshaya tithi fallback: a kshaya tithi never occurs at sunrise, so the standard
  // query above misses it. Detect it by finding days where the predecessor tithi
  // ends AFTER sunrise — the kshaya tithi then starts on that same calendar day.
  const coveredKeys = new Set(
    selectedByYear.map((d) => {
      const year = d.date.getUTCFullYear();
      return isMultiMaas && d.maas ? `${year}-${d.maas}` : String(year);
    })
  );

  const kshayaExtras: Array<{
    date: Date;
    tithiEndTime: string | null;
    maas: string | null;
    isAdhika: boolean;
  }> = [];

  const predecessorTithi = TITHI_PREDECESSOR[event.tithi];
  if (predecessorTithi) {
    const kshayaWhere: Record<string, unknown> = {
      date: { gte: startDate, lte: endDate },
      tithi: predecessorTithi,
    };
    if (event.isAdhikaOnly) {
      kshayaWhere.isAdhika = true;
    } else if (!event.includeAdhika) {
      kshayaWhere.isAdhika = false;
    }

    const kshayaCandidates = await prisma.dailyInfo.findMany({
      where: kshayaWhere as never,
      select: {
        date: true,
        tithiEndTime: true,
        sunrise: true,
        maas: true,
        isAdhika: true,
      },
      orderBy: { date: "asc" },
    });

    const kshayaNextDay =
      (event.ruleConfig as Record<string, unknown>)?.kshayaNextDay === true;

    for (const day of kshayaCandidates) {
      if (maasValues && (!day.maas || !maasValues.includes(day.maas))) continue;
      if (
        !isPredecessorEndsAfterSunrise({
          tithiEndTime: day.tithiEndTime,
          sunrise: day.sunrise,
        })
      )
        continue;

      const year = day.date.getUTCFullYear();
      const key = isMultiMaas && day.maas ? `${year}-${day.maas}` : String(year);
      if (coveredKeys.has(key)) continue;

      // kshayaNextDay: place the occurrence on the following calendar day.
      // For series child events (e.g. Maa Siddhidatri = Day 9 of Navratri)
      // this ensures every festival day maps to a distinct calendar date.
      const occDate = kshayaNextDay
        ? new Date(day.date.getTime() + 24 * 60 * 60 * 1000)
        : day.date;

      kshayaExtras.push({
        date: occDate,
        tithiEndTime: null,
        maas: day.maas,
        isAdhika: day.isAdhika,
      });
      coveredKeys.add(key);
    }
  }

  // Read optional durationDays from ruleConfig (e.g., multi-day festivals)
  const durationDays =
    typeof (event.ruleConfig as Record<string, unknown>)?.durationDays === "number"
      ? ((event.ruleConfig as Record<string, unknown>).durationDays as number)
      : 1;

  const rawSelectedDays = [...selectedByYear, ...kshayaExtras].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  // Astronomical phase correction: for PURNIMA and AMAVASYA the sunrise-rule
  // tithi day can precede the true astronomical full/new moon by one calendar day.
  // Shift each occurrence to the peak-illumination day within the ±1 window.
  const targetPhase = PHASE_CORRECTION_TITHI[event.tithi];
  const selectedDays = targetPhase
    ? await correctToAstronomicalPhaseDay(rawSelectedDays, targetPhase)
    : rawSelectedDays;

  // Multi-day festivals use a fixed duration — no tithi-spanning detection needed
  if (durationDays > 1) {
    return selectedDays.map((day) => ({
      date: day.date,
      endDate: new Date(day.date.getTime() + (durationDays - 1) * 24 * 60 * 60 * 1000),
      startTime: undefined,
      endTime: day.tithiEndTime ?? undefined,
    }));
  }

  // Single-day VRAT events: detect if tithi started in the evening of the previous calendar day.
  // Timing matters for fasting (vasten): you need to know when to start/stop.
  // For non-vrat events (festivals, pujas, jayantis): keep the calendar day without times.
  if (event.eventType === EventType.VRAT) {
    const prevDayMap = await fetchPreviousDayData(selectedDays.map((d) => d.date));
    return selectedDays.map((day) => computeTithiOccurrence(day, day, prevDayMap));
  }

  return selectedDays.map((day) => ({ date: day.date }));
}

// =============================================================================
// NAKSHATRA RULE-BASED GENERATION
// =============================================================================

/**
 * Generate yearly occurrences based on nakshatra (lunar mansion).
 * Matches events to days when a specific nakshatra occurs, optionally within a specific maas.
 *
 * Example: Vaikasi Visakam — Vishakha nakshatra in Vaishakha maas.
 */
async function generateNakshatraRuleOccurrences(
  event: Event,
  startDate: Date,
  endDate: Date,
  _location: { name: string; lat: number; lon: number },
  _timezone: string
): Promise<GeneratedOccurrence[]> {
  const config = (event.ruleConfig as Record<string, unknown>) ?? {};
  const nakshatraValue = (config.nakshatra ?? event.nakshatra) as string | null;

  if (!nakshatraValue) {
    logWarn(`Nakshatra event "${event.name}" has no nakshatra specified`);
    return [];
  }

  const dailyData = await prisma.dailyInfo.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      nakshatra: nakshatraValue as never,
      isAdhika: false,
    },
    orderBy: { date: "asc" },
    select: { date: true, nakshatraEndTime: true, maas: true },
  });

  // Optional maas filter from ruleConfig
  const maasFilter = config.maas as string | undefined;

  // One occurrence per year (first matching day)
  const occurrencesByYear = new Map<number, (typeof dailyData)[0]>();

  for (const day of dailyData) {
    if (maasFilter && day.maas !== maasFilter) continue;
    const year = day.date.getUTCFullYear();
    if (!occurrencesByYear.has(year)) {
      occurrencesByYear.set(year, day);
    }
  }

  return Array.from(occurrencesByYear.values())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((day) => ({
      date: day.date,
      endTime: day.nakshatraEndTime ?? undefined,
    }));
}

// =============================================================================
// WEEKDAY + TITHI RULE-BASED GENERATION
// =============================================================================

/**
 * Generate occurrences for events that only occur when a specific tithi falls
 * on a specific weekday (e.g., Angaraki Sankashti = Krishna Chaturthi on Tuesday).
 *
 * Queries all matching tithi dates in the range, then filters by weekday.
 * ruleConfig must contain: { weekday: number } (0=Sunday … 6=Saturday, JS getUTCDay())
 *
 * Example: Angaraki Sankashti Chaturthi
 *   tithi: CHATURTHI_KRISHNA, ruleConfig: { weekday: 2 } → all Tuesdays with this tithi
 */
async function generateWeekdayTithiOccurrences(
  event: Event,
  startDate: Date,
  endDate: Date,
  _location: { name: string; lat: number; lon: number },
  _timezone: string
): Promise<GeneratedOccurrence[]> {
  if (!event.tithi) {
    logWarn(`WEEKDAY_TITHI event "${event.name}" has no tithi specified`);
    return [];
  }

  const config = (event.ruleConfig as Record<string, unknown>) ?? {};
  const weekday = config.weekday;

  if (typeof weekday !== "number") {
    logWarn(`WEEKDAY_TITHI event "${event.name}" missing numeric weekday in ruleConfig`);
    return [];
  }

  const dailyData = await prisma.dailyInfo.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      tithi: event.tithi,
      isAdhika: false,
    },
    orderBy: { date: "asc" },
    select: { date: true, tithiEndTime: true },
  });

  const matchingDays = dailyData.filter((day) => day.date.getUTCDay() === weekday);
  const prevDayMap = await fetchPreviousDayData(matchingDays.map((d) => d.date));
  return matchingDays.map((day) => computeTithiOccurrence(day, day, prevDayMap));
}

// =============================================================================
// YEARLY SOLAR RECURRENCE
// =============================================================================

/**
 * Generate yearly solar occurrences tied to a specific Sankranti.
 * Queries DailyInfo for days when the event's sankranti occurs within the range.
 * Returns one occurrence per year (the day the sun enters the specified sign).
 *
 * Example: MAKARA_SANKRANTI → every year when the sun enters Makara (Capricorn).
 * The startTime is set to the exact transit time (sankrantiTime) from DailyInfo.
 */
async function generateYearlySolarOccurrences(
  event: Event,
  startDate: Date,
  endDate: Date
): Promise<GeneratedOccurrence[]> {
  if (!event.sankranti) {
    logWarn(`YEARLY_SOLAR event "${event.name}" has no sankranti specified`);
    return [];
  }

  const validSankrantiValues = Object.values(Sankranti) as string[];
  if (!validSankrantiValues.includes(event.sankranti)) {
    logWarn(
      `YEARLY_SOLAR event "${event.name}" has invalid sankranti: "${event.sankranti}"`
    );
    return [];
  }

  const dailyData = await prisma.dailyInfo.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      sankranti: event.sankranti as Sankranti,
    },
    select: { date: true, sankrantiTime: true },
    orderBy: { date: "asc" },
  });

  return dailyData.map((day) => ({
    date: day.date,
    startTime: day.sankrantiTime ?? undefined,
  }));
}

// =============================================================================
// MONTHLY LUNAR RECURRENCE
// =============================================================================

/**
 * Generate monthly lunar occurrences (e.g., every Ekadashi = 24x per year).
 * Finds all matching tithis within the window.
 * Handles spanning tithis (tithi that spans multiple days).
 */
async function generateMonthlyLunarOccurrences(
  event: Event,
  startDate: Date,
  endDate: Date,
  _location: { name: string; lat: number; lon: number },
  _timezone: string
): Promise<GeneratedOccurrence[]> {
  if (!event.tithi) {
    logWarn(`Monthly lunar event "${event.name}" has no tithi specified`);
    return [];
  }

  // Fetch ALL dates matching the target tithi from database (with end times)
  const dailyData = await prisma.dailyInfo.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      tithi: event.tithi,
    },
    orderBy: { date: "asc" },
    select: { date: true, tithiEndTime: true },
  });

  // Batch-fetch previous day data to detect actual tithi start times
  const prevDayMap = await fetchPreviousDayData(dailyData.map((d) => d.date));

  // Group consecutive days into "tithi windows" (engine pure helper)
  // and emit one occurrence per window with real start/end times
  const windows = groupConsecutiveDays(dailyData);
  return windows.map(({ firstDay, lastDay }) =>
    computeTithiOccurrence(firstDay, lastDay, prevDayMap)
  );
}

// =============================================================================
// TITHI TIMING HELPERS
// =============================================================================

/**
 * Batch-fetch DailyInfo for the day BEFORE each provided date.
 * Returns a map: ISO string of current date → previous day's { tithiEndTime, sunrise }.
 *
 * Used to determine the actual start time of a tithi:
 * prevDay.tithiEndTime = moment the previous tithi ended = moment the current tithi began.
 */
async function fetchPreviousDayData(
  dates: Date[]
): Promise<Map<string, { tithiEndTime: string | null; sunrise: string | null }>> {
  if (dates.length === 0) return new Map();

  const prevDates = dates.map((d) => {
    const prev = new Date(d);
    prev.setUTCDate(prev.getUTCDate() - 1);
    return prev;
  });

  const rows = await prisma.dailyInfo.findMany({
    where: { date: { in: prevDates } },
    select: { date: true, tithiEndTime: true, sunrise: true },
  });

  // Key by the NEXT day (the original date) → prev day data
  const map = new Map<string, { tithiEndTime: string | null; sunrise: string | null }>();
  for (const row of rows) {
    const nextDay = new Date(row.date);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    map.set(nextDay.toISOString().split("T")[0]!, {
      tithiEndTime: row.tithiEndTime,
      sunrise: row.sunrise,
    });
  }

  return map;
}

// =============================================================================
// MONTHLY SOLAR RECURRENCE
// =============================================================================

/**
 * Generate monthly solar occurrences — fires on every Sankranti day (~12x per year).
 * A "solar month" begins when the sun transitions to a new sign (Sankranti).
 * This type is used for events that should be observed on every solar month boundary,
 * regardless of which specific Sankranti it is.
 *
 * Example: "Puja op elke Sankranti" → occurs ~12 times per year.
 */
async function generateMonthlySolarOccurrences(
  _event: Event,
  startDate: Date,
  endDate: Date
): Promise<GeneratedOccurrence[]> {
  const dailyData = await prisma.dailyInfo.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      sankranti: { not: null },
    },
    select: { date: true, sankranti: true, sankrantiTime: true },
    orderBy: { date: "asc" },
  });

  return dailyData.map((day) => ({
    date: day.date,
    startTime: day.sankrantiTime ?? undefined,
    notes: day.sankranti
      ? `${day.sankranti.replace(/_/g, " ").replace("SANKRANTI", "").trim()} Sankranti`
      : undefined,
  }));
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create an occurrence object from a date and event template.
 * Currently unused - kept for future development.
 */
// function createOccurrence(date: Date, _event: Event): GeneratedOccurrence {
//   return {
//     date,
//     // Note: startTime, endTime, endDate can be added if needed from event defaults
//   };
// }

// =============================================================================
// BATCH GENERATION UTILITIES
// =============================================================================

/**
 * Generate occurrences for multiple events in batch.
 * More efficient than calling generateOccurrences individually.
 */
export async function generateOccurrencesForEvents(
  events: Event[],
  options: RecurrenceOptions
): Promise<Map<string, GeneratedOccurrence[]>> {
  const results = new Map<string, GeneratedOccurrence[]>();

  for (const event of events) {
    try {
      const occurrences = await generateOccurrences(event, options);
      results.set(event.id, occurrences);
    } catch (error) {
      logWarn(`Failed to generate occurrences for "${event.name}": ${error}`);
      results.set(event.id, []);
    }
  }

  return results;
}

/**
 * Get recommended generation window for a recurrence type.
 * Returns sensible defaults for each recurrence pattern.
 */
export function getRecommendedWindow(recurrenceType: RecurrenceType): {
  yearsAhead: number;
  description: string;
} {
  switch (recurrenceType) {
    case "NONE":
      return { yearsAhead: 0, description: "No recurrence" };

    case "YEARLY_LUNAR":
    case "YEARLY_SOLAR":
      return { yearsAhead: 5, description: "5 years for yearly events" };

    case "MONTHLY_LUNAR":
    case "MONTHLY_SOLAR":
      return {
        yearsAhead: 2,
        description: "2 years for monthly events (24-48 occurrences)",
      };

    default:
      return { yearsAhead: 1, description: "1 year default" };
  }
}
