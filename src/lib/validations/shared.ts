import { z } from "zod";
import {
  EVENT_TYPES,
  RECURRENCE_TYPES,
  TITHIS,
  NAKSHATRAS,
  MAAS,
  SANKRANTIS,
} from "@/lib/domain";
import { TIME_REGEX_LENIENT, DATE_REGEX, ERROR_MESSAGES } from "@/lib/patterns";

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function createEnumFromConstants<T extends readonly { value: string }[]>(
  constants: T
) {
  const values = constants.map((c) => c.value) as [string, ...string[]];
  return z.enum(values);
}

// =============================================================================
// DOMAIN ENUM SCHEMAS
// =============================================================================

export const eventTypeEnum = createEnumFromConstants(EVENT_TYPES);
export const recurrenceEnum = createEnumFromConstants(RECURRENCE_TYPES);
export const tithiEnum = createEnumFromConstants(TITHIS);
export const nakshatraEnum = createEnumFromConstants(NAKSHATRAS);
export const maasEnum = createEnumFromConstants(MAAS);
export const sankrantiEnum = createEnumFromConstants(SANKRANTIS);
export const calendarViewEnum = z.enum(["month", "week", "day", "agenda"]);

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

export const cuidSchema = z.cuid();

export const dateStringSchema = z
  .string()
  .refine(isValidCalendarDateString, { message: ERROR_MESSAGES.INVALID_DATE });

export const optionalDateStringSchema = dateStringSchema
  .nullable()
  .optional()
  .or(z.literal("").transform((): undefined => undefined));

export const timeStringSchema = z
  .string()
  .regex(TIME_REGEX_LENIENT, ERROR_MESSAGES.INVALID_TIME)
  .transform((v) => (v.length === 4 ? `0${v}` : v));

export const optionalTimeStringSchema = timeStringSchema.nullable().optional();

export const formTimeStringSchema = timeStringSchema.optional().or(z.literal(""));
