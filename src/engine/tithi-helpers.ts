/**
 * Pure helper functions for tithi-based occurrence computation.
 *
 * All functions are free of DB access and side effects — they operate only on
 * data passed in as arguments. This makes them fully unit-testable.
 *
 * Used by: src/services/recurrence/
 */

import {
  parseTimeToMinutes,
  formatMinutesToTime,
  calculateNishitaKaal,
} from "@/lib/timing-utils";
import type { GeneratedOccurrence, PrevDayInfo } from "./types";

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

/**
 * Returns true when day2 is exactly one calendar day after day1 (UTC).
 */
export function isConsecutiveDay(day1: Date, day2: Date): boolean {
  const next = new Date(
    Date.UTC(day1.getUTCFullYear(), day1.getUTCMonth(), day1.getUTCDate() + 1)
  );
  return (
    next.getUTCFullYear() === day2.getUTCFullYear() &&
    next.getUTCMonth() === day2.getUTCMonth() &&
    next.getUTCDate() === day2.getUTCDate()
  );
}

// ---------------------------------------------------------------------------
// Tithi window helpers
// ---------------------------------------------------------------------------

/**
 * Groups an ordered array of daily rows into consecutive "tithi windows".
 *
 * A tithi that spans more than 24 h will appear at sunrise on 2+ consecutive
 * calendar days. This function collapses those into a single window so the
 * caller can emit one occurrence per tithi occurrence (not one per day).
 *
 * @param rows - Ordered array of rows that share the same tithi
 */
export function groupConsecutiveDays<T extends { date: Date }>(
  rows: T[]
): Array<{ firstDay: T; lastDay: T }> {
  const windows: Array<{ firstDay: T; lastDay: T }> = [];
  for (const row of rows) {
    const last = windows[windows.length - 1];
    if (last && isConsecutiveDay(last.lastDay.date, row.date)) {
      last.lastDay = row;
    } else {
      windows.push({ firstDay: row, lastDay: row });
    }
  }
  return windows;
}

// Minimum gap between two windows of the same maas to be treated as separate
// lunar-month occurrences. One lunar month is ~29.5 days; 45 days is a safe
// threshold that allows a winter maas (e.g. PAUSHA) to appear in both January
// and December of the same Gregorian year without being deduped.
const LUNAR_CYCLE_GAP_MS = 45 * 24 * 60 * 60 * 1000;

/**
 * From ordered, maas-filtered tithi windows, selects one window per lunar-month
 * occurrence.
 *
 * - Single-maas events: take every window that matches the maas filter — no
 *   Gregorian-year dedup. A winter maas (e.g. PAUSHA) legitimately produces two
 *   occurrences in the same Gregorian year (January and December). The 45-day
 *   gap guard prevents pathological duplicates from malformed data.
 * - Multi-maas or no-maas: dedup by Gregorian year + maas key (original
 *   behaviour required for events like Navadurga).
 *
 * @param windows     - Ordered {firstDay, lastDay} pairs from groupConsecutiveDays
 * @param maasValues  - Maas whitelist (null = no filter)
 * @param isMultiMaas - When true, use year+maas as the dedup key
 */
export function selectFirstWindowPerLunarCycle<
  T extends { date: Date; maas: string | null },
>(
  windows: Array<{ firstDay: T; lastDay: T }>,
  maasValues: string[] | null,
  isMultiMaas: boolean
): Array<{ firstDay: T; lastDay: T }> {
  if (maasValues !== null && !isMultiMaas) {
    const selected: Array<{ firstDay: T; lastDay: T }> = [];
    for (const w of windows) {
      if (!w.firstDay.maas || !maasValues.includes(w.firstDay.maas)) continue;
      const prev = selected[selected.length - 1];
      if (
        !prev ||
        w.firstDay.date.getTime() - prev.firstDay.date.getTime() > LUNAR_CYCLE_GAP_MS
      ) {
        selected.push(w);
      }
    }
    return selected;
  }

  // Multi-maas or no-maas: dedup by Gregorian year + maas key.
  const seen = new Map<string, true>();
  const selected: Array<{ firstDay: T; lastDay: T }> = [];
  for (const w of windows) {
    if (maasValues && (!w.firstDay.maas || !maasValues.includes(w.firstDay.maas)))
      continue;
    const year = w.firstDay.date.getUTCFullYear();
    const key =
      isMultiMaas && w.firstDay.maas ? `${year}-${w.firstDay.maas}` : String(year);
    if (!seen.has(key)) {
      seen.set(key, true);
      selected.push(w);
    }
  }
  return selected.sort((a, b) => a.firstDay.date.getTime() - b.firstDay.date.getTime());
}

/**
 * Returns true when the given day's predecessor tithi ended AFTER sunrise,
 * meaning the target tithi started during the evening of that same day
 * (i.e., it is a "kshaya" — the target tithi is skipped at sunrise).
 */
export function isPredecessorEndsAfterSunrise(prev: PrevDayInfo): boolean {
  const endMin = parseTimeToMinutes(prev.tithiEndTime ?? "");
  const sunriseMin = parseTimeToMinutes(prev.sunrise ?? "");
  if (endMin === null || sunriseMin === null) return false;
  // Only shift when the tithi started in the EVENING (after sunset).
  // Daytime starts (after sunrise but before sunset) belong to the Udaya Tithi
  // of the following day — no date shift needed.
  const sunsetMin = parseTimeToMinutes(prev.sunset ?? "");
  if (sunsetMin !== null) return endMin >= sunsetMin;
  // Fallback when sunset is unavailable: use sunrise threshold.
  return endMin >= sunriseMin;
}

/**
 * Returns true when the target tithi started early enough before the
 * Nishitakal of the previous day's night to warrant shifting the festival
 * date back one calendar day.
 *
 * DrikPanchang places certain events (e.g. Vaikuntha Chaturdashi) on the day
 * whose Nishitakal falls during the tithi — but only if the tithi was already
 * active for at least one muhurta (≈ nightDuration/15 min) before Nishitakal
 * began. A tithi that starts just 1–2 minutes before Nishitakal is treated as
 * belonging to the following (sunrise-rule) day.
 *
 * @param prev           Previous day data: tithiEndTime (= when target tithi
 *                       started), sunrise and sunset for that night's Nishitakal.
 * @param currentSunrise Sunrise of the candidate day — the far end of the night.
 */
export function isNishitakalDateShiftNeeded(
  prev: PrevDayInfo,
  currentSunrise: string | null
): boolean {
  if (!prev.tithiEndTime || !prev.sunrise || !prev.sunset || !currentSunrise)
    return false;

  // Tithi must have started AFTER sunrise on prevDay (evening/night start only)
  const tithiStartMin = parseTimeToMinutes(prev.tithiEndTime);
  const prevSunriseMin = parseTimeToMinutes(prev.sunrise);
  if (tithiStartMin === null || prevSunriseMin === null) return false;
  if (tithiStartMin < prevSunriseMin) return false;

  // Nishitakal of the night prevDay → currentDay
  const nishitakal = calculateNishitaKaal(prev.sunset, currentSunrise);
  if (!nishitakal) return false;

  // Raw Nishitakal-start in minutes from prevDay midnight.
  // calculateNishitaKaal returns "HH:MM" (wrapped to 0–1439), but the real
  // start can be > 1440 when it falls past midnight. We reconstruct the raw
  // value from the sunset and the known night-duration formula so comparisons
  // stay on a single continuous timeline.
  const sunsetMin = parseTimeToMinutes(prev.sunset);
  const nextSunriseMin = parseTimeToMinutes(currentSunrise);
  if (sunsetMin === null || nextSunriseMin === null) return false;

  const nightDuration = nextSunriseMin + 1440 - sunsetMin;
  const muhurta = nightDuration / 15;
  const nishitakalStartRaw = sunsetMin + nightDuration / 2 - muhurta;

  // Shift only if tithi started at least one muhurta before Nishitakal
  return tithiStartMin + muhurta <= nishitakalStartRaw;
}

// ---------------------------------------------------------------------------
// Ratri Vyapini (Pradosh-based) date rule
// ---------------------------------------------------------------------------

/**
 * Selects the observation date for events governed by the "Ratri Vyapini"
 * (night-pervading) rule — used by Kalashtami (Krishna Ashtami vrat).
 *
 * Rule: observe on the day whose Pradosh Kaal (sunset to sunset + nightDuration/5)
 * is covered by the tithi. If the tithi starts before Pradosh ends → that day.
 * If the tithi starts after Pradosh → the following Udaya Tithi day (firstDay).
 *
 * nightDuration/5 equals 3 muhurtas, which is the Pradosh Kaal duration used
 * by DrikPanchang for the Ratri Vyapini determination.
 *
 * @param firstDay       First day where the tithi is the Udaya Tithi (active at sunrise).
 * @param lastDay        Last day of the tithi window (same as firstDay for most months).
 * @param prevInfo       Previous day's data: tithiEndTime = moment the target tithi
 *                       started, plus sunrise and sunset of that previous day.
 * @param firstDaySunrise Sunrise of firstDay — needed to compute the night duration.
 */
export function applyRatriVyapiniDateRule(
  firstDay: { date: Date; tithiEndTime: string | null },
  lastDay: { date: Date; tithiEndTime: string | null },
  prevInfo: PrevDayInfo | undefined,
  firstDaySunrise: string | null
): GeneratedOccurrence {
  const normalizeTime = (t: string): string => {
    const min = parseTimeToMinutes(t);
    return min !== null ? formatMinutesToTime(min) : t;
  };

  const endTime = lastDay.tithiEndTime ? normalizeTime(lastDay.tithiEndTime) : undefined;

  // Fall back to Udaya Tithi when data required for the Pradosh calculation is missing.
  if (!prevInfo?.tithiEndTime || !prevInfo.sunset || !firstDaySunrise) {
    return { date: firstDay.date, endTime };
  }

  const tithiStartMin = parseTimeToMinutes(prevInfo.tithiEndTime);
  const sunsetMin = parseTimeToMinutes(prevInfo.sunset);
  const prevSunriseMin = parseTimeToMinutes(prevInfo.sunrise ?? "");
  const firstDaySunriseMin = parseTimeToMinutes(firstDaySunrise);

  if (tithiStartMin === null || sunsetMin === null || firstDaySunriseMin === null) {
    return { date: firstDay.date, endTime };
  }

  // Express tithiStart on the prevDay timeline.
  // A stored time < prevDay sunrise means it is a past-midnight (next-day) value.
  const tithiOnPrevTimeline =
    prevSunriseMin !== null && tithiStartMin < prevSunriseMin
      ? tithiStartMin + 1440
      : tithiStartMin;

  // Express firstDay sunrise on the prevDay timeline (always next-day relative to sunset).
  const sunriseOnPrevTimeline =
    firstDaySunriseMin < sunsetMin ? firstDaySunriseMin + 1440 : firstDaySunriseMin;

  // Pradosh Kaal = sunset to sunset + nightDuration/5 (= 3 muhurtas).
  const nightDuration = sunriseOnPrevTimeline - sunsetMin;
  const pradoshEnd = sunsetMin + nightDuration / 5;

  if (tithiOnPrevTimeline <= pradoshEnd) {
    // Tithi starts before Pradosh ends on prevDay → observe on prevDay.
    const prevDate = new Date(firstDay.date);
    prevDate.setUTCDate(prevDate.getUTCDate() - 1);
    const startTime = normalizeTime(prevInfo.tithiEndTime);
    const endDate =
      lastDay.date.getTime() !== prevDate.getTime() ? lastDay.date : undefined;
    return { date: prevDate, startTime, endDate, endTime };
  }

  // Tithi starts after Pradosh → observe on Udaya Tithi day (firstDay).
  return { date: firstDay.date, endTime };
}

// ---------------------------------------------------------------------------
// Pradosh tithi shift (Sankashti Chaturthi rule)
// ---------------------------------------------------------------------------

/**
 * Returns true when Chaturthi started between sunrise and sunset of the
 * previous day — meaning it's present during Pradosh Kaal and the correct
 * observance date is that previous day (not the Udaya Tithi day).
 *
 * Only applies to CHATURTHI_KRISHNA (Sankashti). The `tithi` guard prevents
 * false triggers when two tithis fit in one day (double-transition case) where
 * tithiEndTime belongs to a different predecessor.
 */
export function isSankashtiPradoshShiftNeeded(prev: PrevDayInfo): boolean {
  if (prev.tithi !== "TRITIYA_KRISHNA") return false;
  const endMin = parseTimeToMinutes(prev.tithiEndTime ?? "");
  const sunriseMin = parseTimeToMinutes(prev.sunrise ?? "");
  const sunsetMin = parseTimeToMinutes(prev.sunset ?? "");
  if (endMin === null || sunriseMin === null || sunsetMin === null) return false;
  return endMin >= sunriseMin && endMin < sunsetMin;
}

// ---------------------------------------------------------------------------
// Occurrence computation
// ---------------------------------------------------------------------------

/**
 * Produces a GeneratedOccurrence for a tithi window (firstDay..lastDay).
 *
 * If the tithi started in the EVENING of the day before firstDay, the
 * occurrence date is shifted back by one day and the startTime is set to the
 * exact moment the previous tithi ended (= this tithi began).
 *
 * Convention used throughout the codebase:
 *   prevDayMap key  = ISO string of the *current* date
 *   prevDayMap value = DailyInfo of the *previous* calendar day
 */
export function computeTithiOccurrence(
  firstDay: { date: Date; tithiEndTime: string | null },
  lastDay: { date: Date; tithiEndTime: string | null },
  prevDayMap: Map<string, PrevDayInfo>
): GeneratedOccurrence {
  const firstKey = firstDay.date.toISOString().split("T")[0]!;
  const prevInfo = prevDayMap.get(firstKey);

  const normalizeTime = (t: string): string => {
    const min = parseTimeToMinutes(t);
    return min !== null ? formatMinutesToTime(min) : t;
  };

  let occDate = firstDay.date;
  let startTime: string | undefined;
  const endTime: string | undefined = lastDay.tithiEndTime
    ? normalizeTime(lastDay.tithiEndTime)
    : undefined;

  if (prevInfo && isPredecessorEndsAfterSunrise(prevInfo)) {
    const prevDate = new Date(firstDay.date);
    prevDate.setUTCDate(prevDate.getUTCDate() - 1);
    occDate = prevDate;
    startTime = normalizeTime(prevInfo.tithiEndTime!);
  }

  const endDate = lastDay.date.getTime() !== occDate.getTime() ? lastDay.date : undefined;

  return { date: occDate, startTime, endDate, endTime };
}
