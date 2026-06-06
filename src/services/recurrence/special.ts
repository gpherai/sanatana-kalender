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
import {
  PRADOSH_DISPLAY_AFTER_SUNSET_MIN,
  PRADOSH_START_BEFORE_SUNSET_MIN,
  PRADOSH_CUSTOM_SUNRISE_SKIP_MIN,
} from "@/lib/panchanga-timing-constants";
import { logWarn } from "@/lib/utils";
import { fetchPreviousDayData, getAdhikaFilter } from "./helpers";
import type { GeneratedOccurrence } from "./types";

// =============================================================================
// WEEKDAY + TITHI RULE-BASED GENERATION
// =============================================================================

export async function generateWeekdayTithiOccurrences(
  event: Event,
  startDate: Date,
  endDate: Date
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

  // Honor the event's adhika flags instead of hard-coding exclude. The
  // weekday-tithi repo path only supports exclude vs. include-both (not
  // "only-adhika"); warn if that unsupported case is configured.
  const adhikaFilter = getAdhikaFilter(event);
  if (adhikaFilter === "only") {
    logWarn(
      `WEEKDAY_TITHI event "${event.name}" sets isAdhikaOnly, which the weekday-tithi ` +
        "path cannot express; treating as include (both nija + adhika)."
    );
  }
  const dailyData = await findDailyInfoTithiTimingCandidates(
    { startDate, endDate },
    event.tithi,
    { excludeAdhika: adhikaFilter === "exclude" }
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
  endDate: Date
): Promise<GeneratedOccurrence[]> {
  const config = asRuleConfig<PradoshRuleConfig>(event.ruleConfig);
  const paksha = config.paksha;
  const weekday = config.weekday;
  const maasFilter = config.maas ? [config.maas] : undefined;

  // If explicit tithi/prevTithi are set, use them directly (e.g. Parashurama Jayanti).
  // Otherwise derive TRAYODASHI/DWADASHI from paksha (standard Pradosh Vrat).
  let targetTithis: Tithi[];
  let prevTithis: Tithi[];

  if (config.tithi && config.prevTithi) {
    targetTithis = [config.tithi];
    prevTithis = [config.prevTithi];
  } else {
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
    targetTithis = pakshaList.map((p) =>
      p === "SHUKLA" ? "TRAYODASHI_SHUKLA" : "TRAYODASHI_KRISHNA"
    );
    prevTithis = pakshaList.map((p) =>
      p === "SHUKLA" ? "DWADASHI_SHUKLA" : "DWADASHI_KRISHNA"
    );
  }

  // Case 1: target tithi is the udaya tithi
  const targetDays = await findDailyInfoPradoshCandidates(
    { startDate, endDate },
    targetTithis,
    { maas: maasFilter }
  );

  // Case 2: prev tithi is the udaya tithi (catches kshaya target and early-start cases)
  const prevDays = await findDailyInfoPradoshCandidates(
    { startDate, endDate },
    prevTithis,
    { maas: maasFilter }
  );

  const validDates = new Map<string, Date>();

  const targetDateSet = new Set(
    targetDays.map((d) => d.date.toISOString().split("T")[0]!)
  );
  const targetDayMap = new Map(
    targetDays.map((d) => [d.date.toISOString().split("T")[0]!, d])
  );
  const prevDateSet = new Set(prevDays.map((d) => d.date.toISOString().split("T")[0]!));
  const isCustomTithi = !!(config.tithi && config.prevTithi);

  // ── STEP 1: Case 2 (prev tithi udaya, higher priority) ────────────────────
  for (const day of prevDays) {
    if (!day.sunset || !day.tithiEndTime) continue;

    const tithiEndMin = parseTimeToMinutes(day.tithiEndTime);
    const sunriseMin = parseTimeToMinutes(day.sunrise);
    const sunsetMin = parseTimeToMinutes(day.sunset);

    if (tithiEndMin === null || sunsetMin === null) continue;

    // Vriddhi prev-tithi: when it spans two sunrises, skip the first day —
    // target tithi only starts on the second day, so the Pradosh window is there.
    const nextDay = new Date(day.date);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    if (prevDateSet.has(nextDay.toISOString().split("T")[0]!)) continue;

    if (isCustomTithi) {
      // Custom tithi mode (e.g. Parashurama Jayanti): target must START at or before
      // sunset to cover Pradosh Kaal. Only skip if tithiEndTime is clearly a next-day
      // time (>60 min before sunrise) — handles kshaya edge cases where prev tithi
      // ends right at sunrise.
      if (
        sunriseMin !== null &&
        tithiEndMin < sunriseMin - PRADOSH_CUSTOM_SUNRISE_SKIP_MIN
      )
        continue;
      if (tithiEndMin <= sunsetMin) {
        validDates.set(day.date.toISOString().split("T")[0]!, day.date);
      }
    } else {
      // Standard Pradosh Vrat — selection based on how late Trayodashi starts after D-1 sunset:
      //
      // A) Before D-1 sunset (tithiEnd < sunsetMin): D-1 always wins.
      //
      // B) 0–90 min after D-1 sunset: D-1 wins unless D has Trayodashi AT/AFTER its sunset.
      //
      // C) 90–144 min after D-1 sunset (late in D-1 Pradosh): D-1 wins only if D has no
      //    Trayodashi even at pradoshStart (sunset_D − 90). When D extends into its
      //    Pradosh window, Case 1 handles D.
      //
      // D) > 144 min after D-1 sunset (D-1 Pradosh window is entirely Dwadashi): always
      //    use D. Fallback to D-1 only if D is not in targetDays (kshaya).
      if (sunriseMin !== null && tithiEndMin < sunriseMin) continue;
      const diff = tithiEndMin - sunsetMin;
      let addDMinus1 = diff < 0; // Sub-case A
      if (!addDMinus1) {
        const nextDayDate = new Date(day.date);
        nextDayDate.setUTCDate(nextDayDate.getUTCDate() + 1);
        const nextDayIso = nextDayDate.toISOString().split("T")[0]!;
        const targetNextDay = targetDayMap.get(nextDayIso);
        if (diff > PRADOSH_DISPLAY_AFTER_SUNSET_MIN) {
          // Sub-case D: D-1 Pradosh has no Trayodashi → use D (kshaya fallback if no D)
          addDMinus1 = !targetNextDay;
        } else if (!targetNextDay) {
          addDMinus1 = true; // kshaya: no D → D-1
        } else {
          const nextTithiEnd = parseTimeToMinutes(targetNextDay.tithiEndTime);
          const nextSunrise = parseTimeToMinutes(targetNextDay.sunrise);
          const nextSunset = parseTimeToMinutes(targetNextDay.sunset);
          if (nextTithiEnd === null || nextSunset === null) {
            addDMinus1 = true;
          } else if (nextSunrise !== null && nextTithiEnd < nextSunrise) {
            // Next-day overflow: Trayodashi spans full night → D is valid
            addDMinus1 = false;
          } else if (diff <= PRADOSH_START_BEFORE_SUNSET_MIN) {
            // Sub-case B: D-1 early entry → D needs Trayodashi at/after its sunset
            addDMinus1 = nextTithiEnd < nextSunset;
          } else {
            // Sub-case C: D-1 late entry → D needs Trayodashi at/after its pradoshStart
            addDMinus1 = nextTithiEnd < nextSunset - PRADOSH_START_BEFORE_SUNSET_MIN;
          }
        }
      }
      if (addDMinus1) {
        validDates.set(day.date.toISOString().split("T")[0]!, day.date);
      }
    }
  }

  // ── STEP 2: Case 1 (target tithi udaya) ───────────────────────────────────
  for (const day of targetDays) {
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
    const isVriddhi = targetDateSet.has(nextDay.toISOString().split("T")[0]!);

    const pradoshStartMin = sunsetMin - PRADOSH_START_BEFORE_SUNSET_MIN;
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
    .filter((date) => weekday === undefined || date.getUTCDay() === weekday)
    .map((date) => ({ date }));
}
