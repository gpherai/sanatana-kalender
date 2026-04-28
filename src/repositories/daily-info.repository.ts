/**
 * Daily Info Repository
 *
 * Data access layer for DailyInfo read-model queries.
 *
 * @module repositories/daily-info
 */

import type { MoonPhaseType, Nakshatra, Prisma, Sankranti, Tithi } from "@prisma/client";
import { prisma } from "@/lib/db";

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

export function findDailyInfoSunTimesByDates(dates: Date[]) {
  return prisma.dailyInfo.findMany({
    where: { date: { in: dates } },
    select: {
      date: true,
      sunrise: true,
      sunset: true,
    },
  });
}

export function findDailyInfoSunriseByDates(dates: Date[]) {
  return prisma.dailyInfo.findMany({
    where: { date: { in: dates } },
    select: { date: true, sunrise: true },
  });
}

export function findDailyInfoTithiByDates(dates: Date[]) {
  return prisma.dailyInfo.findMany({
    where: { date: { in: dates } },
    select: { date: true, tithi: true },
  });
}

export function findDailyInfoPreviousDayTimingRows(dates: Date[]) {
  const previousDates = dates.map((date) => {
    const previousDate = new Date(date);
    previousDate.setUTCDate(previousDate.getUTCDate() - 1);
    return previousDate;
  });

  return prisma.dailyInfo.findMany({
    where: { date: { in: previousDates } },
    select: { date: true, tithiEndTime: true, sunrise: true, sunset: true },
  });
}

export function findDailyInfoSankrantiOccurrences(
  { startDate, endDate }: DateRange,
  sankranti: Sankranti
) {
  return prisma.dailyInfo.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      sankranti,
    },
    select: { date: true, sankrantiTime: true },
    orderBy: { date: "asc" },
  });
}

export function findDailyInfoAllSankrantiOccurrences({ startDate, endDate }: DateRange) {
  return prisma.dailyInfo.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      sankranti: { not: null },
    },
    select: { date: true, sankranti: true, sankrantiTime: true },
    orderBy: { date: "asc" },
  });
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
    orderBy: { moonPhasePercent: "desc" },
    select: { date: true, moonPhasePercent: true },
  });
}

export function findDailyInfoYearlyLunarCandidates(
  { startDate, endDate }: DateRange,
  tithi: Tithi,
  adhikaFilter: DailyInfoAdhikaFilter
) {
  const where: Prisma.DailyInfoWhereInput = {
    date: { gte: startDate, lte: endDate },
    tithi,
  };
  applyAdhikaFilter(where, adhikaFilter);

  return prisma.dailyInfo.findMany({
    where,
    orderBy: { date: "asc" },
    select: {
      date: true,
      tithiEndTime: true,
      maas: true,
      isAdhika: true,
    },
  });
}

export function findDailyInfoKshayaCandidates(
  { startDate, endDate }: DateRange,
  predecessorTithi: Tithi,
  adhikaFilter: DailyInfoAdhikaFilter = "include"
) {
  const where: Prisma.DailyInfoWhereInput = {
    date: { gte: startDate, lte: endDate },
    tithi: predecessorTithi,
  };
  applyAdhikaFilter(where, adhikaFilter);

  return prisma.dailyInfo.findMany({
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
}

export function findDailyInfoNakshatraCandidates(
  { startDate, endDate }: DateRange,
  nakshatra: Nakshatra
) {
  return prisma.dailyInfo.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      nakshatra,
      isAdhika: false,
    },
    orderBy: { date: "asc" },
    select: { date: true, nakshatraEndTime: true, maas: true },
  });
}

export function findDailyInfoTithiTimingCandidates(
  { startDate, endDate }: DateRange,
  tithi: Tithi,
  options: { excludeAdhika?: boolean } = {}
) {
  return prisma.dailyInfo.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      tithi,
      ...(options.excludeAdhika && { isAdhika: false }),
    },
    orderBy: { date: "asc" },
    select: { date: true, tithiEndTime: true },
  });
}

export function findDailyInfoPradoshCandidates(
  { startDate, endDate }: DateRange,
  tithis: Tithi[]
) {
  return prisma.dailyInfo.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      tithi: { in: tithis },
    },
    orderBy: { date: "asc" },
    select: { date: true, tithiEndTime: true, sunrise: true, sunset: true },
  });
}

export function findDailyInfoHeatmapData(startDate: Date, endDate: Date) {
  return prisma.dailyInfo.findMany({
    where: { date: { gte: startDate, lte: endDate } },
    select: { date: true, tithi: true, moonPhaseType: true },
    orderBy: { date: "asc" },
  });
}
