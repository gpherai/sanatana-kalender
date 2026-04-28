import {
  getSadhanaToday,
  getSadhanaStreak,
  getSadhanaOverview,
  getSadhanaCalendar,
  listSadhanaSessions,
  listSadhanaPractices,
  getGoalsWithProgress,
  listSadhanaRoutines,
} from "./sadhana.service";
import { findEventOccurrences } from "@/repositories/event.repository";
import { findDailyInfoHeatmapData } from "@/repositories/daily-info.repository";
import { todayString, SADHANA_START_DATE } from "@/lib/sadhana-utils";
import type { DayInfo } from "@/components/sadhana/types";
import { transformOccurrenceToCalendarEvent } from "@/lib/api-transformers";
import { deriveDayInfoFromDailyInfo } from "@/lib/panchanga-helpers";
import { utcDateFromDateOnly, dateOnlyFromUtcDate } from "@/lib/default-location-date";

export async function getSadhanaDashboardInit() {
  const heatmapStart = SADHANA_START_DATE;
  const heatmapEnd = todayString();

  const [
    todayStats,
    streak,
    overview,
    calDays,
    sessions,
    allPractices,
    goals,
    routines,
    occurrences,
    heatmapRows,
  ] = await Promise.all([
    getSadhanaToday(),
    getSadhanaStreak(),
    getSadhanaOverview(),
    getSadhanaCalendar({ start: heatmapStart, end: heatmapEnd }),
    listSadhanaSessions({ from: heatmapStart }),
    listSadhanaPractices(false),
    getGoalsWithProgress(),
    listSadhanaRoutines(),
    findEventOccurrences({
      start: heatmapStart,
      end: heatmapEnd,
      sortBy: "date",
      order: "asc",
    }),
    findDailyInfoHeatmapData(
      utcDateFromDateOnly(heatmapStart),
      utcDateFromDateOnly(heatmapEnd)
    ),
  ]);

  const heatmapEventsRaw = occurrences.map(transformOccurrenceToCalendarEvent);

  const dayInfoMapEntries = heatmapRows.map(
    (row) =>
      [
        dateOnlyFromUtcDate(row.date),
        deriveDayInfoFromDailyInfo(row.tithi, row.moonPhaseType, row.date),
      ] as [string, DayInfo]
  );

  return {
    todayStats,
    streak,
    overview,
    calDays,
    sessions,
    allPractices,
    goals,
    routines,
    heatmapEventsRaw,
    dayInfoMapEntries,
    heatmapStart,
    heatmapEnd,
  };
}
