import "server-only";
import type { Event } from "@prisma/client";
import { Sankranti } from "@prisma/client";
import { asRuleConfig, type SolarRuleConfig } from "@/config/rule-config.types";
import {
  findDailyInfoSankrantiOccurrences,
  findDailyInfoAllSankrantiOccurrences,
} from "@/repositories/daily-info.repository";
import { parseTimeToMinutes } from "@/lib/timing-utils";
import { logWarn } from "@/lib/utils";
import type { GeneratedOccurrence } from "./types";

/**
 * Sankranti before sunrise or after sunset → Punya Kaal shifts to the next day.
 * DP rule: transit outside the solar day (sunrise..sunset) → observe D+1.
 */
function resolveSankrantiDate(day: {
  date: Date;
  sankrantiTime: string | null;
  sunrise: string | null;
  sunset: string | null;
}): Date {
  if (!day.sankrantiTime || !day.sunrise || !day.sunset) return day.date;
  const st = parseTimeToMinutes(day.sankrantiTime);
  const sr = parseTimeToMinutes(day.sunrise);
  const ss = parseTimeToMinutes(day.sunset);
  if (st === null || sr === null || ss === null) return day.date;
  if (st < sr || st > ss) {
    const next = new Date(day.date);
    next.setUTCDate(next.getUTCDate() + 1);
    return next;
  }
  return day.date;
}

// =============================================================================
// SOLAR RULE-BASED GENERATION
// =============================================================================

export async function generateSolarRuleOccurrences(
  event: Event,
  startDate: Date,
  endDate: Date
): Promise<GeneratedOccurrence[]> {
  const config = asRuleConfig<SolarRuleConfig>(event.ruleConfig);
  const sankrantiName = config.sankranti || event.sankranti;

  if (!sankrantiName) {
    logWarn(`SOLAR rule for event "${event.name}" has no sankranti specified`);
    return [];
  }

  const validSankrantiValues = Object.values(Sankranti) as string[];
  if (!validSankrantiValues.includes(String(sankrantiName))) {
    logWarn(
      `SOLAR rule for event "${event.name}" has invalid sankranti value: "${sankrantiName}"`
    );
    return [];
  }

  const dailyData = await findDailyInfoSankrantiOccurrences(
    { startDate, endDate },
    sankrantiName as Sankranti
  );

  return dailyData.map((day) => ({
    date: resolveSankrantiDate(day),
    startTime: day.sankrantiTime ?? undefined,
  }));
}

// =============================================================================
// YEARLY SOLAR RECURRENCE
// =============================================================================

export async function generateYearlySolarOccurrences(
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

  const dailyData = await findDailyInfoSankrantiOccurrences(
    { startDate, endDate },
    event.sankranti as Sankranti
  );

  return dailyData.map((day) => ({
    date: resolveSankrantiDate(day),
    startTime: day.sankrantiTime ?? undefined,
  }));
}

// =============================================================================
// MONTHLY SOLAR RECURRENCE
// =============================================================================

export async function generateMonthlySolarOccurrences(
  _event: Event,
  startDate: Date,
  endDate: Date
): Promise<GeneratedOccurrence[]> {
  const dailyData = await findDailyInfoAllSankrantiOccurrences({ startDate, endDate });

  return dailyData.map((day) => ({
    date: resolveSankrantiDate(day),
    startTime: day.sankrantiTime ?? undefined,
    notes: day.sankranti
      ? `${day.sankranti.replace(/_/g, " ").replace("SANKRANTI", "").trim()} Sankranti`
      : undefined,
  }));
}
