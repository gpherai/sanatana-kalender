import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// ============================================================================
// Class Name Utilities
// ============================================================================

/**
 * Combines clsx and tailwind-merge for conditional class names
 * Usage: cn("base-class", conditional && "conditional-class", "override-class")
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================================
// Date Formatting
// ============================================================================

/**
 * Check if a date is valid
 */
export function isValidDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Format date for display (Dutch locale)
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
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options,
  });
}

/**
 * Format date for input fields (YYYY-MM-DD)
 * Returns empty string for invalid dates
 */
export function formatDateForInput(date: Date | string | null | undefined): string {
  if (!date) return "";

  const d = typeof date === "string" ? new Date(date) : date;

  if (!isValidDate(d)) {
    return "";
  }

  const parts = d.toISOString().split("T");
  return parts[0] ?? "";
}

/**
 * Format date as YYYY-MM-DD using LOCAL date components
 * CRITICAL: This prevents timezone shifts for calendar events
 * Example: A date stored as 2025-01-01 stays 2025-01-01 in Nederland
 */
export function formatDateLocal(date: Date | string | null | undefined): string {
  if (!date) return "";

  const d = typeof date === "string" ? new Date(date) : date;

  if (!isValidDate(d)) {
    return "";
  }

  // Use local date components (no timezone conversion)
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
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
  });
}

// ============================================================================
// Calendar Date Parsing (Best Practice for Calendar Events)
// ============================================================================

/**
 * Parse a date string (YYYY-MM-DD) as a calendar date.
 *
 * BEST PRACTICE: For calendar events (festivals, birthdays, holidays) that occur
 * on a specific DAY regardless of timezone, ALWAYS use UTC midnight to prevent
 * timezone shift bugs when storing in PostgreSQL @db.Date columns.
 *
 * This creates a Date object at UTC midnight, preventing timezone shift bugs where
 * "2025-01-01 00:00 CET" (local midnight) becomes "2024-12-31 23:00 UTC" when
 * PostgreSQL extracts the date component, resulting in the wrong day in the database.
 *
 * Use this for:
 * - EventOccurrence.date / endDate (calendar days)
 * - DailyInfo.date (astronomical data per day)
 * - Any "this happens on date X" events
 *
 * DO NOT use for:
 * - Timestamps with specific times (use Date with timezone)
 * - Server logs, API timestamps (use ISO strings)
 *
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Date object at UTC midnight (prevents timezone shift in @db.Date storage)
 * @throws Error if dateString is invalid format
 *
 * @example
 * parseCalendarDate("2025-01-01")
 * // → new Date(Date.UTC(2025, 0, 1))
 * // → Date representing 2025-01-01 00:00:00 UTC
 * // Stored in PostgreSQL DATE column as "2025-01-01" ✅
 *
 * @example
 * // WRONG: Using local midnight causes -1 day offset in Netherlands (UTC+1)
 * new Date(2025, 0, 1) // 2025-01-01 00:00:00 CET
 * // → Converted to UTC: 2024-12-31 23:00:00 UTC
 * // → Stored in @db.Date as "2024-12-31" ❌
 */
export function parseCalendarDate(dateString: string): Date {
  // Validate format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    throw new Error(`Invalid date format: "${dateString}". Expected YYYY-MM-DD.`);
  }

  const [year, month, day] = dateString.split('-').map(Number);

  // Create date at UTC midnight to prevent timezone shift when storing in @db.Date
  // PostgreSQL DATE columns strip time, so we must ensure the date component is correct
  // Using Date.UTC prevents "2025-01-01 00:00 CET" → "2024-12-31 23:00 UTC" → "2024-12-31" in DB
  const date = new Date(Date.UTC(year!, month! - 1, day!));

  if (!isValidDate(date)) {
    throw new Error(`Invalid date value: "${dateString}".`);
  }

  return date;
}

// ============================================================================
// UTC Date Creation & Parsing (For Timestamps Only)
// ============================================================================
//
// NOTE: These functions are intentionally kept for edge cases where UTC
// timestamps are needed (server logs, API timestamps). They are NOT used
// in the current codebase but provide a safe fallback for future timestamp
// requirements.
//
// For calendar events, ALWAYS use parseCalendarDate() instead.
// ============================================================================

/**
 * Create UTC date from year, month, day at midnight.
 * Month is 1-indexed (January = 1).
 *
 * @deprecated Use parseCalendarDate() for calendar events.
 * Only use this for timestamps that need UTC (server logs, API timestamps).
 *
 * CURRENT USAGE: None (kept for potential future timestamp needs)
 *
 * @param year - Year (e.g., 2025)
 * @param month - Month (1-12, where 1 = January)
 * @param day - Day of month (1-31)
 * @returns Date at UTC midnight
 */
export function createUTCDate(year: number, month: number, day: number): Date {
  // Validate inputs
  if (month < 1 || month > 12) {
    throw new Error(`Invalid month: ${month}. Must be 1-12.`);
  }
  if (day < 1 || day > 31) {
    throw new Error(`Invalid day: ${day}. Must be 1-31.`);
  }

  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Parse a date string (YYYY-MM-DD) to UTC midnight.
 *
 * @deprecated Use parseCalendarDate() for calendar events.
 * This function can cause timezone bugs for calendar dates!
 *
 * CURRENT USAGE: None (kept for potential future timestamp needs)
 *
 * Only use for:
 * - Server timestamps
 * - API logs
 * - Times that need UTC explicitly
 *
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Date at UTC midnight
 * @throws Error if dateString is invalid format
 */
export function parseToUTCDate(dateString: string): Date {
  // Validate format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    throw new Error(`Invalid date format: "${dateString}". Expected YYYY-MM-DD.`);
  }

  const date = new Date(dateString + "T00:00:00.000Z");

  if (!isValidDate(date)) {
    throw new Error(`Invalid date value: "${dateString}".`);
  }

  return date;
}

/**
 * Safely parse a date string, returning null for invalid inputs
 * Use when you want to handle errors gracefully
 */
export function safeParseDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;

  try {
    return parseCalendarDate(dateString);
  } catch {
    return null;
  }
}

// ============================================================================
// Date Arithmetic for react-big-calendar
// ============================================================================

/**
 * Add one day to a date for react-big-calendar end date display.
 * RBC treats end dates as exclusive, so we need to add 1 day for correct display.
 *
 * @param date - The actual end date
 * @returns Date with +1 day for RBC display
 */
export function addDayForDisplay(date: Date): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + 1);
  return result;
}

/**
 * Subtract one day from a date (reverse of addDayForDisplay).
 * Use when converting from calendar display back to actual date.
 *
 * @param date - The RBC display date
 * @returns Actual end date (minus 1 day)
 */
export function subtractDayFromDisplay(date: Date): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() - 1);
  return result;
}

// ============================================================================
// Date Comparisons
// ============================================================================

/**
 * Check if date is weekend
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * Check if two dates are the same day (in UTC)
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
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

// ============================================================================
// Day Boundaries
// ============================================================================

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

// ============================================================================
// Logging Utilities
// ============================================================================

/**
 * Development-only logging flag.
 * Console output is suppressed in production.
 */
const IS_DEVELOPMENT = process.env.NODE_ENV === "development";

/**
 * Log error message only in development.
 * Use instead of console.error for non-critical errors.
 *
 * @example
 * logError("Failed to fetch", error);
 */
export function logError(message: string, ...args: unknown[]): void {
  if (IS_DEVELOPMENT) {
    console.error(`[Error] ${message}`, ...args);
  }
}

/**
 * Log warning message only in development.
 *
 * @example
 * logWarn("Deprecated API used");
 */
export function logWarn(message: string, ...args: unknown[]): void {
  if (IS_DEVELOPMENT) {
    console.warn(`[Warn] ${message}`, ...args);
  }
}

/**
 * Log debug message only in development.
 *
 * @example
 * logDebug("Fetched events", events.length);
 */
export function logDebug(message: string, ...args: unknown[]): void {
  if (IS_DEVELOPMENT) {
    console.log(`[Debug] ${message}`, ...args);
  }
}

// ============================================================================
// Lunar Calendar Utilities (DEPRECATED - Use Swiss Ephemeris API)
// ============================================================================

// NOTE: getApproximateTithi() and getSpecialLunarDay() have been removed.
// The application now uses exact Panchanga calculations from Swiss Ephemeris
// via the /api/daily-info endpoint. See:
// - src/services/panchanga.service.ts for calculation logic
// - src/app/api/daily-info/route.ts for API endpoint
// - src/components/ui/TodayHero.tsx for usage example

// ============================================================================
// Misc Utilities
// ============================================================================

/**
 * Sleep utility for async operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Truncate text to a maximum length
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}
