import "server-only";
import { DateTime } from "luxon";
import { findAllCategories } from "@/repositories/category.repository";
import { findUpcomingOccurrences } from "@/repositories/event.repository";
import { DEFAULT_LOCATION } from "@/lib/domain";
import { transformToApiResponse } from "@/lib/api-transformers";
import { logError } from "@/lib/utils";
import { panchangaService } from "@/services/panchanga.service";
import { getWeatherDashboard } from "@/services/weather.service";

const UPCOMING_DAYS_INCLUDING_TODAY = 7;
const UPCOMING_DAYS_AFTER_TODAY = UPCOMING_DAYS_INCLUDING_TODAY - 1;

type UpcomingOccurrence = Awaited<ReturnType<typeof findUpcomingOccurrences>>[number];

function dbDateToLocationDay(date: Date, timezone = DEFAULT_LOCATION.timezone): DateTime {
  const dateOnly = DateTime.fromJSDate(date, { zone: "utc" }).toISODate();
  if (!dateOnly) {
    throw new Error(`Invalid occurrence date: ${date.toISOString()}`);
  }

  return DateTime.fromISO(dateOnly, { zone: timezone }).startOf("day");
}

function occurrenceOverlapsDay(
  occurrence: UpcomingOccurrence,
  day: DateTime,
  timezone = DEFAULT_LOCATION.timezone
): boolean {
  const start = dbDateToLocationDay(occurrence.date, timezone);
  const end = dbDateToLocationDay(occurrence.endDate ?? occurrence.date, timezone);
  const target = day.startOf("day");

  return start.toMillis() <= target.toMillis() && end.toMillis() >= target.toMillis();
}

export async function getHomePageData(
  now = DateTime.now().setZone(DEFAULT_LOCATION.timezone)
) {
  const today = now.startOf("day");

  const [upcomingEvents, categories, weatherDash, rawPanchanga] = await Promise.all([
    findUpcomingOccurrences(UPCOMING_DAYS_AFTER_TODAY, now),
    findAllCategories(),
    getWeatherDashboard().catch((error) => {
      logError("[Home] Failed to fetch weather dashboard", error);
      return null;
    }),
    panchangaService.calculateDaily(
      now.toJSDate(),
      DEFAULT_LOCATION,
      DEFAULT_LOCATION.timezone
    ),
  ]);

  const todayEvents = upcomingEvents
    .filter((occurrence) =>
      occurrenceOverlapsDay(occurrence, today, DEFAULT_LOCATION.timezone)
    )
    .map((occurrence) => ({
      id: occurrence.event.id,
      name: occurrence.event.name,
      category: occurrence.event.categories[0]?.category ?? null,
      eventType: occurrence.event.eventType,
      date: dbDateToLocationDay(occurrence.date, DEFAULT_LOCATION.timezone).toISODate()!,
    }));

  return {
    todayYear: today.year,
    upcomingEvents,
    categories,
    weatherDash,
    dailyInfo: transformToApiResponse(rawPanchanga),
    todayEvents,
  };
}
