import "server-only";
import type { Event, RecurrenceType } from "@prisma/client";
import { DEFAULT_LOCATION } from "@/lib/domain";
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
// STRATEGY REGISTRIES
// =============================================================================

const RULE_STRATEGIES: Record<string, RecurrenceStrategy> = {
  SOLAR: generateSolarRuleOccurrences,
  TITHI: generateYearlyLunarOccurrences,
  NAKSHATRA: generateNakshatraRuleOccurrences,
  TITHI_NAKSHATRA: generateTithiNakshatraRuleOccurrences,
  WEEKDAY_TITHI: generateWeekdayTithiOccurrences,
  PRADOSH: generatePradoshOccurrences,
};

const RECURRENCE_STRATEGIES: Record<string, RecurrenceStrategy> = {
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

  if (event.recurrenceType === "NONE") {
    return [];
  }

  let occurrences: GeneratedOccurrence[] = [];

  // WEEKDAY_TITHI and PRADOSH take full precedence — both handle their own
  // frequency internally and must bypass the MONTHLY_LUNAR branch below.
  if (event.ruleType === "WEEKDAY_TITHI") {
    occurrences = await generateWeekdayTithiOccurrences(
      event,
      startDate,
      endDate,
      location,
      timezone
    );
  } else if (event.ruleType === "PRADOSH") {
    occurrences = await generatePradoshOccurrences(
      event,
      startDate,
      endDate,
      location,
      timezone
    );
  } else if (
    event.recurrenceType === "MONTHLY_LUNAR" ||
    event.recurrenceType === "MONTHLY_SOLAR"
  ) {
    const strategy = RECURRENCE_STRATEGIES[event.recurrenceType]!;
    occurrences = await strategy(event, startDate, endDate, location, timezone);
  } else if (event.ruleType) {
    const strategy = RULE_STRATEGIES[event.ruleType];
    if (!strategy) {
      logWarn(`Rule type ${event.ruleType} not yet implemented for event ${event.name}`);
      return [];
    }
    occurrences = await strategy(event, startDate, endDate, location, timezone);
  } else {
    const strategy = RECURRENCE_STRATEGIES[event.recurrenceType];
    if (!strategy) {
      logWarn(`Unknown recurrence type: ${event.recurrenceType}`);
      return [];
    }
    occurrences = await strategy(event, startDate, endDate, location, timezone);
  }

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
      startTime: occ.startTime ?? event.startTime ?? undefined,
      endTime: occ.endTime ?? event.endTime ?? undefined,
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
