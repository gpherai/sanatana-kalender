import "server-only";
import type { Event } from "@prisma/client";
import { EventType, Tithi } from "@prisma/client";
import { asRuleConfig, type TithiRuleConfig } from "@/config/rule-config.types";
import {
  findDailyInfoYearlyLunarCandidates,
  findDailyInfoKshayaCandidates,
  findDailyInfoSunriseByDates,
  findDailyInfoTithiByDates,
  findDailyInfoTithiTimingCandidates,
} from "@/repositories/daily-info.repository";
import {
  computeTithiOccurrence,
  computeSankashtiOccurrence,
  groupConsecutiveDays,
  isPredecessorEndsInEvening,
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

    // Pre-fetch D+2 tithi for Pattern 1 Dwadashi-kshaya check.
    const d2Dates = kshayaCandidates.map((d) => new Date(d.date.getTime() + 2 * DAY_MS));
    const d2TithiRows = await findDailyInfoTithiByDates(d2Dates);
    const d2TithiMap = new Map(
      d2TithiRows.map((r) => [
        r.date.toISOString().split("T")[0]!,
        r.tithi as string | null,
      ])
    );

    for (const day of kshayaCandidates) {
      if (maasValues && (!day.maas || !maasValues.includes(day.maas))) continue;
      if (
        !isPredecessorEndsInEvening({
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
        // Pattern 1: Ekadashi kshaya — Dashami ends in afternoon AND D+2=TRAYODASHI.
        // Purnima excluded: DP always shows one day per Purnima festival (udaya tithi).
        // Amavasya excluded: udaya tithi only, no Smarta/Vaishnava split.
        const endMin = parseTimeToMinutes(day.tithiEndTime ?? "");
        const srMin = parseTimeToMinutes(day.sunrise ?? "");
        const ssMin = parseTimeToMinutes(day.sunset ?? "");
        const d2Key = new Date(day.date.getTime() + 2 * DAY_MS)
          .toISOString()
          .split("T")[0]!;
        const d2Tithi = d2TithiMap.get(d2Key);
        const isDwadashiKshaya =
          d2Tithi === Tithi.TRAYODASHI_SHUKLA || d2Tithi === Tithi.TRAYODASHI_KRISHNA;
        const isEkadashiPredecessor =
          predecessorTithi === Tithi.DASHAMI_SHUKLA ||
          predecessorTithi === Tithi.DASHAMI_KRISHNA;
        if (
          endMin !== null &&
          srMin !== null &&
          ssMin !== null &&
          endMin > srMin &&
          endMin < ssMin &&
          isEkadashiPredecessor &&
          isDwadashiKshaya
        ) {
          kshayaWindowExtras.push({
            firstDay: {
              date: day.date,
              tithiEndTime: null,
              maas: day.maas,
              isAdhika: day.isAdhika,
              sunrise: null,
              moonrise: null,
            },
            lastDay: {
              date: day.date,
              tithiEndTime: null,
              maas: day.maas,
              isAdhika: day.isAdhika,
              sunrise: null,
              moonrise: null,
            },
          });
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
      // For Ekadashi kshaya, also emit D+1 as Vaishnava occurrence.
      if (
        predecessorTithi === Tithi.DASHAMI_SHUKLA ||
        predecessorTithi === Tithi.DASHAMI_KRISHNA
      ) {
        const extraD1 = {
          date: new Date(occDate.getTime() + DAY_MS),
          tithiEndTime: null as string | null,
          maas: day.maas,
          isAdhika: day.isAdhika,
          sunrise: null as string | null,
          moonrise: null as string | null,
        };
        kshayaWindowExtras.push({ firstDay: extraD1, lastDay: extraD1 });
      }
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
    const expectedPredecessor = event.tithi
      ? TITHI_PREDECESSOR[event.tithi as Tithi]
      : undefined;
    return finalWindows.map(({ firstDay }) => {
      const key = firstDay.date.toISOString().split("T")[0]!;
      const prevInfo = prevDayMap.get(key);
      const currentSunrise = currentSunriseMap.get(key) ?? null;
      // Skip kshaya months where prevDay is not the direct predecessor tithi.
      if (expectedPredecessor && prevInfo?.tithi !== expectedPredecessor) {
        return { date: firstDay.date };
      }
      if (prevInfo && isNishitakalDateShiftNeeded(prevInfo, currentSunrise)) {
        const prevDate = new Date(firstDay.date.getTime() - 24 * 60 * 60 * 1000);
        return { date: prevDate };
      }
      return { date: firstDay.date };
    });
  }

  if (config.dateRule === "SANKASHTI") {
    const prevDayMap = await fetchPreviousDayData(
      finalWindows.map((w) => w.firstDay.date)
    );
    return finalWindows.map(({ firstDay, lastDay }) =>
      computeSankashtiOccurrence(firstDay, lastDay, prevDayMap)
    );
  }

  if (event.eventType === EventType.VRAT) {
    const prevDayMap = await fetchPreviousDayData(
      finalWindows.map((w) => w.firstDay.date)
    );
    const baseOccurrences = finalWindows.map(({ firstDay, lastDay }) =>
      computeTithiOccurrence(firstDay, lastDay, prevDayMap)
    );
    // Sub-pattern 2a: Vaishnava D+1 when Ekadashi ends before D+1 sunrise.
    // Only applies to Ekadashi; other vrat tithis must not emit this extra.
    if (event.tithi !== Tithi.EKADASHI_SHUKLA && event.tithi !== Tithi.EKADASHI_KRISHNA) {
      return baseOccurrences;
    }
    const extra2a: GeneratedOccurrence[] = [];
    for (const { firstDay } of finalWindows) {
      const endMin = parseTimeToMinutes(firstDay.tithiEndTime ?? "");
      const srMin = parseTimeToMinutes(firstDay.sunrise ?? "");
      if (endMin !== null && srMin !== null && endMin < srMin) {
        extra2a.push({ date: new Date(firstDay.date.getTime() + 24 * 60 * 60 * 1000) });
      }
    }
    if (extra2a.length === 0) return baseOccurrences;
    return [...baseOccurrences, ...extra2a].sort(
      (a, b) => a.date.getTime() - b.date.getTime()
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

  // preferPredecessorDay / kshayaNextDay are only implemented in the yearly-lunar
  // path. Warn loudly instead of silently ignoring them for a monthly event.
  if (config.preferPredecessorDay || config.kshayaNextDay) {
    logWarn(
      `Monthly event "${event.name}" sets preferPredecessorDay/kshayaNextDay, ` +
        "which are only honored in the yearly-lunar path and are ignored here."
    );
  }

  let occurrences: GeneratedOccurrence[];

  if (nishitakalDateRule) {
    const firstDayDates = windows.map((w) => w.firstDay.date);
    const currentDayRows = await findDailyInfoSunriseByDates(firstDayDates);
    const currentSunriseMap = new Map(
      currentDayRows.map((r) => [r.date.toISOString().split("T")[0]!, r.sunrise])
    );
    const expectedPredecessor = event.tithi
      ? TITHI_PREDECESSOR[event.tithi as Tithi]
      : undefined;
    occurrences = windows.map(({ firstDay }) => {
      const key = firstDay.date.toISOString().split("T")[0]!;
      const prevInfo = prevDayMap.get(key);
      const currentSunrise = currentSunriseMap.get(key) ?? null;
      // Skip kshaya months where prevDay is not the direct predecessor tithi.
      if (expectedPredecessor && prevInfo?.tithi !== expectedPredecessor) {
        return { date: firstDay.date };
      }
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
        !isPredecessorEndsInEvening({
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
