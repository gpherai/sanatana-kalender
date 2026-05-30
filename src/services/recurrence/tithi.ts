import "server-only";
import type { Event } from "@prisma/client";
import { EventType, Tithi } from "@prisma/client";
import { asRuleConfig, type TithiRuleConfig } from "@/config/rule-config.types";
import {
  findDailyInfoYearlyLunarCandidates,
  findDailyInfoKshayaCandidates,
  findDailyInfoSunriseByDates,
  findDailyInfoTithiTimingCandidates,
} from "@/repositories/daily-info.repository";
import {
  computeTithiOccurrence,
  computeSankashtiOccurrence,
  groupConsecutiveDays,
  isPredecessorEndsAfterSunrise,
  isNishitakalDateShiftNeeded,
  selectFirstWindowPerLunarCycle,
} from "@/engine";
import { parseTimeToMinutes, formatMinutesToTime } from "@/lib/timing-utils";
import { logWarn } from "@/lib/utils";
import {
  TITHI_PREDECESSOR,
  getAdhikaFilter,
  fetchPreviousDayData,
  applyRatriVyapiniToWindows,
} from "./helpers";
import type { GeneratedOccurrence } from "./types";

// =============================================================================
// YEARLY LUNAR RECURRENCE
// =============================================================================

export async function generateYearlyLunarOccurrences(
  event: Event,
  startDate: Date,
  endDate: Date
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
  // Predecessor-day overrides: map window index → predecessor date.
  // Applied when preferPredecessorDay is true and the predecessor tithi ends
  // after sunrise (meaning the target tithi starts partway through that day).
  const predecessorDateOverrides = new Map<number, Date>();

  const predecessorTithi = TITHI_PREDECESSOR[event.tithi];
  if (predecessorTithi) {
    const kshayaCandidates = await findDailyInfoKshayaCandidates(
      { startDate, endDate },
      predecessorTithi,
      adhikaFilter
    );

    const kshayaNextDay = config.kshayaNextDay === true;
    const preferPredecessorDay = config.preferPredecessorDay === true;
    const DAY_MS = 24 * 60 * 60 * 1000;

    for (const day of kshayaCandidates) {
      if (maasValues && (!day.maas || !maasValues.includes(day.maas))) continue;
      if (
        !isPredecessorEndsAfterSunrise({
          tithiEndTime: day.tithiEndTime,
          sunrise: day.sunrise,
        })
      )
        continue;

      const occDate = kshayaNextDay ? new Date(day.date.getTime() + DAY_MS) : day.date;

      // Check if a normal window already covers this lunar-month occurrence.
      const coveredWindowIndex = selectedWindows.findIndex(
        (w) => Math.abs(w.firstDay.date.getTime() - occDate.getTime()) < CYCLE_GAP_MS
      );

      if (coveredWindowIndex >= 0) {
        // Normal window exists (not a kshaya case). If preferPredecessorDay is
        // set, record the predecessor day to replace the udaya-tithi date.
        if (preferPredecessorDay && !kshayaNextDay) {
          predecessorDateOverrides.set(coveredWindowIndex, day.date);
        }
        continue;
      }

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

  // Apply predecessor-day overrides to normal windows.
  const adjustedWindows: WindowEntry[] =
    predecessorDateOverrides.size > 0
      ? selectedWindows.map((w, i) => {
          const override = predecessorDateOverrides.get(i);
          return override
            ? {
                ...w,
                firstDay: { ...w.firstDay, date: override },
                lastDay: { ...w.lastDay, date: override },
              }
            : w;
        })
      : selectedWindows;

  const durationDays = typeof config.durationDays === "number" ? config.durationDays : 1;

  const rawSelectedWindows = [...adjustedWindows, ...kshayaWindowExtras].sort(
    (a, b) => a.firstDay.date.getTime() - b.firstDay.date.getTime()
  );

  const finalWindows = rawSelectedWindows;

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

  const isRatriVyapini = config.dateRule === "RATRI_VYAPINI";
  if (isRatriVyapini) {
    const prevDayMapRV = await fetchPreviousDayData(
      finalWindows.map((w) => w.firstDay.date)
    );
    return applyRatriVyapiniToWindows(finalWindows, prevDayMapRV, event.tithi);
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
      return finalWindows.map(({ firstDay, lastDay }) =>
        computeSankashtiOccurrence(firstDay, lastDay, prevDayMap)
      );
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
  endDate: Date
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
  const nishitakalDateRule = config.nishitakalDateRule === true;

  let occurrences: GeneratedOccurrence[];

  if (nishitakalDateRule) {
    const firstDayDates = windows.map((w) => w.firstDay.date);
    const currentDayRows = await findDailyInfoSunriseByDates(firstDayDates);
    const currentSunriseMap = new Map(
      currentDayRows.map((r) => [r.date.toISOString().split("T")[0]!, r.sunrise])
    );
    occurrences = windows.map(({ firstDay }) => {
      const key = firstDay.date.toISOString().split("T")[0]!;
      const prevInfo = prevDayMap.get(key);
      const currentSunrise = currentSunriseMap.get(key) ?? null;
      if (prevInfo && isNishitakalDateShiftNeeded(prevInfo, currentSunrise)) {
        return { date: new Date(firstDay.date.getTime() - 24 * 60 * 60 * 1000) };
      }
      return { date: firstDay.date };
    });
  } else if (isRatriVyapini) {
    occurrences = await applyRatriVyapiniToWindows(
      windows,
      prevDayMap,
      event.tithi as Tithi
    );
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
