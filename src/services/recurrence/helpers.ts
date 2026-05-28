import "server-only";
import type { Event } from "@prisma/client";
import { Tithi } from "@prisma/client";
import {
  findDailyInfoSunTimesByDates,
  findDailyInfoMoonPhaseCandidates,
  findDailyInfoPreviousDayTimingRows,
  type DailyInfoAdhikaFilter,
} from "@/repositories/daily-info.repository";
import { logWarn } from "@/lib/utils";
import { formatDateNL } from "@/lib/date-utils";
import { calculateTimingWindow } from "@/lib/timing-utils";
import type { GeneratedOccurrence } from "./types";

// =============================================================================
// KSHAYA TITHI PREDECESSOR MAP
// =============================================================================

export const TITHI_PREDECESSOR: Partial<Record<Tithi, Tithi>> = {
  PRATIPADA_SHUKLA: "AMAVASYA",
  DWITIYA_SHUKLA: "PRATIPADA_SHUKLA",
  TRITIYA_SHUKLA: "DWITIYA_SHUKLA",
  CHATURTHI_SHUKLA: "TRITIYA_SHUKLA",
  PANCHAMI_SHUKLA: "CHATURTHI_SHUKLA",
  SHASHTHI_SHUKLA: "PANCHAMI_SHUKLA",
  SAPTAMI_SHUKLA: "SHASHTHI_SHUKLA",
  ASHTAMI_SHUKLA: "SAPTAMI_SHUKLA",
  NAVAMI_SHUKLA: "ASHTAMI_SHUKLA",
  DASHAMI_SHUKLA: "NAVAMI_SHUKLA",
  EKADASHI_SHUKLA: "DASHAMI_SHUKLA",
  DWADASHI_SHUKLA: "EKADASHI_SHUKLA",
  TRAYODASHI_SHUKLA: "DWADASHI_SHUKLA",
  CHATURDASHI_SHUKLA: "TRAYODASHI_SHUKLA",
  PURNIMA: "CHATURDASHI_SHUKLA",
  PRATIPADA_KRISHNA: "PURNIMA",
  DWITIYA_KRISHNA: "PRATIPADA_KRISHNA",
  TRITIYA_KRISHNA: "DWITIYA_KRISHNA",
  CHATURTHI_KRISHNA: "TRITIYA_KRISHNA",
  PANCHAMI_KRISHNA: "CHATURTHI_KRISHNA",
  SHASHTHI_KRISHNA: "PANCHAMI_KRISHNA",
  SAPTAMI_KRISHNA: "SHASHTHI_KRISHNA",
  ASHTAMI_KRISHNA: "SAPTAMI_KRISHNA",
  NAVAMI_KRISHNA: "ASHTAMI_KRISHNA",
  DASHAMI_KRISHNA: "NAVAMI_KRISHNA",
  EKADASHI_KRISHNA: "DASHAMI_KRISHNA",
  DWADASHI_KRISHNA: "EKADASHI_KRISHNA",
  TRAYODASHI_KRISHNA: "DWADASHI_KRISHNA",
  CHATURDASHI_KRISHNA: "TRAYODASHI_KRISHNA",
  AMAVASYA: "CHATURDASHI_KRISHNA",
};

// =============================================================================
// PHASE CORRECTION MAP
// =============================================================================

// Both PURNIMA and AMAVASYA use strict tithi-at-sunrise (udaya tithi) rule,
// matching DrikPanchang convention. Astronomical peak can fall on D+1 but
// the observance day is always the sunrise-rule tithi day — do NOT shift.
export const PHASE_CORRECTION_TITHI: Partial<Record<Tithi, "FULL_MOON" | "NEW_MOON">> =
  {};

// =============================================================================
// ADHIKA FILTER
// =============================================================================

export function getAdhikaFilter(event: Event): DailyInfoAdhikaFilter {
  if (event.isAdhikaOnly) return "only";
  if (!event.includeAdhika) return "exclude";
  return "include";
}

// =============================================================================
// APPLY DYNAMIC TIMING
// =============================================================================

export async function applyDynamicTiming(
  occurrences: GeneratedOccurrence[],
  timingType: NonNullable<Event["timingType"]>
): Promise<GeneratedOccurrence[]> {
  if (occurrences.length === 0) return occurrences;

  const datesToFetch = new Set<string>();
  for (const occ of occurrences) {
    const isoDate = occ.date.toISOString().split("T")[0]!;
    datesToFetch.add(isoDate);
    if (timingType === "NISHITA_KAAL") {
      const nextDay = new Date(occ.date);
      nextDay.setDate(nextDay.getDate() + 1);
      datesToFetch.add(nextDay.toISOString().split("T")[0]!);
    }
  }

  const dailyInfoRows = await findDailyInfoSunTimesByDates(
    Array.from(datesToFetch).map((date) => new Date(date))
  );

  const byDate = new Map<string, { sunrise: string | null; sunset: string | null }>();
  for (const row of dailyInfoRows) {
    byDate.set(row.date.toISOString().split("T")[0]!, {
      sunrise: row.sunrise,
      sunset: row.sunset,
    });
  }

  return occurrences.map((occ) => {
    if (occ.startTime) return occ;

    const isoDate = occ.date.toISOString().split("T")[0]!;
    const dayInfo = byDate.get(isoDate);

    let nextSunrise: string | null = null;
    if (timingType === "NISHITA_KAAL") {
      const nextDay = new Date(occ.date);
      nextDay.setDate(nextDay.getDate() + 1);
      nextSunrise = byDate.get(nextDay.toISOString().split("T")[0]!)?.sunrise ?? null;
    }

    const window = calculateTimingWindow(timingType, {
      sunrise: dayInfo?.sunrise ?? null,
      sunset: dayInfo?.sunset ?? null,
      nextSunrise,
    });

    if (!window) {
      logWarn(
        `Could not calculate ${timingType} for ${formatDateNL(occ.date)} — missing DailyInfo`
      );
      return occ;
    }

    return { ...occ, startTime: window.startTime, endTime: window.endTime };
  });
}

// =============================================================================
// ASTRONOMICAL PHASE CORRECTION
// =============================================================================

type CandidateDay = {
  date: Date;
  tithiEndTime: string | null;
  maas: string | null;
  isAdhika: boolean;
};

export async function correctToAstronomicalPhaseDay(
  candidates: CandidateDay[],
  targetPhase: "FULL_MOON" | "NEW_MOON"
): Promise<CandidateDay[]> {
  if (candidates.length === 0) return candidates;

  const neighborDates = candidates.map(
    (c) => new Date(c.date.getTime() + 24 * 60 * 60 * 1000)
  );
  const allDates = [...candidates.map((c) => c.date), ...neighborDates];

  const phaseRows = await findDailyInfoMoonPhaseCandidates(allDates, targetPhase);

  const phaseMap = new Map<string, number>(
    phaseRows.map((r) => [r.date.toISOString(), r.moonPhasePercent ?? 0])
  );

  return candidates.map((candidate) => {
    const candidateIso = candidate.date.toISOString();
    const nextDay = new Date(candidate.date.getTime() + 24 * 60 * 60 * 1000);
    const nextDayIso = nextDay.toISOString();

    const candidatePct = phaseMap.get(candidateIso) ?? -1;
    const nextDayPct = phaseMap.get(nextDayIso) ?? -1;

    if (candidatePct < 0 && nextDayPct < 0) return candidate;

    // FULL_MOON: higher % = brighter = closer to peak → shift if next day brighter.
    // NEW_MOON: lower % = darker = closer to peak (0 = true new moon) → shift if next day darker.
    const shiftToNext =
      targetPhase === "FULL_MOON"
        ? nextDayPct > candidatePct
        : candidatePct >= 0 && nextDayPct >= 0 && nextDayPct < candidatePct;

    if (shiftToNext) {
      return { ...candidate, date: nextDay };
    }
    return candidate;
  });
}

// =============================================================================
// PREVIOUS DAY DATA HELPER
// =============================================================================

export async function fetchPreviousDayData(dates: Date[]): Promise<
  Map<
    string,
    {
      tithiEndTime: string | null;
      sunrise: string | null;
      sunset: string | null;
      tithi: string | null;
    }
  >
> {
  if (dates.length === 0) return new Map();

  const rows = await findDailyInfoPreviousDayTimingRows(dates);

  const map = new Map<
    string,
    {
      tithiEndTime: string | null;
      sunrise: string | null;
      sunset: string | null;
      tithi: string | null;
    }
  >();
  for (const row of rows) {
    const nextDay = new Date(row.date);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    map.set(nextDay.toISOString().split("T")[0]!, {
      tithiEndTime: row.tithiEndTime,
      sunrise: row.sunrise,
      sunset: row.sunset,
      tithi: row.tithi,
    });
  }

  return map;
}
