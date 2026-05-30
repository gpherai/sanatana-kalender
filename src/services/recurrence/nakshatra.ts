import "server-only";
import type { Event } from "@prisma/client";
import { Tithi, Nakshatra, Maas } from "@prisma/client";
import {
  asRuleConfig,
  type NakshatraRuleConfig,
  type TithiNakshatraRuleConfig,
} from "@/config/rule-config.types";
import {
  findDailyInfoNakshatraCandidates,
  findDailyInfoTithiNakshatraCandidates,
} from "@/repositories/daily-info.repository";
import { logWarn } from "@/lib/utils";
import { parseTimeToMinutes, formatMinutesToTime } from "@/lib/timing-utils";
import { getAdhikaFilter } from "./helpers";
import type { GeneratedOccurrence } from "./types";

// =============================================================================
// NAKSHATRA RULE-BASED GENERATION
// =============================================================================

export async function generateNakshatraRuleOccurrences(
  event: Event,
  startDate: Date,
  endDate: Date
): Promise<GeneratedOccurrence[]> {
  const config = asRuleConfig<NakshatraRuleConfig>(event.ruleConfig);
  const nakshatraValue = config.nakshatra ?? event.nakshatra;

  if (!nakshatraValue) {
    logWarn(`Nakshatra event "${event.name}" has no nakshatra specified`);
    return [];
  }

  const validNakshatraValues = Object.values(Nakshatra) as string[];
  if (!validNakshatraValues.includes(nakshatraValue)) {
    logWarn(
      `Nakshatra event "${event.name}" has invalid nakshatra value: "${nakshatraValue}"`
    );
    return [];
  }

  const dailyData = await findDailyInfoNakshatraCandidates(
    { startDate, endDate },
    nakshatraValue as Nakshatra,
    getAdhikaFilter(event)
  );

  if (config.maargazhiRule === true) {
    return dailyData
      .filter((day) => {
        const m = day.date.getUTCMonth() + 1;
        const d = day.date.getUTCDate();
        return (m === 12 && d >= 14) || (m === 1 && d <= 15);
      })
      .map((day) => ({
        date: day.date,
        endTime: day.nakshatraEndTime ?? undefined,
      }));
  }

  const maasFilter = config.maas;
  const occurrencesByYear = new Map<number, (typeof dailyData)[0]>();

  for (const day of dailyData) {
    if (maasFilter && day.maas !== maasFilter) continue;
    const year = day.date.getUTCFullYear();
    if (!occurrencesByYear.has(year)) {
      occurrencesByYear.set(year, day);
    }
  }

  return Array.from(occurrencesByYear.values())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((day) => ({
      date: day.date,
      endTime: day.nakshatraEndTime ?? undefined,
    }));
}

// =============================================================================
// TITHI + NAKSHATRA RULE-BASED GENERATION
// =============================================================================

export async function generateTithiNakshatraRuleOccurrences(
  event: Event,
  startDate: Date,
  endDate: Date
): Promise<GeneratedOccurrence[]> {
  const config = asRuleConfig<TithiNakshatraRuleConfig>(event.ruleConfig);
  const tithiValue = config.tithi ?? event.tithi;
  const nakshatraValue = config.nakshatra ?? event.nakshatra;

  if (!tithiValue) {
    logWarn(`TITHI_NAKSHATRA event "${event.name}" has no tithi specified`);
    return [];
  }
  if (!nakshatraValue) {
    logWarn(`TITHI_NAKSHATRA event "${event.name}" has no nakshatra specified`);
    return [];
  }

  const validTithiValues = Object.values(Tithi) as string[];
  if (!validTithiValues.includes(tithiValue)) {
    logWarn(
      `TITHI_NAKSHATRA event "${event.name}" has invalid tithi value: "${tithiValue}"`
    );
    return [];
  }
  const validNakshatraValues = Object.values(Nakshatra) as string[];
  if (!validNakshatraValues.includes(nakshatraValue)) {
    logWarn(
      `TITHI_NAKSHATRA event "${event.name}" has invalid nakshatra value: "${nakshatraValue}"`
    );
    return [];
  }

  const maasValue = config.maas;
  if (maasValue !== undefined) {
    const validMaasValues = Object.values(Maas) as string[];
    if (!validMaasValues.includes(maasValue)) {
      logWarn(
        `TITHI_NAKSHATRA event "${event.name}" has invalid maas value: "${maasValue}"`
      );
      return [];
    }
  }

  const dailyData = await findDailyInfoTithiNakshatraCandidates(
    { startDate, endDate },
    tithiValue as Tithi,
    nakshatraValue as Nakshatra,
    maasValue as Maas | undefined,
    getAdhikaFilter(event)
  );

  const occurrencesByYear = new Map<number, (typeof dailyData)[0]>();
  for (const day of dailyData) {
    const year = day.date.getUTCFullYear();
    if (!occurrencesByYear.has(year)) {
      occurrencesByYear.set(year, day);
    }
  }

  return Array.from(occurrencesByYear.values())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((day) => {
      const sunriseMin = parseTimeToMinutes(day.sunrise);
      const toEffective = (t: string | null) => {
        const m = parseTimeToMinutes(t);
        if (m === null) return null;
        return sunriseMin !== null && m < sunriseMin ? m + 1440 : m;
      };
      const tEff = toEffective(day.tithiEndTime);
      const nEff = toEffective(day.nakshatraEndTime);
      const minEff =
        tEff !== null && nEff !== null ? Math.min(tEff, nEff) : (tEff ?? nEff);
      const endTime = minEff !== null ? formatMinutesToTime(minEff) : undefined;
      return { date: day.date, endTime };
    });
}
