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
  RECURRENCE_TYPES,
  TITHIS,
  NAKSHATRAS,
  MAAS,
  SANKRANTIS,
} from "./domain";
import { TIME_REGEX_LENIENT, DATE_REGEX, ERROR_MESSAGES } from "./patterns";

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

const eventTypeEnum = createEnumFromConstants(EVENT_TYPES);
const recurrenceEnum = createEnumFromConstants(RECURRENCE_TYPES);
const tithiEnum = createEnumFromConstants(TITHIS);
const nakshatraEnum = createEnumFromConstants(NAKSHATRAS);
const maasEnum = createEnumFromConstants(MAAS);
const sankrantiEnum = createEnumFromConstants(SANKRANTIS);
const calendarViewEnum = z.enum(["month", "week", "day", "agenda"]);

// =============================================================================
// REUSABLE FIELD SCHEMAS
// =============================================================================

function isValidCalendarDateString(value: string): boolean {
  if (!DATE_REGEX.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year!, month! - 1, day!));

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month! - 1 &&
    parsed.getUTCDate() === day
  );
}

/** CUID identifier (Prisma default) */
export const cuidSchema = z.string().cuid();

/** Optional CUID (accepts empty string as undefined) */
const optionalCuidSchema = cuidSchema.optional().or(z.literal(""));

/** Date string in YYYY-MM-DD format (strict calendar date) */
export const dateStringSchema = z
  .string()
  .refine(isValidCalendarDateString, { message: ERROR_MESSAGES.INVALID_DATE });

/** Date query string in YYYY-MM-DD format (strict calendar date) */
// Removed duplicate dateQuerySchema, use dateStringSchema instead.

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

const RECURRENCE_VALIDATION_MESSAGES = {
  LUNAR_TITHI_REQUIRED:
    "Kies een tithi voor maandelijkse of jaarlijkse lunaire herhaling",
  SOLAR_SANKRANTI_REQUIRED: "Kies een sankranti voor jaarlijkse solaire herhaling",
} as const;

function withEventRecurrenceValidation<TShape extends z.ZodRawShape>(
  schema: z.ZodObject<TShape>
) {
  return schema.superRefine((data: Record<string, unknown>, ctx: z.RefinementCtx) => {
    const recurrenceType = data.recurrenceType as string | undefined | null;
    const tithi = data.tithi as string | undefined | null;
    const sankranti = data.sankranti as string | undefined | null;

    if (
      (recurrenceType === "YEARLY_LUNAR" || recurrenceType === "MONTHLY_LUNAR") &&
      !tithi
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["tithi"],
        message: RECURRENCE_VALIDATION_MESSAGES.LUNAR_TITHI_REQUIRED,
      });
    }

    if (recurrenceType === "YEARLY_SOLAR" && !sankranti) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sankranti"],
        message: RECURRENCE_VALIDATION_MESSAGES.SOLAR_SANKRANTI_REQUIRED,
      });
    }
  });
}

// =============================================================================
// EVENT FORM SCHEMA (Client-side)
// =============================================================================

/**
 * Event form validation schema.
 * Used in EventForm component for client-side validation.
 * More lenient to support form UX (empty strings allowed).
 */
export const eventFormSchema = withEventRecurrenceValidation(
  z.object({
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

    // Solar info (for YEARLY_SOLAR recurrence)
    sankranti: sankrantiEnum.optional().or(z.literal("")),

    // Tags as comma-separated string
    tags: z.string().optional().or(z.literal("")),

    // Notes
    notes: z
      .string()
      .max(500, ERROR_MESSAGES.NOTES_TOO_LONG)
      .optional()
      .or(z.literal("")),
  })
);

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
    recurrenceType: data.recurrenceType,
    tithi: data.tithi || null,
    nakshatra: data.nakshatra || null,
    maas: data.maas || null,
    sankranti: data.sankranti || null,
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
const createEventBaseSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullable().optional(),
  eventType: eventTypeEnum,
  categoryId: z.string().cuid().nullable().optional(),
  recurrenceType: recurrenceEnum.default("NONE"),
  tithi: tithiEnum.nullable().optional(),
  nakshatra: nakshatraEnum.nullable().optional(),
  maas: maasEnum.nullable().optional(),
  sankranti: sankrantiEnum.nullable().optional(),
  tags: z.array(z.string()).default([]),
  date: dateStringSchema,
  endDate: dateStringSchema.nullable().optional(),
  startTime: timeStringSchema.nullable().optional(),
  endTime: timeStringSchema.nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

export const createEventSchema = withEventRecurrenceValidation(createEventBaseSchema);

/**
 * Update event API schema.
 * All fields optional for partial updates.
 */
export const updateEventSchema = createEventBaseSchema.partial();

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

  // Visibility filters
  visibleEventTypes: z.array(eventTypeEnum).optional(),
  visibleCategories: z.array(z.string().cuid()).optional(),

  // Notifications
  notificationsEnabled: z.boolean().optional(),
  notificationDaysBefore: z.number().int().min(0).max(30).optional(),
});

// =============================================================================
// UPDATE OCCURRENCE SCHEMA
// =============================================================================

/**
 * Update a specific event occurrence.
 * All fields optional for partial updates.
 */
export const updateOccurrenceSchema = z.object({
  date: dateStringSchema.optional(),
  endDate: dateStringSchema.nullable().optional(),
  startTime: timeStringSchema.nullable().optional(),
  endTime: timeStringSchema.nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

// =============================================================================
// GENERATE OCCURRENCES SCHEMA
// =============================================================================

/**
 * Schema for POST /api/events/generate-occurrences.
 * Validates the request body for occurrence generation.
 */
export const generateOccurrencesSchema = z.object({
  eventId: z.string().cuid().optional(),
  startDate: dateStringSchema,
  endDate: dateStringSchema,
  maxOccurrences: z.number().int().positive().max(5000).optional(),
  replace: z.boolean().default(false),
});

// =============================================================================
// QUERY PARAMETER SCHEMAS
// =============================================================================

/**
 * Event query parameters schema.
 * Used in GET /api/events for filtering.
 * Uses dateQuerySchema to accept only strict YYYY-MM-DD calendar dates.
 */
export const eventQuerySchema = z.object({
  start: dateStringSchema.optional(),
  end: dateStringSchema.optional(),
  search: z.string().max(100).optional(),
  categories: z.array(z.string().max(50)).max(20).optional(),
  types: z.array(z.string().max(20)).max(20).optional(),
  tithis: z.array(z.string().max(30)).max(20).optional(),
  sortBy: z.enum(["date", "name"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
});

export type EventQueryParams = z.infer<typeof eventQuerySchema>;

// =============================================================================
// SADHANA SCHEMAS
// =============================================================================

const sadhanaSessionItemSchema = z.object({
  practice_id: z.string().min(1),
  quantity: z.number().int().positive(),
  unit: z.enum(["malas", "count"]).optional(),
  duration_minutes: z.number().int().positive().nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

export const createSadhanaSessionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  started_at: z.string().nullable().optional(),
  duration_minutes: z.number().int().positive().nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
  items: z.array(sadhanaSessionItemSchema).min(1),
});

export const patchSadhanaSessionSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  started_at: z.string().nullable().optional(),
  duration_minutes: z.number().int().positive().nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
  items: z.array(sadhanaSessionItemSchema).min(1).optional(),
});

export const sadhanaCalendarQuerySchema = z.object({
  start: dateStringSchema.optional(),
  end: dateStringSchema.optional(),
});

export const createSadhanaGoalSchema = z.object({
  type: z.enum(["daily", "weekly", "lifetime"]),
  name: z.string().min(1).max(100).optional(),
  target_malas: z.number().int().positive(),
  target_minutes: z.number().int().positive().nullable().optional(),
  practice_ids: z.array(z.string().min(1)).optional(),
});

export const patchSadhanaGoalSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  target_malas: z.number().int().positive().optional(),
  target_minutes: z.number().int().positive().nullable().optional(),
  active: z.boolean().optional(),
  practice_ids: z.array(z.string().min(1)).optional(),
});

export const createSadhanaPracticeSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["mantra_japa", "parayana", "other"]),
  mantra_text: z.string().max(2000).nullable().optional(),
  count_size: z.number().int().min(1).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

export const patchSadhanaPracticeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: z.enum(["mantra_japa", "parayana", "other"]).optional(),
  mantra_text: z.string().max(2000).nullable().optional(),
  count_size: z.number().int().min(1).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
  active: z.boolean().optional(),
});

const sadhanaRoutineItemSchema = z.object({
  practice_id: z.string().min(1),
  quantity: z.number().int().min(1),
  unit: z.enum(["malas", "count"]).default("malas"),
  sort_order: z.number().int().optional(),
});

export const createSadhanaRoutineSchema = z.object({
  name: z.string().min(1).max(80),
  items: z.array(sadhanaRoutineItemSchema).min(1),
});

export const patchSadhanaRoutineSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  active: z.boolean().optional(),
  items: z.array(sadhanaRoutineItemSchema).min(1).optional(),
});
