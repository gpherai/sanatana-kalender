import { DateTime } from "luxon";
import { DEFAULT_LOCATION } from "@/lib/domain";

export function defaultLocationDate(date: Date = new Date()): string {
  return DateTime.fromJSDate(date).setZone(DEFAULT_LOCATION.timezone).toISODate()!;
}

export function utcDateFromDateOnly(date: string): Date {
  return DateTime.fromISO(date, { zone: "utc" }).startOf("day").toJSDate();
}

export function dateOnlyFromUtcDate(date: Date): string {
  return DateTime.fromJSDate(date, { zone: "utc" }).toISODate()!;
}

export function addDaysDateOnly(date: string, days: number): string {
  return DateTime.fromISO(date, { zone: "utc" }).plus({ days }).toISODate()!;
}

export function eachDateOnlyInRange(start: string, end: string): string[] {
  const days: string[] = [];
  let current = start;
  while (current <= end) {
    days.push(current);
    current = addDaysDateOnly(current, 1);
  }
  return days;
}
