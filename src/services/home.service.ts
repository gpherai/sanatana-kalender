import "server-only";
import { DateTime } from "luxon";
import { findUpcomingOccurrences } from "@/repositories/event.repository";
import { DEFAULT_LOCATION } from "@/lib/domain";

export const UPCOMING_DAYS_INCLUDING_TODAY = 7;
export const UPCOMING_DAYS_AFTER_TODAY = UPCOMING_DAYS_INCLUDING_TODAY - 1;

export type UpcomingOccurrence = Awaited<
  ReturnType<typeof findUpcomingOccurrences>
>[number];

export function dbDateToLocationDay(
  date: Date,
  timezone = DEFAULT_LOCATION.timezone
): DateTime {
  const dateOnly = DateTime.fromJSDate(date, { zone: "utc" }).toISODate();
  if (!dateOnly) {
    throw new Error(`Invalid occurrence date: ${date.toISOString()}`);
  }
  return DateTime.fromISO(dateOnly, { zone: timezone }).startOf("day");
}

export function getUpcomingOccurrences(
  daysAfterToday: number,
  now: DateTime
): Promise<UpcomingOccurrence[]> {
  return findUpcomingOccurrences(daysAfterToday, now);
}

export function occurrenceOverlapsDay(
  occurrence: UpcomingOccurrence,
  day: DateTime,
  timezone = DEFAULT_LOCATION.timezone
): boolean {
  const start = dbDateToLocationDay(occurrence.date, timezone);
  const end = dbDateToLocationDay(occurrence.endDate ?? occurrence.date, timezone);
  const target = day.startOf("day");
  return start.toMillis() <= target.toMillis() && end.toMillis() >= target.toMillis();
}
