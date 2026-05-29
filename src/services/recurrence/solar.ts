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
 * Resolves the Sankranti observance date from a daily_info row.
 *
 * The detectSankranti scan window runs from sunrise(D) to sunrise(D)+24h, so
 * a transit time before local sunrise means the transit is on Gregorian day D+1
 * (early morning). Whether to observe on D or D+1 depends on whether that early-
 * morning transit is before or after sunrise in India (per Drik Panchang):
 *   - transit >= 02:30 local AND < local sunrise → transit is after India's sunrise
 *     (IST ≈ local + 3.5-4.5h; India SR ≈ 02:00-02:30 local) → observe D+1
 *   - transit < 02:30 local → before India sunrise → Hindu day = row date → observe D
 *
 * After-sunset transits belong to the same Hindu day (no D+1), EXCEPT for
 * Makara Sankranti (Uttarayana), which is traditionally observed the next morning.
 */
function resolveSankrantiDate(day: {
  date: Date;
  sankranti: string | null;
  sankrantiTime: string | null;
  sunrise: string | null;
  sunset: string | null;
}): Date {
  if (!day.sankrantiTime || !day.sunrise || !day.sunset) return day.date;
  const st = parseTimeToMinutes(day.sankrantiTime);
  const sr = parseTimeToMinutes(day.sunrise);
  const ss = parseTimeToMinutes(day.sunset);
  if (st === null || sr === null || ss === null) return day.date;

  const nextDay = () => {
    const d = new Date(day.date);
    d.setUTCDate(d.getUTCDate() + 1);
    return d;
  };

  // Transit is in early morning of the NEXT Gregorian day (stored in this row's scan window).
  // D+1 only when transit >= 02:30 local, which corresponds to post-India-sunrise per DP.
  if (st < sr) {
    const INDIA_SR_LOCAL_MIN = 150; // 02:30 = approx India sunrise in local Den Haag time
    return st >= INDIA_SR_LOCAL_MIN ? nextDay() : day.date;
  }

  // Transit after sunset: same Hindu day → observe D.
  // Exception: Makara Sankranti (Uttarayana) is observed next morning when transit is evening/night.
  if (st > ss && day.sankranti === "MAKARA_SANKRANTI") {
    return nextDay();
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
