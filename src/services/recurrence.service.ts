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

import type { Event, RecurrenceType } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { DEFAULT_LOCATION } from "@/lib/constants";
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

  // NEW: Rule-based generation (takes precedence over recurrenceType)
  if (event.ruleType) {
    switch (event.ruleType) {
      case "SOLAR":
        occurrences = await generateSolarRuleOccurrences(event, startDate, endDate);
        break;
      case "TITHI":
        // TITHI rules use the existing YEARLY_LUNAR logic
        occurrences = await generateYearlyLunarOccurrences(
          event,
          startDate,
          endDate,
          location,
          timezone
        );
        break;
      default:
        logWarn(`Rule type ${event.ruleType} not yet implemented for event ${event.name}`);
        return [];
    }
  } else {
    // Fallback to recurrenceType logic
    switch (event.recurrenceType) {
    case "YEARLY_LUNAR":
      occurrences = await generateYearlyLunarOccurrences(
        event,
        startDate,
        endDate,
        location,
        timezone
      );
      break;

    case "YEARLY_SOLAR":
      occurrences = generateYearlySolarOccurrences(event);
      break;

    case "MONTHLY_LUNAR":
      occurrences = await generateMonthlyLunarOccurrences(
        event,
        startDate,
        endDate,
        location,
        timezone
      );
      break;

    case "MONTHLY_SOLAR":
      occurrences = generateMonthlySolarOccurrences(event);
      break;

    default:
      logWarn(`Unknown recurrence type: ${event.recurrenceType}`);
      return [];
    }
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
    (event.ruleConfig as any)?.sankranti ||
    event.sankranti;

  if (!sankrantiName) {
    logWarn(`SOLAR rule for event "${event.name}" has no sankranti specified`);
    return [];
  }

  // Query DailyInfo for days when this Sankranti occurs
  const dailyData = await prisma.dailyInfo.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
      sankranti: sankrantiName,
    },
    select: {
      date: true,
      sankrantiTime: true,
    },
    orderBy: {
      date: 'asc',
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
  const where: any = {
    date: {
      gte: startDate,
      lte: endDate,
    },
    tithi: event.tithi,
  };

  // Handle Adhika matching
  if (event.isAdhikaOnly) {
    where.isAdhika = true;  // Only Adhika months
  } else if (!event.includeAdhika) {
    where.isAdhika = false;  // Only regular months (default)
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

  // For yearly events, we want roughly one per year
  // Group by year and take the closest match to the original pattern
  const occurrencesByYear = new Map<number, typeof dailyData[0]>();

  for (const day of dailyData) {
    const year = day.date.getUTCFullYear();

    // If maas is specified, ONLY match days in that maas
    if (event.maas && day.maas !== event.maas) {
      continue; // Skip days not in the specified maas
    }

    if (!occurrencesByYear.has(year)) {
      occurrencesByYear.set(year, day);
    } else {
      // If multiple matches in same year, take the first one (they're all in correct maas)
      // Could add additional logic here (e.g., prefer certain pakshas)
    }
  }

  // Convert to occurrences with end times
  return Array.from(occurrencesByYear.values())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((day) => ({
      date: day.date,
      startTime: undefined,
      endTime: day.tithiEndTime ?? undefined,
    }));
}

// =============================================================================
// YEARLY SOLAR RECURRENCE
// =============================================================================

/**
 * Generate yearly solar occurrences (e.g., every March 14).
 * Uses the first occurrence date as template and repeats annually.
 */
function generateYearlySolarOccurrences(event: Event): GeneratedOccurrence[] {
  // We need a reference date - this would come from the first manually created occurrence
  // For now, we'll skip solar recurrence as it requires a seed date
  // This will be handled by the seed script providing the first occurrence
  logDebug(`Yearly solar recurrence requires manual seed occurrence for "${event.name}"`);
  return [];
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
      const isPrevConsecutive = prev && isConsecutiveDay(new Date(prev.date), currentDate);

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
 * Check if two dates are consecutive (day2 is day after day1)
 */
function isConsecutiveDay(day1: Date, day2: Date): boolean {
  const nextDay = new Date(day1);
  nextDay.setDate(nextDay.getDate() + 1);
  return nextDay.toDateString() === day2.toDateString();
}

// =============================================================================
// MONTHLY SOLAR RECURRENCE
// =============================================================================

/**
 * Generate monthly solar occurrences (e.g., 15th of every month).
 * Uses day-of-month from reference date.
 */
function generateMonthlySolarOccurrences(event: Event): GeneratedOccurrence[] {
  // Would need a reference date - skip for now
  logDebug(`Monthly solar recurrence requires manual seed occurrence for "${event.name}"`);
  return [];
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
      return { yearsAhead: 2, description: "2 years for monthly events (24-48 occurrences)" };

    default:
      return { yearsAhead: 1, description: "1 year default" };
  }
}
