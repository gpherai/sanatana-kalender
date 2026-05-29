/**
 * Daily Info Repository
 *
 * Data access layer for DailyInfo read-model queries.
 *
 * @module repositories/daily-info
 */

import "server-only";
import type {
  Maas,
  MoonPhaseType,
  Nakshatra,
  Prisma,
  Sankranti,
  Tithi,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { dbTimeToStr } from "@/lib/timing-utils";

export type DailyInfoAdhikaFilter = "include" | "only" | "exclude";

interface DateRange {
  startDate: Date;
  endDate: Date;
}

function applyAdhikaFilter(
  where: Prisma.DailyInfoWhereInput,
  filter: DailyInfoAdhikaFilter = "include"
) {
  if (filter === "only") {
    where.isAdhika = true;
  } else if (filter === "exclude") {
    where.isAdhika = false;
  }
}

export async function findDailyInfoSunTimesByDates(dates: Date[]) {
  const rows = await prisma.dailyInfo.findMany({
    where: { date: { in: dates } },
    select: { date: true, sunrise: true, sunset: true },
  });
  return rows.map((r) => ({
    date: r.date,
    sunrise: dbTimeToStr(r.sunrise),
    sunset: dbTimeToStr(r.sunset),
  }));
}

export async function findDailyInfoSunriseByDates(dates: Date[]) {
  const rows = await prisma.dailyInfo.findMany({
    where: { date: { in: dates } },
    select: { date: true, sunrise: true },
  });
  return rows.map((r) => ({ date: r.date, sunrise: dbTimeToStr(r.sunrise) }));
}

export function findDailyInfoTithiByDates(dates: Date[]) {
  return prisma.dailyInfo.findMany({
    where: { date: { in: dates } },
    select: { date: true, tithi: true },
  });
}

export async function findDailyInfoPreviousDayTimingRows(dates: Date[]) {
  const previousDates = dates.map((date) => {
    const previousDate = new Date(date);
    previousDate.setUTCDate(previousDate.getUTCDate() - 1);
    return previousDate;
  });

  const rows = await prisma.dailyInfo.findMany({
    where: { date: { in: previousDates } },
    select: { date: true, tithiEndTime: true, sunrise: true, sunset: true, tithi: true },
  });
  return rows.map((r) => ({
    date: r.date,
    tithiEndTime: dbTimeToStr(r.tithiEndTime),
    sunrise: dbTimeToStr(r.sunrise),
    sunset: dbTimeToStr(r.sunset),
    tithi: r.tithi as string | null,
  }));
}

export async function findDailyInfoSankrantiOccurrences(
  { startDate, endDate }: DateRange,
  sankranti: Sankranti
) {
  const rows = await prisma.dailyInfo.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      sankranti,
    },
    select: { date: true, sankrantiTime: true, sunrise: true, sunset: true },
    orderBy: { date: "asc" },
  });
  return rows.map((r) => ({
    ...r,
    sankrantiTime: dbTimeToStr(r.sankrantiTime),
    sunrise: dbTimeToStr(r.sunrise),
    sunset: dbTimeToStr(r.sunset),
  }));
}

export async function findDailyInfoAllSankrantiOccurrences({
  startDate,
  endDate,
}: DateRange) {
  const rows = await prisma.dailyInfo.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      sankranti: { not: null },
    },
    select: {
      date: true,
      sankranti: true,
      sankrantiTime: true,
      sunrise: true,
      sunset: true,
    },
    orderBy: { date: "asc" },
  });
  return rows.map((r) => ({
    ...r,
    sankrantiTime: dbTimeToStr(r.sankrantiTime),
    sunrise: dbTimeToStr(r.sunrise),
    sunset: dbTimeToStr(r.sunset),
  }));
}

export function findDailyInfoMoonPhaseCandidates(
  dates: Date[],
  targetPhase: MoonPhaseType
) {
  return prisma.dailyInfo.findMany({
    where: {
      date: { in: dates },
      moonPhaseType: targetPhase,
    },
    orderBy: [{ moonPhasePercent: "desc" }, { date: "asc" }],
    select: { date: true, moonPhasePercent: true },
  });
}

export async function findDailyInfoYearlyLunarCandidates(
  { startDate, endDate }: DateRange,
  tithi: Tithi,
  adhikaFilter: DailyInfoAdhikaFilter
) {
  const where: Prisma.DailyInfoWhereInput = {
    date: { gte: startDate, lte: endDate },
    tithi,
  };
  applyAdhikaFilter(where, adhikaFilter);

  const rows = await prisma.dailyInfo.findMany({
    where,
    orderBy: { date: "asc" },
    select: {
      date: true,
      tithiEndTime: true,
      maas: true,
      isAdhika: true,
      sunrise: true,
      moonrise: true,
    },
  });
  return rows.map((r) => ({
    ...r,
    tithiEndTime: dbTimeToStr(r.tithiEndTime),
    sunrise: dbTimeToStr(r.sunrise),
    moonrise: dbTimeToStr(r.moonrise),
  }));
}

export async function findDailyInfoKshayaCandidates(
  { startDate, endDate }: DateRange,
  predecessorTithi: Tithi,
  adhikaFilter: DailyInfoAdhikaFilter = "include"
) {
  const where: Prisma.DailyInfoWhereInput = {
    date: { gte: startDate, lte: endDate },
    tithi: predecessorTithi,
  };
  applyAdhikaFilter(where, adhikaFilter);

  const rows = await prisma.dailyInfo.findMany({
    where,
    select: {
      date: true,
      tithiEndTime: true,
      sunrise: true,
      maas: true,
      isAdhika: true,
    },
    orderBy: { date: "asc" },
  });
  return rows.map((r) => ({
    ...r,
    tithiEndTime: dbTimeToStr(r.tithiEndTime),
    sunrise: dbTimeToStr(r.sunrise),
  }));
}

export async function findDailyInfoNakshatraCandidates(
  { startDate, endDate }: DateRange,
  nakshatra: Nakshatra,
  adhikaFilter: DailyInfoAdhikaFilter = "exclude"
) {
  const where: Prisma.DailyInfoWhereInput = {
    date: { gte: startDate, lte: endDate },
    nakshatra,
  };
  applyAdhikaFilter(where, adhikaFilter);

  const rows = await prisma.dailyInfo.findMany({
    where,
    orderBy: { date: "asc" },
    select: { date: true, nakshatraEndTime: true, maas: true },
  });
  return rows.map((r) => ({ ...r, nakshatraEndTime: dbTimeToStr(r.nakshatraEndTime) }));
}

export async function findDailyInfoTithiNakshatraCandidates(
  { startDate, endDate }: DateRange,
  tithi: Tithi,
  nakshatra: Nakshatra,
  maas?: Maas,
  adhikaFilter: DailyInfoAdhikaFilter = "exclude"
) {
  const where: Prisma.DailyInfoWhereInput = {
    date: { gte: startDate, lte: endDate },
    tithi,
    nakshatra,
    ...(maas !== undefined && { maas }),
  };
  applyAdhikaFilter(where, adhikaFilter);

  const rows = await prisma.dailyInfo.findMany({
    where,
    orderBy: { date: "asc" },
    select: {
      date: true,
      sunrise: true,
      tithiEndTime: true,
      nakshatraEndTime: true,
      maas: true,
      isAdhika: true,
    },
  });
  return rows.map((r) => ({
    ...r,
    sunrise: dbTimeToStr(r.sunrise),
    tithiEndTime: dbTimeToStr(r.tithiEndTime),
    nakshatraEndTime: dbTimeToStr(r.nakshatraEndTime),
  }));
}

export async function findDailyInfoTithiTimingCandidates(
  { startDate, endDate }: DateRange,
  tithi: Tithi,
  options: { excludeAdhika?: boolean } = {}
) {
  const rows = await prisma.dailyInfo.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      tithi,
      ...(options.excludeAdhika && { isAdhika: false }),
    },
    orderBy: { date: "asc" },
    select: { date: true, tithiEndTime: true },
  });
  return rows.map((r) => ({ ...r, tithiEndTime: dbTimeToStr(r.tithiEndTime) }));
}

export async function findDailyInfoPradoshCandidates(
  { startDate, endDate }: DateRange,
  tithis: Tithi[],
  options: { maas?: Maas[] } = {}
) {
  const rows = await prisma.dailyInfo.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      tithi: { in: tithis },
      ...(options.maas && options.maas.length > 0 && { maas: { in: options.maas } }),
    },
    orderBy: { date: "asc" },
    select: { date: true, tithiEndTime: true, sunrise: true, sunset: true },
  });
  return rows.map((r) => ({
    ...r,
    tithiEndTime: dbTimeToStr(r.tithiEndTime),
    sunrise: dbTimeToStr(r.sunrise),
    sunset: dbTimeToStr(r.sunset),
  }));
}

export function findDailyInfoHeatmapData(startDate: Date, endDate: Date) {
  return prisma.dailyInfo.findMany({
    where: { date: { gte: startDate, lte: endDate } },
    select: { date: true, tithi: true, moonPhaseType: true },
    orderBy: { date: "asc" },
  });
}
