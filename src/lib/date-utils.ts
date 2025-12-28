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

// =============================================================================
// MOON PHASE CALCULATIONS
// =============================================================================

/**
 * Moon phase calculation constants
 *
 * Based on known new moon of January 6, 2000 at 18:14 UTC
 */
const LUNAR_CYCLE_DAYS = 29.53058867;
const KNOWN_NEW_MOON = new Date(2000, 0, 6, 18, 14).getTime();

/**
 * Moon phase emoji data
 */
interface MoonPhaseEmoji {
  /** Moon emoji character */
  emoji: string;
  /** Whether this is a special phase (full/new moon) */
  isSpecial: "full" | "new" | null;
}

/**
 * Moon phase illumination data
 */
interface MoonPhaseIllumination {
  /** Illumination percentage (0-100) */
  percent: number;
  /** Whether moon is waxing (growing) or waning */
  isWaxing: boolean;
}

/**
 * Complete moon phase information
 */
export interface MoonPhaseInfo extends MoonPhaseEmoji, MoonPhaseIllumination {}

/**
 * Get moon phase emoji and special status for a date
 *
 * Calculates approximate moon phase for display purposes.
 * Not astronomically precise - use for UI only.
 *
 * @param date - Date to get moon phase for
 * @returns Moon emoji and special status
 *
 * @example
 * ```ts
 * getMoonPhaseEmoji(new Date('2024-01-15'))
 * // => { emoji: "🌕", isSpecial: "full" }
 * ```
 */
export function getMoonPhaseEmoji(date: Date): MoonPhaseEmoji {
  const daysSinceKnownNew = (date.getTime() - KNOWN_NEW_MOON) / (1000 * 60 * 60 * 24);
  const cyclePosition = (daysSinceKnownNew % LUNAR_CYCLE_DAYS) / LUNAR_CYCLE_DAYS;

  let emoji = "🌑";
  let isSpecial: "full" | "new" | null = null;

  if (cyclePosition < 0.03 || cyclePosition >= 0.97) {
    emoji = "🌑"; // New moon
    isSpecial = "new";
  } else if (cyclePosition < 0.23) {
    emoji = "🌒"; // Waxing crescent
  } else if (cyclePosition < 0.27) {
    emoji = "🌓"; // First quarter
  } else if (cyclePosition < 0.47) {
    emoji = "🌔"; // Waxing gibbous
  } else if (cyclePosition < 0.53) {
    emoji = "🌕"; // Full moon
    isSpecial = "full";
  } else if (cyclePosition < 0.73) {
    emoji = "🌖"; // Waning gibbous
  } else if (cyclePosition < 0.77) {
    emoji = "🌗"; // Last quarter
  } else {
    emoji = "🌘"; // Waning crescent
  }

  return { emoji, isSpecial };
}

/**
 * Get moon illumination percentage and waxing/waning status
 *
 * @param date - Date to calculate for
 * @returns Illumination percent and waxing status
 *
 * @example
 * ```ts
 * getMoonPhaseIllumination(new Date('2024-01-15'))
 * // => { percent: 98, isWaxing: true }
 * ```
 */
export function getMoonPhaseIllumination(date: Date): MoonPhaseIllumination {
  const daysSinceKnownNew = (date.getTime() - KNOWN_NEW_MOON) / (1000 * 60 * 60 * 24);
  const cyclePosition = (daysSinceKnownNew % LUNAR_CYCLE_DAYS) / LUNAR_CYCLE_DAYS;

  const percent = Math.round(Math.abs(Math.sin(cyclePosition * Math.PI * 2)) * 100);
  const isWaxing = cyclePosition < 0.5;

  return { percent, isWaxing };
}

/**
 * Get complete moon phase information
 *
 * Combines emoji, special status, illumination %, and waxing status.
 *
 * @param date - Date to get moon phase for
 * @returns Complete moon phase data
 *
 * @example
 * ```ts
 * getMoonPhaseInfo(new Date('2024-01-15'))
 * // => {
 * //   emoji: "🌕",
 * //   isSpecial: "full",
 * //   percent: 98,
 * //   isWaxing: true
 * // }
 * ```
 */
export function getMoonPhaseInfo(date: Date): MoonPhaseInfo {
  const emoji = getMoonPhaseEmoji(date);
  const illumination = getMoonPhaseIllumination(date);

  return {
    ...emoji,
    ...illumination,
  };
}
