/**
 * Date Utilities
 *
 * Centralized date/time operations for the Dharma Calendar.
 *
 * TWO conventions live here, on purpose:
 *  - UTC functions — `parseCalendarDate`, `safeParseDate`, `addDayForDisplay`,
 *    `subtractDayFromDisplay`, `startOfDayUTC`, `endOfDayUTC`, `formatDateISO` —
 *    operate on UTC-midnight `@db.Date` values and are timezone-independent.
 *  - LOCAL-calendar functions — `formatDateLocal`, `formatDateForInput`,
 *    `isSameDay`, `isToday`, `isTomorrow`, `getMonthDays`, `getMonthStartPadding`,
 *    `isWeekend` — use the runtime's LOCAL date components. They are only correct
 *    when the runtime timezone equals the app's fixed-location timezone.
 *
 * CONTRACT: the runtime is pinned to `Europe/Amsterdam`
 * (`DEFAULT_LOCATION.timezone`) via the `TZ` env in `docker-compose.yml` +
 * `docker-compose.prod.yml`. Running/deploying outside that timezone shifts the
 * LOCAL-calendar functions by one day on UTC-midnight inputs; in that case make
 * those functions explicitly TZ-aware (Luxon + `DEFAULT_LOCATION.timezone`).
 *
 * @module date-utils
 */

import { DateTime } from "luxon";
import { DEFAULT_LOCATION } from "@/lib/domain";

/**
 * App-wide display timezone. All `toLocaleDateString` formatters below pin to
 * this so the rendered day is identical regardless of the runtime's ambient TZ.
 */
const APP_TIME_ZONE = DEFAULT_LOCATION.timezone;

// =============================================================================
// DISPLAY CONSTANTS
// =============================================================================

/** Dutch abbreviated month names (index 0 = January) */
export const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mrt",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Okt",
  "Nov",
  "Dec",
] as const;

/** Dutch full month names (index 0 = January) */
export const MONTHS_LONG = [
  "Januari",
  "Februari",
  "Maart",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Augustus",
  "September",
  "Oktober",
  "November",
  "December",
] as const;

// =============================================================================
// DATE VALIDATION
// =============================================================================

/**
 * Check if a date is valid
 */
export function isValidDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

// =============================================================================
// DATE FORMATTING (Display)
// =============================================================================

/**
 * Format date for display (Dutch locale, long format with year)
 * Returns "Ongeldige datum" for invalid dates
 */
export function formatDate(
  date: Date | string | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return "Geen datum";

  const d = typeof date === "string" ? new Date(date) : date;

  if (!isValidDate(d)) {
    return "Ongeldige datum";
  }

  return d.toLocaleDateString("nl-NL", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options,
  });
}

/**
 * Format a short date (e.g., "4 dec")
 */
export function formatShortDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;

  if (!isValidDate(d)) {
    return "Ongeldige datum";
  }

  return d.toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    timeZone: APP_TIME_ZONE,
  });
}

/**
 * Format date for input fields (YYYY-MM-DD).
 * Uses local date components — safe for both UTC-midnight (Prisma) and local-midnight dates.
 * Returns empty string for invalid dates.
 */
export function formatDateForInput(date: Date | string | null | undefined): string {
  if (!date) return "";

  const d = typeof date === "string" ? new Date(date) : date;

  if (!isValidDate(d)) {
    return "";
  }

  return formatDateLocal(d);
}

/**
 * Format date as YYYY-MM-DD using LOCAL date components.
 * CRITICAL: This prevents timezone shifts for calendar events.
 * Example: A date stored as 2025-01-01 stays 2025-01-01 in Nederland.
 */
export function formatDateLocal(date: Date | string | null | undefined): string {
  if (!date) return "";

  const d = typeof date === "string" ? new Date(date) : date;

  if (!isValidDate(d)) {
    return "";
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// =============================================================================
// CALENDAR DATE PARSING (Best Practice for Calendar Events)
// =============================================================================

/**
 * Parse a YYYY-MM-DD date string as LOCAL midnight.
 *
 * Use this when displaying dates to the user — unlike `new Date("YYYY-MM-DD")`
 * which creates UTC midnight (and shifts the date for timezones behind UTC),
 * this creates a Date at local midnight so `toLocaleDateString` always shows
 * the correct day regardless of the user's timezone.
 *
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Date object at local midnight
 */
export function parseLocalDate(dateString: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    throw new Error(`Invalid date format: "${dateString}". Expected YYYY-MM-DD.`);
  }
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year!, month! - 1, day!);
  // Reject calendar overflow (e.g. "2025-13-45" silently rolling into the next
  // month/year via the Date constructor).
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month! - 1 ||
    date.getDate() !== day
  ) {
    throw new Error(`Invalid calendar date: "${dateString}".`);
  }
  return date;
}

/**
 * Parse a date string (YYYY-MM-DD) as a calendar date at UTC midnight.
 *
 * BEST PRACTICE: For calendar events that occur on a specific DAY regardless
 * of timezone, always use UTC midnight to prevent timezone shift bugs when
 * storing in PostgreSQL @db.Date columns.
 *
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Date object at UTC midnight
 * @throws Error if dateString is invalid format
 */
export function parseCalendarDate(dateString: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    throw new Error(`Invalid date format: "${dateString}". Expected YYYY-MM-DD.`);
  }

  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, day!));
  // Reject calendar overflow (e.g. "2025-13-45" silently rolling over).
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month! - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error(`Invalid calendar date: "${dateString}".`);
  }
  return date;
}

/**
 * Safely parse a date string, returning null for invalid inputs.
 */
export function safeParseDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;

  try {
    return parseCalendarDate(dateString);
  } catch {
    return null;
  }
}

// =============================================================================
// DATE ARITHMETIC (react-big-calendar)
// =============================================================================

/**
 * Add one day to a date for react-big-calendar end date display.
 * RBC treats end dates as exclusive, so we need +1 day for correct display.
 */
export function addDayForDisplay(date: Date): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + 1);
  return result;
}

/**
 * Subtract one day from a date (reverse of addDayForDisplay).
 */
export function subtractDayFromDisplay(date: Date): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() - 1);
  return result;
}

// =============================================================================
// DAY BOUNDARIES
// =============================================================================

/**
 * Get the start of a day in UTC (00:00:00.000)
 */
export function startOfDayUTC(date: Date): Date {
  const result = new Date(date);
  result.setUTCHours(0, 0, 0, 0);
  return result;
}

/**
 * Get the end of a day in UTC (23:59:59.999)
 */
export function endOfDayUTC(date: Date): Date {
  const result = new Date(date);
  result.setUTCHours(23, 59, 59, 999);
  return result;
}

// =============================================================================
// DATE COMPARISON
// =============================================================================

/**
 * Check if two dates are the same local calendar day.
 *
 * @param date1 - First date to compare
 * @param date2 - Second date to compare
 * @returns true if both dates fall on the same local day
 *
 * @example
 * ```ts
 * isSameDay(new Date('2024-01-15'), new Date('2024-01-15T23:59:59'))
 * // => true
 * ```
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Check if a date is today (local time)
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * Check if a date is tomorrow (local time)
 */
export function isTomorrow(date: Date): boolean {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return isSameDay(date, tomorrow);
}

/**
 * Number of calendar days a range spans, inclusive on both ends.
 * e.g. April 1 → April 3 = 3 days.
 */
export function getDurationDays(start: Date, end: Date): number {
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Check if date is weekend (Saturday or Sunday)
 *
 * @param date - Date to check
 * @returns true if Saturday or Sunday
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

// =============================================================================
// CALENDAR HELPERS
// =============================================================================

/**
 * Get all days in a given month
 *
 * @param year - Full year (e.g. 2024)
 * @param month - Month index (0-11, where 0 = January)
 * @returns Array of Date objects for each day in the month
 *
 * @example
 * ```ts
 * getMonthDays(2024, 0) // Returns 31 dates for January 2024
 * ```
 */
export function getMonthDays(year: number, month: number): Date[] {
  const days: Date[] = [];
  const lastDay = new Date(year, month + 1, 0);

  for (let d = 1; d <= lastDay.getDate(); d++) {
    // Use local dates (matching getMonthStartPadding) to avoid timezone-driven
    // off-by-one errors on the calendar grid.
    days.push(new Date(year, month, d));
  }
  return days;
}

/**
 * Get padding days for calendar grid (Monday-first week)
 *
 * Calculates how many empty cells are needed before the first day
 * of the month in a Monday-first calendar grid.
 *
 * @param year - Full year
 * @param month - Month index (0-11)
 * @returns Number of padding days (0-6)
 *
 * @example
 * ```ts
 * // If month starts on Wednesday
 * getMonthStartPadding(2024, 0) // => 2 (Mon, Tue are padding)
 * ```
 */
export function getMonthStartPadding(year: number, month: number): number {
  const firstDay = new Date(year, month, 1);
  // Convert Sunday=0 to Sunday=6, Monday=1 to Monday=0, etc.
  return (firstDay.getDay() + 6) % 7;
}

// =============================================================================
// DATE FORMATTING
// =============================================================================

/**
 * Format date as ISO date string (YYYY-MM-DD)
 *
 * @param date - Date to format
 * @returns ISO date string
 *
 * @example
 * ```ts
 * formatDateISO(new Date('2024-01-15T10:30:00'))
 * // => "2024-01-15"
 * ```
 */
export function formatDateISO(date: Date): string {
  return date.toISOString().split("T")[0]!;
}

/**
 * Format date for Dutch display (long format)
 *
 * @param date - Date to format
 * @returns Dutch formatted date (e.g. "15 januari")
 *
 * @example
 * ```ts
 * formatDateNL(new Date('2024-01-15'))
 * // => "15 januari"
 * ```
 */
export function formatDateNL(date: Date, options?: Intl.DateTimeFormatOptions): string {
  return date.toLocaleDateString("nl-NL", {
    timeZone: APP_TIME_ZONE,
    day: "numeric",
    month: "long",
    ...options,
  });
}

/**
 * Format date with full weekday, day, month and year (Dutch locale).
 * Accepts Date or YYYY-MM-DD string.
 *
 * @example
 * ```ts
 * formatLongDate(new Date('2026-03-28'))
 * // => "zaterdag 28 maart 2026"
 * ```
 */
export function formatLongDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (!isValidDate(d)) return "Ongeldige datum";
  return d.toLocaleDateString("nl-NL", {
    timeZone: APP_TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Format a future date as a relative string using Intl.RelativeTimeFormat (Dutch).
 * Returns null for past dates or the current moment.
 *
 * @example
 * ```ts
 * formatRelativeDate(new Date('2026-06-28')) // => "over 3 maanden"
 * formatRelativeDate(new Date('2025-01-01')) // => null (past)
 * ```
 */
export function formatRelativeDate(date: Date): string | null {
  const diffMs = date.getTime() - Date.now();
  if (diffMs <= 0) return null;

  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const rtf = new Intl.RelativeTimeFormat("nl-NL", { numeric: "always" });

  if (diffDays < 7) return rtf.format(diffDays, "day");
  const diffWeeks = Math.round(diffDays / 7);
  if (diffWeeks < 5) return rtf.format(diffWeeks, "week");
  const diffMonths = Math.round(diffDays / 30.44);
  if (diffMonths < 12) return rtf.format(diffMonths, "month");
  return rtf.format(Math.round(diffDays / 365.25), "year");
}

/**
 * Format time difference as relative string
 *
 * Formats time as "over X hours" or "X hours ago" for Dutch display.
 *
 * @param timeStr - Time string in HH:MM format (e.g. "14:30")
 * @param now - Reference date/time (defaults to current time)
 * @returns Formatted relative time string
 *
 * @example
 * ```ts
 * const now = new Date('2024-01-15T10:00:00');
 * formatTimeAgo("14:30", now) // => "over 4u 30m"
 * formatTimeAgo("08:30", now) // => "1u 30m geleden"
 * ```
 */
/**
 * Format a full ISO datetime string as a relative time string.
 * Unlike formatTimeAgo, this preserves the date so cross-day events
 * (e.g. moonset tomorrow at 07:13) are correctly shown as "over 12u 53m"
 * instead of "11u 6m geleden".
 */
export function formatIsoTimeAgo(isoStr: string | null, now: Date = new Date()): string {
  if (!isoStr) return "—";

  const eventTime = new Date(isoStr);
  if (isNaN(eventTime.getTime())) return "—";

  const diff = eventTime.getTime() - now.getTime();
  const absDiff = Math.abs(diff);
  const hoursDiff = Math.floor(absDiff / (1000 * 60 * 60));
  const minsDiff = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));

  if (diff > 0) {
    if (hoursDiff > 0) return `over ${hoursDiff}u ${minsDiff}m`;
    return `over ${minsDiff}m`;
  } else {
    if (hoursDiff > 0) return `${hoursDiff}u ${minsDiff}m geleden`;
    return `${minsDiff}m geleden`;
  }
}

export function formatTimeAgo(timeStr: string | null, now: Date = new Date()): string {
  if (!timeStr) return "—";

  const parts = timeStr.split(":").map(Number);
  const hours = parts[0];
  const minutes = parts[1];
  if (hours === undefined || minutes === undefined) return "—";

  const eventTime = new Date(now);
  eventTime.setHours(hours, minutes, 0, 0);

  const diff = eventTime.getTime() - now.getTime();
  const absDiff = Math.abs(diff);
  const hoursDiff = Math.floor(absDiff / (1000 * 60 * 60));
  const minsDiff = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));

  if (diff > 0) {
    if (hoursDiff > 0) return `over ${hoursDiff}u ${minsDiff}m`;
    return `over ${minsDiff}m`;
  } else {
    if (hoursDiff > 0) return `${hoursDiff}u ${minsDiff}m geleden`;
    return `${minsDiff}m geleden`;
  }
}

// ============================================================================
// DATE-ONLY HELPERS (string "YYYY-MM-DD" ↔ Date, UTC-based)
// ============================================================================

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
