/**
 * Zod Validation Schemas
 *
 * Centralized validation schemas for:
 * - Event form (client-side)
 * - Event API (server-side)
 * - User preferences
 *
 * Uses patterns from @/lib/patterns for consistency.
 */

import { z } from "zod";
import {
  EVENT_TYPES,
  IMPORTANCE_LEVELS,
  RECURRENCE_TYPES,
  TITHIS,
  NAKSHATRAS,
  MAAS,
  PAKSHAS,
} from "./constants";
import {
  TIME_REGEX_LENIENT,
  DATE_REGEX,
  DATE_PREFIX_REGEX,
  ERROR_MESSAGES,
} from "./patterns";

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create a Zod enum schema from a constants array.
 * Extracts the 'value' property from each item.
 *
 * @example
 * const eventTypeEnum = createEnumFromConstants(EVENT_TYPES);
 * // Creates z.enum(['FESTIVAL', 'PUJA', ...])
 */
export function createEnumFromConstants<T extends readonly { value: string }[]>(
  constants: T
) {
  const values = constants.map((c) => c.value) as [string, ...string[]];
  return z.enum(values);
}

// =============================================================================
// ENUM SCHEMAS (from constants)
// =============================================================================

export const eventTypeEnum = createEnumFromConstants(EVENT_TYPES);
export const importanceEnum = createEnumFromConstants(IMPORTANCE_LEVELS);
export const recurrenceEnum = createEnumFromConstants(RECURRENCE_TYPES);
export const tithiEnum = createEnumFromConstants(TITHIS);
export const nakshatraEnum = createEnumFromConstants(NAKSHATRAS);
export const maasEnum = createEnumFromConstants(MAAS);
export const pakshaEnum = createEnumFromConstants(PAKSHAS);
export const calendarViewEnum = z.enum(["month", "week", "day", "agenda"]);

// =============================================================================
// REUSABLE FIELD SCHEMAS
// =============================================================================

/** CUID identifier (Prisma default) */
export const cuidSchema = z.string().cuid();

/** Optional CUID (accepts empty string as undefined) */
export const optionalCuidSchema = cuidSchema.optional().or(z.literal(""));

/** Date string in YYYY-MM-DD format (strict - for form inputs) */
export const dateStringSchema = z.string().regex(DATE_REGEX, ERROR_MESSAGES.INVALID_DATE);

/** Date string that starts with YYYY-MM-DD (lenient - for API query params) */
export const dateQuerySchema = z.string().regex(DATE_PREFIX_REGEX);

/** Optional date string */
export const optionalDateStringSchema = dateStringSchema
  .nullable()
  .optional()
  .or(z.literal(""));

/** Time string in HH:mm format */
export const timeStringSchema = z
  .string()
  .regex(TIME_REGEX_LENIENT, ERROR_MESSAGES.INVALID_TIME);

/** Optional time string (for API - allows null) */
export const optionalTimeStringSchema = timeStringSchema.nullable().optional();

/** Optional time string (for forms - only string or empty) */
export const formTimeStringSchema = timeStringSchema.optional().or(z.literal(""));

// =============================================================================
// EVENT FORM SCHEMA (Client-side)
// =============================================================================

/**
 * Event form validation schema.
 * Used in EventForm component for client-side validation.
 * More lenient to support form UX (empty strings allowed).
 */
export const eventFormSchema = z.object({
  name: z
    .string()
    .min(1, ERROR_MESSAGES.REQUIRED_NAME)
    .max(100, ERROR_MESSAGES.NAME_TOO_LONG),

  description: z
    .string()
    .max(500, ERROR_MESSAGES.DESCRIPTION_TOO_LONG)
    .optional()
    .or(z.literal("")),

  eventType: eventTypeEnum,

  categoryId: optionalCuidSchema,

  importance: importanceEnum.default("MODERATE"),

  recurrenceType: recurrenceEnum.default("NONE"),

  // Date fields
  date: z.string().min(1, ERROR_MESSAGES.REQUIRED_DATE),
  endDate: z.string().optional().or(z.literal("")),

  // Time fields (form uses string only, no null)
  startTime: formTimeStringSchema,
  endTime: formTimeStringSchema,

  // Lunar info (all optional)
  tithi: tithiEnum.optional().or(z.literal("")),
  nakshatra: nakshatraEnum.optional().or(z.literal("")),
  maas: maasEnum.optional().or(z.literal("")),

  // Tags as comma-separated string
  tags: z.string().optional().or(z.literal("")),

  // Notes
  notes: z.string().max(500, ERROR_MESSAGES.NOTES_TOO_LONG).optional().or(z.literal("")),
});

export type EventFormData = z.infer<typeof eventFormSchema>;

// =============================================================================
// FORM DATA TRANSFORMER
// =============================================================================

/**
 * Transform form data to API payload.
 * Converts empty strings to null and parses tags.
 */
export function transformFormToApi(data: EventFormData) {
  return {
    name: data.name.trim(),
    description: data.description?.trim() || null,
    eventType: data.eventType,
    categoryId: data.categoryId || null,
    importance: data.importance,
    recurrenceType: data.recurrenceType,
    tithi: data.tithi || null,
    nakshatra: data.nakshatra || null,
    maas: data.maas || null,
    tags: data.tags
      ? data.tags
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter((t) => t.length > 0)
      : [],
    date: data.date,
    endDate: data.endDate || null,
    startTime: data.startTime || null,
    endTime: data.endTime || null,
    notes: data.notes?.trim() || null,
  };
}

// =============================================================================
// EVENT API SCHEMAS (Server-side)
// =============================================================================

/**
 * Create event API schema.
 * Stricter validation for API requests.
 */
export const createEventSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullable().optional(),
  eventType: eventTypeEnum,
  categoryId: z.string().cuid().nullable().optional(),
  importance: importanceEnum.default("MODERATE"),
  recurrenceType: recurrenceEnum.default("NONE"),
  tithi: tithiEnum.nullable().optional(),
  nakshatra: nakshatraEnum.nullable().optional(),
  maas: maasEnum.nullable().optional(),
  tags: z.array(z.string()).default([]),
  date: dateStringSchema,
  endDate: z.string().regex(DATE_REGEX).nullable().optional(),
  startTime: timeStringSchema.nullable().optional(),
  endTime: timeStringSchema.nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

export type CreateEventPayload = z.infer<typeof createEventSchema>;

/**
 * Update event API schema.
 * All fields optional for partial updates.
 */
export const updateEventSchema = createEventSchema.partial();

export type UpdateEventPayload = z.infer<typeof updateEventSchema>;

// =============================================================================
// USER PREFERENCES SCHEMAS
// =============================================================================

/**
 * Update preferences API schema.
 */
export const updatePreferencesSchema = z.object({
  // Theme
  currentTheme: z.string().min(1).max(50).optional(),

  // Calendar
  defaultView: calendarViewEnum.optional(),
  weekStartsOn: z.number().int().min(0).max(6).optional(),

  // Location
  timezone: z.string().min(1).max(50).optional(),
  locationName: z.string().min(1).max(100).optional(),
  locationLat: z.number().min(-90).max(90).optional(),
  locationLon: z.number().min(-180).max(180).optional(),

  // Visibility filters
  visibleEventTypes: z.array(eventTypeEnum).optional(),
  visibleCategories: z.array(z.string().cuid()).optional(),

  // Notifications
  notificationsEnabled: z.boolean().optional(),
  notificationDaysBefore: z.number().int().min(0).max(30).optional(),
});

export type UpdatePreferencesPayload = z.infer<typeof updatePreferencesSchema>;

/**
 * Preferences form schema (client-side).
 */
export const preferencesFormSchema = z.object({
  currentTheme: z.string().min(1, ERROR_MESSAGES.REQUIRED_THEME),
  defaultView: calendarViewEnum,
  weekStartsOn: z.coerce.number().int().min(0).max(6),
  timezone: z.string().min(1, ERROR_MESSAGES.REQUIRED_TIMEZONE),
  locationName: z.string().min(1, ERROR_MESSAGES.REQUIRED_LOCATION).max(100),
  locationLat: z.coerce.number().min(-90).max(90),
  locationLon: z.coerce.number().min(-180).max(180),
});

export type PreferencesFormData = z.infer<typeof preferencesFormSchema>;

// =============================================================================
// QUERY PARAMETER SCHEMAS
// =============================================================================

/**
 * Event query parameters schema.
 * Used in GET /api/events for filtering.
 * Uses dateQuerySchema (lenient) to accept ISO datetime strings from frontend.
 */
export const eventQuerySchema = z.object({
  start: dateQuerySchema.optional(),
  end: dateQuerySchema.optional(),
  search: z.string().max(100).optional(),
  categories: z.array(z.string().max(50)).max(20).optional(),
  types: z.array(z.string().max(20)).max(20).optional(),
  importance: z.array(z.string().max(20)).max(20).optional(),
  tithis: z.array(z.string().max(30)).max(20).optional(),
  sortBy: z.enum(["date", "name"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
});

export type EventQueryParams = z.infer<typeof eventQuerySchema>;
