import "server-only";
import type { Event } from "@prisma/client";
import { EventType, Tithi } from "@prisma/client";
import { asRuleConfig, type TithiRuleConfig } from "@/config/rule-config.types";
import {
  findDailyInfoYearlyLunarCandidates,
  findDailyInfoKshayaCandidates,
  findDailyInfoSunriseByDates,
  findDailyInfoTithiTimingCandidates,
  findDailyInfoTithiByDates,
} from "@/repositories/daily-info.repository";
import {
  computeTithiOccurrence,
  groupConsecutiveDays,
  isPredecessorEndsAfterSunrise,
  isNishitakalDateShiftNeeded,
  isSankashtiPradoshShiftNeeded,
  selectFirstPerYear,
  applyRatriVyapiniDateRule,
} from "@/engine";
import { parseTimeToMinutes, formatMinutesToTime } from "@/lib/timing-utils";
import { logWarn } from "@/lib/utils";
import {
  TITHI_PREDECESSOR,
  PHASE_CORRECTION_TITHI,
  getAdhikaFilter,
  correctToAstronomicalPhaseDay,
  fetchPreviousDayData,
} from "./helpers";
import type { GeneratedOccurrence } from "./types";

// =============================================================================
// YEARLY LUNAR RECURRENCE
// =============================================================================

export async function generateYearlyLunarOccurrences(
  event: Event,
  startDate: Date,
  endDate: Date,
  _location: { name: string; lat: number; lon: number },
  _timezone: string
): Promise<GeneratedOccurrence[]> {
  if (!event.tithi) {
    logWarn(`Yearly lunar event "${event.name}" has no tithi specified`);
    return [];
  }

  const adhikaFilter = getAdhikaFilter(event);
  const config = asRuleConfig<TithiRuleConfig>(event.ruleConfig);

  const dailyData = await findDailyInfoYearlyLunarCandidates(
    { startDate, endDate },
    event.tithi,
    adhikaFilter
  );

  const rcMaas = config.maas;
  const maasValues: string[] | null = Array.isArray(rcMaas)
    ? rcMaas
    : rcMaas
      ? [rcMaas]
      : event.maas
        ? [event.maas]
        : null;
  const isMultiMaas = maasValues !== null && maasValues.length > 1;

  const selectedByYear = selectFirstPerYear(dailyData, maasValues, isMultiMaas);

  const coveredKeys = new Set(
    selectedByYear.map((d) => {
      const year = d.date.getUTCFullYear();
      return isMultiMaas && d.maas ? `${year}-${d.maas}` : String(year);
    })
  );

  const kshayaExtras: Array<{
    date: Date;
    tithiEndTime: string | null;
    maas: string | null;
    isAdhika: boolean;
    sunrise: string | null;
    moonrise: string | null;
  }> = [];

  const predecessorTithi = TITHI_PREDECESSOR[event.tithi];
  if (predecessorTithi) {
    const kshayaCandidates = await findDailyInfoKshayaCandidates(
      { startDate, endDate },
      predecessorTithi,
      adhikaFilter
    );

    const kshayaNextDay = config.kshayaNextDay === true;

    for (const day of kshayaCandidates) {
      if (maasValues && (!day.maas || !maasValues.includes(day.maas))) continue;
      if (
        !isPredecessorEndsAfterSunrise({
          tithiEndTime: day.tithiEndTime,
          sunrise: day.sunrise,
        })
      )
        continue;

      const year = day.date.getUTCFullYear();
      const key = isMultiMaas && day.maas ? `${year}-${day.maas}` : String(year);
      if (coveredKeys.has(key)) continue;

      const occDate = kshayaNextDay
        ? new Date(day.date.getTime() + 24 * 60 * 60 * 1000)
        : day.date;

      kshayaExtras.push({
        date: occDate,
        tithiEndTime: null,
        maas: day.maas,
        isAdhika: day.isAdhika,
        sunrise: null,
        moonrise: null,
      });
      coveredKeys.add(key);
    }
  }

  const durationDays = typeof config.durationDays === "number" ? config.durationDays : 1;

  const rawSelectedDays = [...selectedByYear, ...kshayaExtras].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  const targetPhase = PHASE_CORRECTION_TITHI[event.tithi];
  const selectedDays = targetPhase
    ? await correctToAstronomicalPhaseDay(rawSelectedDays, targetPhase)
    : rawSelectedDays;

  if (durationDays > 1) {
    return selectedDays.map((day) => ({
      date: day.date,
      endDate: new Date(day.date.getTime() + (durationDays - 1) * 24 * 60 * 60 * 1000),
      startTime: undefined,
      endTime: day.tithiEndTime ?? undefined,
    }));
  }

  const nishitakalDateRule = config.nishitakalDateRule === true;
  if (nishitakalDateRule) {
    const prevDayMap = await fetchPreviousDayData(selectedDays.map((d) => d.date));
    const currentDayRows = await findDailyInfoSunriseByDates(
      selectedDays.map((d) => d.date)
    );
    const currentSunriseMap = new Map(
      currentDayRows.map((r) => [r.date.toISOString().split("T")[0]!, r.sunrise])
    );
    return selectedDays.map((day) => {
      const key = day.date.toISOString().split("T")[0]!;
      const prevInfo = prevDayMap.get(key);
      const currentSunrise = currentSunriseMap.get(key) ?? null;
      if (prevInfo && isNishitakalDateShiftNeeded(prevInfo, currentSunrise)) {
        const prevDate = new Date(day.date.getTime() - 24 * 60 * 60 * 1000);
        return { date: prevDate };
      }
      return { date: day.date };
    });
  }

  if (event.eventType === EventType.VRAT) {
    const prevDayMap = await fetchPreviousDayData(selectedDays.map((d) => d.date));
    if (event.tithi === Tithi.CHATURTHI_KRISHNA) {
      return selectedDays.map((day) => {
        const occ = computeTithiOccurrence(day, day, prevDayMap);
        const key = day.date.toISOString().split("T")[0]!;
        const prevInfo = prevDayMap.get(key);

        // When computeTithiOccurrence shifted to D-1 (evening start), verify
        // that Chaturthi actually started within Pradosh Kaal (sunset + 120 min).
        // If it started after Pradosh, DP uses the udaya tithi day instead.
        if (occ.date.getTime() !== day.date.getTime() && prevInfo) {
          const endMin = parseTimeToMinutes(prevInfo.tithiEndTime ?? "");
          const sunsetMin = parseTimeToMinutes(prevInfo.sunset ?? "");
          if (endMin !== null && sunsetMin !== null && endMin > sunsetMin + 120) {
            return { date: day.date };
          }
        }

        // Pradosh rule for Sankashti Chaturthi: if Chaturthi started during the
        // daytime of the previous day (between sunrise and sunset), it is present
        // during Pradosh Kaal → observe on that previous day instead of the
        // Udaya Tithi day.
        if (occ.date.getTime() === day.date.getTime()) {
          if (prevInfo && isSankashtiPradoshShiftNeeded(prevInfo)) {
            const prevDate = new Date(day.date);
            prevDate.setUTCDate(prevDate.getUTCDate() - 1);
            const startMin = parseTimeToMinutes(prevInfo.tithiEndTime ?? "");
            const startTime =
              startMin !== null ? formatMinutesToTime(startMin) : undefined;
            const endMin = day.tithiEndTime ? parseTimeToMinutes(day.tithiEndTime) : null;
            const endTime = endMin !== null ? formatMinutesToTime(endMin) : undefined;
            return { date: prevDate, startTime, endDate: day.date, endTime };
          }

          // Moonrise rule: if the moon rises AFTER Chaturthi starts but still
          // before sunrise, the moonrise belongs to the previous night in Hindu
          // timekeeping → observe on D-1. The start of Chaturthi is prevInfo's
          // tithiEndTime (when the predecessor tithi ended on D-1).
          // NOTE: moonrise must be AFTER the Chaturthi start — if moonrise is
          // before Chaturthi starts, the moon rose while the wrong tithi was
          // active and does not qualify for the fast-breaking sighting.
          if (prevInfo) {
            const chaturthi_startMin = parseTimeToMinutes(prevInfo.tithiEndTime ?? "");
            const moonriseMin = parseTimeToMinutes(day.moonrise ?? "");
            const sunriseMin = parseTimeToMinutes(day.sunrise ?? "");
            if (
              chaturthi_startMin !== null &&
              moonriseMin !== null &&
              sunriseMin !== null &&
              moonriseMin > chaturthi_startMin &&
              moonriseMin < sunriseMin
            ) {
              const prevDate = new Date(day.date);
              prevDate.setUTCDate(prevDate.getUTCDate() - 1);
              return { date: prevDate };
            }
          }
        }
        return occ;
      });
    }
    return selectedDays.map((day) => computeTithiOccurrence(day, day, prevDayMap));
  }

  return selectedDays.map((day) => ({ date: day.date }));
}

// =============================================================================
// MONTHLY LUNAR RECURRENCE
// =============================================================================

export async function generateMonthlyLunarOccurrences(
  event: Event,
  startDate: Date,
  endDate: Date,
  _location: { name: string; lat: number; lon: number },
  _timezone: string
): Promise<GeneratedOccurrence[]> {
  if (!event.tithi) {
    logWarn(`Monthly lunar event "${event.name}" has no tithi specified`);
    return [];
  }

  const dailyData = await findDailyInfoTithiTimingCandidates(
    { startDate, endDate },
    event.tithi
  );

  const prevDayMap = await fetchPreviousDayData(dailyData.map((d) => d.date));

  const windows = groupConsecutiveDays(dailyData);

  const config = asRuleConfig<TithiRuleConfig>(event.ruleConfig);
  const isRatriVyapini = config.dateRule === "RATRI_VYAPINI";

  let occurrences: GeneratedOccurrence[];

  if (isRatriVyapini) {
    const firstDayDates = windows.map((w) => w.firstDay.date);

    const prevDayDates = windows.map((w) => {
      const d = new Date(w.firstDay.date);
      d.setUTCDate(d.getUTCDate() - 1);
      return d;
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

    const expectedPredecessor = TITHI_PREDECESSOR[event.tithi as Tithi];

    occurrences = windows.map(({ firstDay, lastDay }) => {
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
  } else {
    occurrences = windows.map(({ firstDay, lastDay }) =>
      computeTithiOccurrence(firstDay, lastDay, prevDayMap)
    );
  }

  const predecessorTithi = TITHI_PREDECESSOR[event.tithi as Tithi];
  if (predecessorTithi) {
    const kshayaCandidates = await findDailyInfoKshayaCandidates(
      { startDate, endDate },
      predecessorTithi
    );

    const WINDOW_MS = 20 * 24 * 60 * 60 * 1000;
    for (const candidate of kshayaCandidates) {
      if (
        !isPredecessorEndsAfterSunrise({
          tithiEndTime: candidate.tithiEndTime,
          sunrise: candidate.sunrise,
        })
      ) {
        continue;
      }
      const alreadyCovered = occurrences.some(
        (occ) => Math.abs(occ.date.getTime() - candidate.date.getTime()) < WINDOW_MS
      );
      if (alreadyCovered) continue;

      const startMin = parseTimeToMinutes(candidate.tithiEndTime ?? "");
      const normalizedStart =
        startMin !== null ? formatMinutesToTime(startMin) : undefined;
      occurrences.push({
        date: candidate.date,
        startTime: normalizedStart,
        endDate: undefined,
        endTime: undefined,
      });
    }

    occurrences.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  return occurrences;
}
