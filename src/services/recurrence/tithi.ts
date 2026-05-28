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
  selectFirstWindowPerLunarCycle,
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

  // Group consecutive udaya-tithi days into windows before deduping.
  // A long tithi (> 24 h) can be the udaya tithi on two or more consecutive
  // calendar days; groupConsecutiveDays collapses those into a single window
  // so that selectFirstWindowPerLunarCycle receives one entry per occurrence.
  const dataWindows = groupConsecutiveDays(dailyData);
  const selectedWindows = selectFirstWindowPerLunarCycle(
    dataWindows,
    maasValues,
    isMultiMaas
  );

  // Proximity threshold: two windows within 45 days → same lunar-month occurrence.
  const CYCLE_GAP_MS = 45 * 24 * 60 * 60 * 1000;

  type WindowEntry = (typeof selectedWindows)[0];
  const kshayaWindowExtras: WindowEntry[] = [];

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

      const occDate = kshayaNextDay
        ? new Date(day.date.getTime() + 24 * 60 * 60 * 1000)
        : day.date;

      // Skip if a normal window already covers this lunar-month occurrence.
      const alreadyCovered = selectedWindows.some(
        (w) => Math.abs(w.firstDay.date.getTime() - occDate.getTime()) < CYCLE_GAP_MS
      );
      if (alreadyCovered) continue;

      const extra = {
        date: occDate,
        tithiEndTime: null as string | null,
        maas: day.maas,
        isAdhika: day.isAdhika,
        sunrise: null as string | null,
        moonrise: null as string | null,
      };
      kshayaWindowExtras.push({ firstDay: extra, lastDay: extra });
    }
  }

  const durationDays = typeof config.durationDays === "number" ? config.durationDays : 1;

  const rawSelectedWindows = [...selectedWindows, ...kshayaWindowExtras].sort(
    (a, b) => a.firstDay.date.getTime() - b.firstDay.date.getTime()
  );

  const targetPhase = PHASE_CORRECTION_TITHI[event.tithi];
  let finalWindows: WindowEntry[];
  if (targetPhase) {
    const correctedDays = await correctToAstronomicalPhaseDay(
      rawSelectedWindows.map((w) => w.firstDay),
      targetPhase
    );
    finalWindows = correctedDays.map((day, i) => ({
      firstDay: day as WindowEntry["firstDay"],
      lastDay: rawSelectedWindows[i]!.lastDay,
    }));
  } else {
    finalWindows = rawSelectedWindows;
  }

  if (durationDays > 1) {
    return finalWindows.map(({ firstDay }) => ({
      date: firstDay.date,
      endDate: new Date(
        firstDay.date.getTime() + (durationDays - 1) * 24 * 60 * 60 * 1000
      ),
      startTime: undefined,
      endTime: firstDay.tithiEndTime ?? undefined,
    }));
  }

  const nishitakalDateRule = config.nishitakalDateRule === true;
  if (nishitakalDateRule) {
    const prevDayMap = await fetchPreviousDayData(
      finalWindows.map((w) => w.firstDay.date)
    );
    const currentDayRows = await findDailyInfoSunriseByDates(
      finalWindows.map((w) => w.firstDay.date)
    );
    const currentSunriseMap = new Map(
      currentDayRows.map((r) => [r.date.toISOString().split("T")[0]!, r.sunrise])
    );
    return finalWindows.map(({ firstDay }) => {
      const key = firstDay.date.toISOString().split("T")[0]!;
      const prevInfo = prevDayMap.get(key);
      const currentSunrise = currentSunriseMap.get(key) ?? null;
      if (prevInfo && isNishitakalDateShiftNeeded(prevInfo, currentSunrise)) {
        const prevDate = new Date(firstDay.date.getTime() - 24 * 60 * 60 * 1000);
        return { date: prevDate };
      }
      return { date: firstDay.date };
    });
  }

  if (event.eventType === EventType.VRAT) {
    const prevDayMap = await fetchPreviousDayData(
      finalWindows.map((w) => w.firstDay.date)
    );
    if (event.tithi === Tithi.CHATURTHI_KRISHNA) {
      return finalWindows.map(({ firstDay, lastDay }) => {
        const occ = computeTithiOccurrence(firstDay, lastDay, prevDayMap);
        const key = firstDay.date.toISOString().split("T")[0]!;
        const prevInfo = prevDayMap.get(key);

        // When computeTithiOccurrence shifted to D-1 (evening start), verify
        // that Chaturthi actually started within Pradosh Kaal (sunset + 120 min).
        // If it started after Pradosh, DP uses the udaya tithi day instead.
        if (occ.date.getTime() !== firstDay.date.getTime() && prevInfo) {
          const endMin = parseTimeToMinutes(prevInfo.tithiEndTime ?? "");
          const sunsetMin = parseTimeToMinutes(prevInfo.sunset ?? "");
          if (endMin !== null && sunsetMin !== null && endMin > sunsetMin + 120) {
            return { date: firstDay.date };
          }
        }

        // Pradosh rule for Sankashti Chaturthi: if Chaturthi started during the
        // daytime of the previous day (between sunrise and sunset), it is present
        // during Pradosh Kaal → observe on that previous day instead of the
        // Udaya Tithi day.
        if (occ.date.getTime() === firstDay.date.getTime()) {
          if (prevInfo && isSankashtiPradoshShiftNeeded(prevInfo)) {
            const prevDate = new Date(firstDay.date);
            prevDate.setUTCDate(prevDate.getUTCDate() - 1);
            const startMin = parseTimeToMinutes(prevInfo.tithiEndTime ?? "");
            const startTime =
              startMin !== null ? formatMinutesToTime(startMin) : undefined;
            const endMin = firstDay.tithiEndTime
              ? parseTimeToMinutes(firstDay.tithiEndTime)
              : null;
            const endTime = endMin !== null ? formatMinutesToTime(endMin) : undefined;
            return { date: prevDate, startTime, endDate: firstDay.date, endTime };
          }

          // Midnight Chaturthi rule: when Chaturthi starts in the first hour
          // after midnight (< 60 min), both the tithi start and the moonrise
          // fall in the pre-dawn window that Hindu timekeeping assigns to the
          // previous day (days run sunrise-to-sunrise). DP observes on D-1.
          // The 60-minute threshold ensures this only fires for genuine
          // midnight-start cases; Chaturthi starting at 01:30+ uses udaya tithi.
          if (prevInfo) {
            const chaturthi_startMin = parseTimeToMinutes(prevInfo.tithiEndTime ?? "");
            const moonriseMin = parseTimeToMinutes(firstDay.moonrise ?? "");
            const sunriseMin = parseTimeToMinutes(firstDay.sunrise ?? "");
            if (
              chaturthi_startMin !== null &&
              chaturthi_startMin < 60 &&
              moonriseMin !== null &&
              sunriseMin !== null &&
              moonriseMin < sunriseMin
            ) {
              const prevDate = new Date(firstDay.date);
              prevDate.setUTCDate(prevDate.getUTCDate() - 1);
              return { date: prevDate };
            }
          }
        }
        return occ;
      });
    }
    return finalWindows.map(({ firstDay, lastDay }) =>
      computeTithiOccurrence(firstDay, lastDay, prevDayMap)
    );
  }

  // FESTIVAL: udaya tithi date; add endDate for multi-day tithi spans.
  return finalWindows.map(({ firstDay, lastDay }) => ({
    date: firstDay.date,
    endDate:
      lastDay.date.getTime() !== firstDay.date.getTime() ? lastDay.date : undefined,
  }));
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
