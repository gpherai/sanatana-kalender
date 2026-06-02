import { z } from "zod";
import {
  cuidSchema,
  dateStringSchema,
  timeStringSchema,
  formTimeStringSchema,
  eventTypeEnum,
  recurrenceEnum,
  tithiEnum,
  nakshatraEnum,
  maasEnum,
  sankrantiEnum,
} from "./shared";
import { ERROR_MESSAGES } from "@/lib/patterns";

// =============================================================================
// INTERNAL HELPERS
// =============================================================================

const optionalCuidSchema = cuidSchema.optional().or(z.literal(""));

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
    const date = data.date as string | undefined;
    const endDate = data.endDate as string | null | undefined;

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

    if (date && endDate && endDate < date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "Einddatum moet op of na de startdatum liggen",
      });
    }
  });
}

// =============================================================================
// EVENT FORM SCHEMA (Client-side)
// =============================================================================

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
    date: z.string().min(1, ERROR_MESSAGES.REQUIRED_DATE),
    endDate: z.string().optional().or(z.literal("")),
    startTime: formTimeStringSchema,
    endTime: formTimeStringSchema,
    tithi: tithiEnum.optional().or(z.literal("")),
    nakshatra: nakshatraEnum.optional().or(z.literal("")),
    maas: maasEnum.optional().or(z.literal("")),
    sankranti: sankrantiEnum.optional().or(z.literal("")),
    tags: z.string().optional().or(z.literal("")),
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

const createEventBaseSchema = z
  .object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).nullable().optional(),
    eventType: eventTypeEnum,
    categoryId: z.cuid().nullable().optional(),
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
  })
  .strict();

export const createEventSchema = withEventRecurrenceValidation(createEventBaseSchema);

export const updateEventSchema = createEventBaseSchema.partial();

// =============================================================================
// OCCURRENCE SCHEMAS
// =============================================================================

export const updateOccurrenceSchema = z
  .object({
    date: dateStringSchema.optional(),
    endDate: dateStringSchema.nullable().optional(),
    startTime: timeStringSchema.nullable().optional(),
    endTime: timeStringSchema.nullable().optional(),
    notes: z.string().max(500).nullable().optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.date && data.endDate && data.endDate < data.date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "Einddatum moet op of na de startdatum liggen",
      });
    }
  });

export const generateOccurrencesSchema = z
  .object({
    eventId: z.cuid().optional(),
    startDate: dateStringSchema,
    endDate: dateStringSchema,
    maxOccurrences: z.number().int().positive().max(5000).optional(),
    replace: z.boolean().default(false),
  })
  .strict();

// =============================================================================
// QUERY PARAMETER SCHEMAS
// =============================================================================

export const eventQuerySchema = z
  .object({
    start: dateStringSchema.optional(),
    end: dateStringSchema.optional(),
    search: z.string().max(100).optional(),
    categories: z.array(z.string().max(50)).max(20).optional(),
    types: z.array(eventTypeEnum).max(20).optional(),
    tithis: z.array(tithiEnum).max(20).optional(),
    sortBy: z.enum(["date", "name"]).optional(),
    order: z.enum(["asc", "desc"]).optional(),
  })
  .superRefine((data, ctx) => {
    if ((data.start && !data.end) || (!data.start && data.end)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["end"],
        message: "start en end moeten samen worden opgegeven",
      });
    }
  });

export type EventQueryParams = z.infer<typeof eventQuerySchema>;
