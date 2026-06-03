import "server-only";
import type { Event } from "@prisma/client";
import { Tithi } from "@prisma/client";
import {
  findDailyInfoSunTimesByDates,
  findDailyInfoPreviousDayTimingRows,
  findDailyInfoSunriseByDates,
  findDailyInfoTithiByDates,
  type DailyInfoAdhikaFilter,
} from "@/repositories/daily-info.repository";
import { applyRatriVyapiniDateRule } from "@/engine";
import type { PrevDayInfo } from "@/engine";
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
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);
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
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);
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
// RATRI VYAPINI WINDOWS
// =============================================================================

export async function applyRatriVyapiniToWindows<
  T extends { date: Date; tithiEndTime: string | null },
>(
  windows: Array<{ firstDay: T; lastDay: T }>,
  prevDayMap: Map<string, PrevDayInfo>,
  tithi: Tithi
): Promise<GeneratedOccurrence[]> {
  const firstDayDates = windows.map((w) => w.firstDay.date);
  const prevDayDates = firstDayDates.map((d) => {
    const prev = new Date(d);
    prev.setUTCDate(prev.getUTCDate() - 1);
    return prev;
  });

  const [sunriseRows, prevTithiRows] = await Promise.all([
    findDailyInfoSunriseByDates(firstDayDates),
    findDailyInfoTithiByDates(prevDayDates),
  ]);

  const firstDaySunriseMap = new Map(
    sunriseRows.map((r) => [r.date.toISOString().split("T")[0]!, r.sunrise])
  );
  const prevTithiMap = new Map(
    prevTithiRows.map((r) => [r.date.toISOString().split("T")[0]!, r.tithi as string])
  );
  const expectedPredecessor = TITHI_PREDECESSOR[tithi];

  return windows.map(({ firstDay, lastDay }) => {
    const key = firstDay.date.toISOString().split("T")[0]!;
    const prevDate = new Date(firstDay.date);
    prevDate.setUTCDate(prevDate.getUTCDate() - 1);
    const prevKey = prevDate.toISOString().split("T")[0]!;
    const prevTithi = prevTithiMap.get(prevKey);
    const hasKshayaPredecessor =
      expectedPredecessor !== undefined &&
      prevTithi !== undefined &&
      prevTithi !== expectedPredecessor;
    return applyRatriVyapiniDateRule(
      firstDay,
      lastDay,
      hasKshayaPredecessor ? undefined : prevDayMap.get(key),
      firstDaySunriseMap.get(key) ?? null
    );
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
