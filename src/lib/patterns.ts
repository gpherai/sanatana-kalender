/**
 * Validation Patterns - Single Source of Truth
 *
 * Centralized regex patterns and validation helpers used across:
 * - Zod schemas (validations.ts)
 * - Type guards (types/calendar.ts)
 * - API routes
 *
 * This prevents duplication and ensures consistency.
 */

// =============================================================================
// REGEX PATTERNS
// =============================================================================

/**
 * Time format: HH:mm (24-hour)
 * Examples: "09:00", "23:59", "00:00"
 */
export const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Time format: Lenient HH:mm (allows single digit hour)
 * Examples: "9:00", "09:00", "23:59"
 * Use for form input validation (more forgiving)
 */
export const TIME_REGEX_LENIENT = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

/**
 * Date format: YYYY-MM-DD (strict, exact match)
 * Examples: "2025-12-18", "2024-01-01"
 * Use for form input validation
 */
export const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Date format: YYYY-MM-DD prefix (allows trailing content)
 * Examples: "2025-12-18", "2025-12-18T10:30:00.000Z"
 * Use for API query parameters that may receive ISO datetime strings
 */
export const DATE_PREFIX_REGEX = /^\d{4}-\d{2}-\d{2}/;

/**
 * DateTime format: ISO 8601
 * Examples: "2025-12-18T10:30:00.000Z"
 */
export const DATETIME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;

/**
 * CUID format (Prisma default ID)
 * Examples: "clfx1234567890abcdefghij"
 */
export const CUID_REGEX = /^c[a-z0-9]{24}$/;

// =============================================================================
// TYPE GUARD FUNCTIONS
// =============================================================================

/**
 * Validate a time string is in HH:mm format (strict)
 */
export function isValidTimeFormat(value: string): boolean {
  return TIME_REGEX.test(value);
}

/**
 * Validate a date string is in YYYY-MM-DD format (strict)
 */
export function isValidDateFormat(value: string): boolean {
  return DATE_REGEX.test(value);
}

/**
 * Validate a date string starts with YYYY-MM-DD (lenient)
 */
export function isValidDatePrefix(value: string): boolean {
  return DATE_PREFIX_REGEX.test(value);
}

/**
 * Validate a CUID string
 */
export function isValidCuid(value: string): boolean {
  return CUID_REGEX.test(value);
}

// =============================================================================
// ZOD ERROR MESSAGES (Dutch)
// =============================================================================

export const ERROR_MESSAGES = {
  // Required fields
  REQUIRED: "Dit veld is verplicht",
  REQUIRED_NAME: "Naam is verplicht",
  REQUIRED_DATE: "Datum is verplicht",
  REQUIRED_THEME: "Kies een thema",
  REQUIRED_TIMEZONE: "Kies een tijdzone",
  REQUIRED_LOCATION: "Locatie is verplicht",

  // Format errors
  INVALID_DATE: "Ongeldig datum formaat (gebruik YYYY-MM-DD)",
  INVALID_TIME: "Ongeldige tijd (gebruik HH:mm)",
  INVALID_ID: "Ongeldig ID formaat",
  INVALID_EMAIL: "Ongeldig e-mailadres",

  // Length errors
  TOO_SHORT: (min: number) => `Minimaal ${min} karakters`,
  TOO_LONG: (max: number) => `Maximaal ${max} karakters`,
  NAME_TOO_LONG: "Naam mag maximaal 100 karakters zijn",
  DESCRIPTION_TOO_LONG: "Beschrijving mag maximaal 500 karakters zijn",
  NOTES_TOO_LONG: "Notities mogen maximaal 500 karakters zijn",

  // Range errors
  LAT_OUT_OF_RANGE: "Breedtegraad moet tussen -90 en 90 zijn",
  LON_OUT_OF_RANGE: "Lengtegraad moet tussen -180 en 180 zijn",
} as const;
