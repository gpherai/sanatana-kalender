import "server-only";
import type { Event, RecurrenceType } from "@/generated/prisma/client";
import { dbTimeToStr } from "@/lib/timing-utils";
import { logDebug, logWarn } from "@/lib/utils";
import { applyDynamicTiming } from "./helpers";
import {
  generateSolarRuleOccurrences,
  generateYearlySolarOccurrences,
  generateMonthlySolarOccurrences,
} from "./solar";
import {
  generateNakshatraRuleOccurrences,
  generateTithiNakshatraRuleOccurrences,
} from "./nakshatra";
import { generateYearlyLunarOccurrences, generateMonthlyLunarOccurrences } from "./tithi";
import { generateWeekdayTithiOccurrences, generatePradoshOccurrences } from "./special";
import type { GeneratedOccurrence, RecurrenceOptions, RecurrenceStrategy } from "./types";

export type { GeneratedOccurrence, RecurrenceOptions };

// =============================================================================
// STRATEGY REGISTRY
// =============================================================================

// Keys are either ruleType or recurrenceType values — no overlap exists between
// the two sets, so a single table suffices. ruleType takes precedence: the
// dispatch resolves `event.ruleType ?? event.recurrenceType` as the lookup key.
const STRATEGIES: Record<string, RecurrenceStrategy> = {
  // by ruleType
  SOLAR: generateSolarRuleOccurrences,
  TITHI: generateYearlyLunarOccurrences,
  NAKSHATRA: generateNakshatraRuleOccurrences,
  TITHI_NAKSHATRA: generateTithiNakshatraRuleOccurrences,
  WEEKDAY_TITHI: generateWeekdayTithiOccurrences,
  PRADOSH: generatePradoshOccurrences,
  // by recurrenceType
  YEARLY_LUNAR: generateYearlyLunarOccurrences,
  YEARLY_SOLAR: generateYearlySolarOccurrences,
  MONTHLY_LUNAR: generateMonthlyLunarOccurrences,
  MONTHLY_SOLAR: generateMonthlySolarOccurrences,
};

// =============================================================================
// MAIN RECURRENCE ENGINE
// =============================================================================

const DEFAULT_MAX_OCCURRENCES = 1000;

export async function generateOccurrences(
  event: Event,
  options: RecurrenceOptions
): Promise<GeneratedOccurrence[]> {
  const { startDate, endDate, maxOccurrences = DEFAULT_MAX_OCCURRENCES } = options;

  logDebug(
    `Generating occurrences for "${event.name}" (${event.recurrenceType})`,
    `from ${startDate.toISOString().split("T")[0]} to ${endDate.toISOString().split("T")[0]}`
  );

  if (event.recurrenceType === "NONE") {
    return [];
  }

  let occurrences: GeneratedOccurrence[] = [];

  // ruleType "TITHI" is generic (date calculation only) and is used by both yearly
  // and monthly events. When recurrenceType is MONTHLY_*, the monthly generator must
  // win. Other ruleTypes (WEEKDAY_TITHI, PRADOSH, SOLAR, …) have dedicated generators
  // and always take precedence.
  const strategyKey =
    event.ruleType === "TITHI" &&
    (event.recurrenceType === "MONTHLY_LUNAR" || event.recurrenceType === "MONTHLY_SOLAR")
      ? event.recurrenceType
      : (event.ruleType ?? event.recurrenceType);
  const strategy = STRATEGIES[strategyKey];
  if (!strategy) {
    logWarn(
      `No strategy for "${event.name}" (ruleType=${event.ruleType ?? "—"}, recurrenceType=${event.recurrenceType})`
    );
    return [];
  }
  occurrences = await strategy(event, startDate, endDate);

  if (occurrences.length > maxOccurrences) {
    logWarn(
      `Generated ${occurrences.length} occurrences for "${event.name}", limiting to ${maxOccurrences}`
    );
    occurrences = occurrences.slice(0, maxOccurrences);
  }

  if (event.timingType) {
    occurrences = await applyDynamicTiming(occurrences, event.timingType);
  } else if (event.startTime || event.endTime) {
    occurrences = occurrences.map((occ) => ({
      ...occ,
      startTime: occ.startTime ?? dbTimeToStr(event.startTime) ?? undefined,
      endTime: occ.endTime ?? dbTimeToStr(event.endTime) ?? undefined,
    }));
  }

  logDebug(`Generated ${occurrences.length} occurrences for "${event.name}"`);

  return occurrences;
}

// =============================================================================
// BATCH GENERATION UTILITIES
// =============================================================================

const GENERATION_CONCURRENCY = 5;

export async function generateOccurrencesForEvents(
  events: Event[],
  options: RecurrenceOptions
): Promise<{ results: Map<string, GeneratedOccurrence[]>; failedCount: number }> {
  const results = new Map<string, GeneratedOccurrence[]>();
  let failedCount = 0;

  for (let i = 0; i < events.length; i += GENERATION_CONCURRENCY) {
    const chunk = events.slice(i, i + GENERATION_CONCURRENCY);

    await Promise.all(
      chunk.map(async (event) => {
        try {
          const occurrences = await generateOccurrences(event, options);
          results.set(event.id, occurrences);
        } catch (error) {
          logWarn(`Failed to generate occurrences for "${event.name}": ${error}`);
          failedCount++;
        }
      })
    );
  }

  return { results, failedCount };
}

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
