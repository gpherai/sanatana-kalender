/**
 * Date Utilities
 *
 * Centralized date/time operations for the Dharma Calendar.
 * All functions use UTC by default to avoid timezone issues.
 *
 * @module date-utils
 */

// =============================================================================
// DATE COMPARISON
// =============================================================================

/**
 * Check if two dates are the same day (in UTC)
 *
 * @param date1 - First date to compare
 * @param date2 - Second date to compare
 * @returns true if dates are the same UTC day
 *
 * @example
 * ```ts
 * isSameDay(new Date('2024-01-15'), new Date('2024-01-15T23:59:59'))
 * // => true
 * ```
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getUTCFullYear() === date2.getUTCFullYear() &&
    date1.getUTCMonth() === date2.getUTCMonth() &&
    date1.getUTCDate() === date2.getUTCDate()
  );
}

/**
 * Check if a date is today (in UTC)
 *
 * @param date - Date to check
 * @returns true if date is today
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
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
    days.push(new Date(Date.UTC(year, month, d)));
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
export function formatDateNL(date: Date): string {
  return date.toLocaleDateString("nl-NL", { day: "numeric", month: "long" });
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
