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

import type { Event, RecurrenceType } from "@prisma/client";
import { Sankranti } from "@prisma/client";
import { prisma } from "@/lib/db";
import { DEFAULT_LOCATION } from "@/lib/domain";
import { logDebug, logWarn } from "@/lib/utils";
import { formatDateNL } from "@/lib/date-utils";

// =============================================================================
// TYPES
// =============================================================================

/**
 * Generated occurrence data (ready for database insertion)
 */
export interface GeneratedOccurrence {
  date: Date;
  endDate?: Date;
  startTime?: string;
  endTime?: string;
  notes?: string;
}

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

  // Monthly recurrence takes priority over ruleType-based dispatch.
  // This allows catalog events (which have a ruleType) to still be monthly.
  if (
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

  logDebug(`Generated ${occurrences.length} occurrences for "${event.name}"`);

  return occurrences;
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

  // For yearly events, group by year (or year+maas for multi-maas events like Navadurga)
  const occurrencesByKey = new Map<string, (typeof dailyData)[0]>();

  for (const day of dailyData) {
    const year = day.date.getUTCFullYear();

    // If maas filter is active, skip non-matching months
    if (maasValues && (!day.maas || !maasValues.includes(day.maas))) {
      continue;
    }

    // Multi-maas events get one occurrence per maas per year (e.g. Navadurga in Chaitra + Ashwin)
    const key = isMultiMaas && day.maas ? `${year}-${day.maas}` : String(year);

    if (!occurrencesByKey.has(key)) {
      occurrencesByKey.set(key, day);
    }
  }

  // Read optional durationDays from ruleConfig (e.g., multi-day festivals)
  const durationDays =
    typeof (event.ruleConfig as Record<string, unknown>)?.durationDays === "number"
      ? ((event.ruleConfig as Record<string, unknown>).durationDays as number)
      : 1;

  // Convert to occurrences with end times
  return Array.from(occurrencesByKey.values())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((day) => {
      const endDate =
        durationDays > 1
          ? new Date(day.date.getTime() + (durationDays - 1) * 24 * 60 * 60 * 1000)
          : undefined;
      return {
        date: day.date,
        endDate,
        startTime: undefined,
        endTime: day.tithiEndTime ?? undefined,
      };
    });
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
      date: {
        gte: startDate,
        lte: endDate,
      },
      tithi: event.tithi,
    },
    orderBy: {
      date: "asc",
    },
    select: {
      date: true,
      tithiEndTime: true,
    },
  });

  // Process dailyData to detect spanning tithis
  const occurrences: GeneratedOccurrence[] = [];

  for (let i = 0; i < dailyData.length; i++) {
    const current = dailyData[i]!;
    const next = dailyData[i + 1];

    // Check if this is part of a spanning tithi (next day is consecutive)
    const currentDate = new Date(current.date);
    const isSpanning = next && isConsecutiveDay(currentDate, new Date(next.date));

    if (isSpanning) {
      // This is the FIRST day of a spanning tithi
      occurrences.push({
        date: current.date,
        startTime: "00:00", // Could calculate from previous tithi end
        endTime: "23:59", // Continues into next day
        notes: `Begint op deze dag, loopt door tot ${formatDateNL(next.date)}`,
      });
    } else {
      // Check if this is the SECOND day of a spanning tithi
      const prev = dailyData[i - 1];
      const isPrevConsecutive =
        prev && isConsecutiveDay(new Date(prev.date), currentDate);

      if (isPrevConsecutive) {
        // This is the LAST day of a spanning tithi
        occurrences.push({
          date: current.date,
          startTime: "00:00", // Continues from previous day
          endTime: current.tithiEndTime ?? undefined,
          notes: `Eindigt om ${current.tithiEndTime || "onbekende tijd"}`,
        });
      } else {
        // Single-day occurrence
        occurrences.push({
          date: current.date,
          startTime: undefined,
          endTime: current.tithiEndTime ?? undefined,
        });
      }
    }
  }

  return occurrences;
}

/**
 * Check if two dates are consecutive (day2 is day after day1).
 * Uses UTC date components to avoid locale-dependent behavior.
 */
function isConsecutiveDay(day1: Date, day2: Date): boolean {
  const y1 = day1.getUTCFullYear();
  const m1 = day1.getUTCMonth();
  const d1 = day1.getUTCDate();
  const y2 = day2.getUTCFullYear();
  const m2 = day2.getUTCMonth();
  const d2 = day2.getUTCDate();
  const nextDay = new Date(Date.UTC(y1, m1, d1 + 1));
  return (
    nextDay.getUTCFullYear() === y2 &&
    nextDay.getUTCMonth() === m2 &&
    nextDay.getUTCDate() === d2
  );
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
