/**
 * Pure helper functions for tithi-based occurrence computation.
 *
 * All functions are free of DB access and side effects — they operate only on
 * data passed in as arguments. This makes them fully unit-testable.
 *
 * Used by: src/services/recurrence.service.ts
 */

import { parseTimeToMinutes, formatMinutesToTime } from "@/lib/timing-utils";
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

/**
 * From an ordered, maas-filtered set of daily rows, returns the first row per
 * year (or per year+maas for multi-maas events).
 *
 * @param rows        - Ordered rows already filtered to the desired tithi
 * @param maasValues  - Maas whitelist (null = no filter)
 * @param isMultiMaas - When true, use year+maas as the dedup key (e.g. Navadurga)
 */
export function selectFirstPerYear<T extends { date: Date; maas: string | null }>(
  rows: T[],
  maasValues: string[] | null,
  isMultiMaas: boolean
): T[] {
  const seen = new Map<string, T>();
  for (const row of rows) {
    if (maasValues && (!row.maas || !maasValues.includes(row.maas))) continue;
    const year = row.date.getUTCFullYear();
    const key = isMultiMaas && row.maas ? `${year}-${row.maas}` : String(year);
    if (!seen.has(key)) seen.set(key, row);
  }
  return Array.from(seen.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Returns true when the given day's predecessor tithi ended AFTER sunrise,
 * meaning the target tithi started during the evening of that same day
 * (i.e., it is a "kshaya" — the target tithi is skipped at sunrise).
 */
export function isPredecessorEndsAfterSunrise(prev: PrevDayInfo): boolean {
  const endMin = parseTimeToMinutes(prev.tithiEndTime ?? "");
  const sunriseMin = parseTimeToMinutes(prev.sunrise ?? "");
  return endMin !== null && sunriseMin !== null && endMin >= sunriseMin;
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
