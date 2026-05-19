import "server-only";
import type { Event } from "@prisma/client";
import { Tithi } from "@prisma/client";
import {
  asRuleConfig,
  type WeekdayTithiRuleConfig,
  type PradoshRuleConfig,
} from "@/config/rule-config.types";
import {
  findDailyInfoTithiTimingCandidates,
  findDailyInfoPradoshCandidates,
} from "@/repositories/daily-info.repository";
import { computeTithiOccurrence } from "@/engine";
import { parseTimeToMinutes } from "@/lib/timing-utils";
import { logWarn } from "@/lib/utils";
import { fetchPreviousDayData } from "./helpers";
import type { GeneratedOccurrence } from "./types";

// =============================================================================
// WEEKDAY + TITHI RULE-BASED GENERATION
// =============================================================================

export async function generateWeekdayTithiOccurrences(
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

  const config = asRuleConfig<WeekdayTithiRuleConfig>(event.ruleConfig);
  const weekday = config.weekday;

  if (weekday === undefined) {
    logWarn(`WEEKDAY_TITHI event "${event.name}" missing numeric weekday in ruleConfig`);
    return [];
  }

  const dailyData = await findDailyInfoTithiTimingCandidates(
    { startDate, endDate },
    event.tithi,
    { excludeAdhika: true }
  );

  // Fetch prevDay data for ALL tithi days before filtering by weekday.
  // computeTithiOccurrence may shift the effective date back one day when the
  // tithi started after sunrise (spanning-tithi case). Must apply that shift
  // first, then check the weekday on the resulting occurrence date.
  const prevDayMap = await fetchPreviousDayData(dailyData.map((d) => d.date));
  return dailyData
    .map((day) => computeTithiOccurrence(day, day, prevDayMap))
    .filter((occ) => occ.date.getUTCDay() === weekday);
}

// =============================================================================
// PRADOSH RULE-BASED GENERATION
// =============================================================================

export async function generatePradoshOccurrences(
  event: Event,
  startDate: Date,
  endDate: Date,
  _location: { name: string; lat: number; lon: number },
  _timezone: string
): Promise<GeneratedOccurrence[]> {
  const config = asRuleConfig<PradoshRuleConfig>(event.ruleConfig);
  const paksha = config.paksha;
  const weekday = config.weekday;

  if (weekday === undefined) {
    logWarn(`PRADOSH event "${event.name}" missing numeric weekday in ruleConfig`);
    return [];
  }

  const pakshaList: Array<"SHUKLA" | "KRISHNA"> =
    paksha === "SHUKLA"
      ? ["SHUKLA"]
      : paksha === "KRISHNA"
        ? ["KRISHNA"]
        : ["SHUKLA", "KRISHNA"];

  const trayodashiTithis: Tithi[] = pakshaList.map((p) =>
    p === "SHUKLA" ? "TRAYODASHI_SHUKLA" : "TRAYODASHI_KRISHNA"
  );
  const dwadasiTithis: Tithi[] = pakshaList.map((p) =>
    p === "SHUKLA" ? "DWADASHI_SHUKLA" : "DWADASHI_KRISHNA"
  );

  // Case 1: Trayodashi is the udaya tithi
  const trayodashiDays = await findDailyInfoPradoshCandidates(
    { startDate, endDate },
    trayodashiTithis
  );

  // Case 2: Dwadashi is the udaya tithi (catches kshaya Trayodashi and early-start cases)
  const dwadasiDays = await findDailyInfoPradoshCandidates(
    { startDate, endDate },
    dwadasiTithis
  );

  const validDates = new Map<string, Date>();

  const trayodashiDateSet = new Set(
    trayodashiDays.map((d) => d.date.toISOString().split("T")[0]!)
  );

  // ── STEP 1: Case 2 (Dwadashi udaya, higher priority) ──────────────────────
  for (const day of dwadasiDays) {
    if (!day.sunset || !day.tithiEndTime) continue;

    const tithiEndMin = parseTimeToMinutes(day.tithiEndTime);
    const sunriseMin = parseTimeToMinutes(day.sunrise);
    const sunsetMin = parseTimeToMinutes(day.sunset);

    if (tithiEndMin === null || sunsetMin === null) continue;

    // Skip if tithiEndTime is a next-day time (tithiEndTime < sunrise)
    if (sunriseMin !== null && tithiEndMin < sunriseMin) continue;

    if (tithiEndMin < sunsetMin + 45) {
      validDates.set(day.date.toISOString().split("T")[0]!, day.date);
    }
  }

  // ── STEP 2: Case 1 (Trayodashi udaya) ─────────────────────────────────────
  for (const day of trayodashiDays) {
    if (!day.sunset) continue;

    const tithiEndMin = parseTimeToMinutes(day.tithiEndTime);
    const sunriseMin = parseTimeToMinutes(day.sunrise);
    const sunsetMin = parseTimeToMinutes(day.sunset);

    if (sunsetMin === null) continue;

    const iso = day.date.toISOString().split("T")[0]!;

    const prevDay = new Date(day.date);
    prevDay.setUTCDate(prevDay.getUTCDate() - 1);
    if (validDates.has(prevDay.toISOString().split("T")[0]!)) continue;

    const nextDay = new Date(day.date);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    const isVriddhi = trayodashiDateSet.has(nextDay.toISOString().split("T")[0]!);

    const pradoshStartMin = sunsetMin - 90;
    const isValid =
      day.tithiEndTime === null ||
      isVriddhi ||
      (sunriseMin !== null && tithiEndMin !== null && tithiEndMin < sunriseMin) ||
      (tithiEndMin !== null && tithiEndMin >= pradoshStartMin);

    if (isValid) {
      validDates.set(iso, day.date);
    }
  }

  return Array.from(validDates.values())
    .sort((a, b) => a.getTime() - b.getTime())
    .filter((date) => date.getUTCDay() === weekday)
    .map((date) => ({ date }));
}
