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
import { todayString, SADHANA_START_DATE } from "@/lib/sadhana-utils";
import type { DayInfo } from "@/components/sadhana/types";
import { panchangaService } from "./panchanga.service";
import {
  transformToApiResponse,
  transformOccurrenceToCalendarEvent,
} from "@/lib/api-transformers";
import { DEFAULT_LOCATION } from "@/lib/domain";
import { DateTime } from "luxon";

export async function getSadhanaDashboardInit() {
  const heatmapStart = SADHANA_START_DATE;
  const heatmapEnd = todayString();

  // Fetch database queries first
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
  ]);

  // Run CPU-intensive Panchanga calculations separately to avoid event loop blocking
  // that causes Prisma connection pool timeouts (5000ms).
  const panchangas = await panchangaService.calculateRange(
    DateTime.fromISO(heatmapStart, { zone: DEFAULT_LOCATION.timezone }).toJSDate(),
    DateTime.fromISO(heatmapEnd, { zone: DEFAULT_LOCATION.timezone }).toJSDate(),
    DEFAULT_LOCATION,
    DEFAULT_LOCATION.timezone
  );

  const heatmapEventsRaw = occurrences.map(transformOccurrenceToCalendarEvent);

  const dayInfoMapEntries = panchangas.map((p) => {
    const apiP = transformToApiResponse(p);
    return [
      p.date,
      {
        tithi: apiP.tithi,
        specialDay: apiP.specialDay,
        moonPhaseEvent: apiP.moonPhaseEvent,
      },
    ] as [string, DayInfo];
  });

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
