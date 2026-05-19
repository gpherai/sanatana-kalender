import { z } from "zod";
import { cuidSchema, dateStringSchema } from "./shared";

// =============================================================================
// SESSION SCHEMAS
// =============================================================================

const sadhanaSessionItemSchema = z
  .object({
    practiceId: cuidSchema,
    quantity: z.number().int().positive(),
    unit: z.enum(["malas", "count"]).optional(),
    durationMinutes: z.number().int().positive().nullable().optional(),
    notes: z.string().max(500).nullable().optional(),
  })
  .strict();

export const createSadhanaSessionSchema = z
  .object({
    date: dateStringSchema,
    startedAt: z.string().nullable().optional(),
    durationMinutes: z.number().int().positive().nullable().optional(),
    notes: z.string().max(1000).nullable().optional(),
    items: z.array(sadhanaSessionItemSchema).min(1),
  })
  .strict();

export const patchSadhanaSessionSchema = z
  .object({
    date: dateStringSchema.optional(),
    startedAt: z.string().nullable().optional(),
    durationMinutes: z.number().int().positive().nullable().optional(),
    notes: z.string().max(1000).nullable().optional(),
    items: z.array(sadhanaSessionItemSchema).min(1).optional(),
  })
  .strict();

export const sadhanaCalendarQuerySchema = z
  .object({
    start: dateStringSchema.optional(),
    end: dateStringSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.start && data.end && data.end < data.start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["end"],
        message: "end moet op of na start liggen",
      });
    }
  });

// =============================================================================
// GOAL SCHEMAS
// =============================================================================

export const createSadhanaGoalSchema = z
  .object({
    type: z.enum(["daily", "weekly", "lifetime"]),
    name: z.string().min(1).max(100).optional(),
    targetMalas: z.number().int().positive(),
    targetMinutes: z.number().int().positive().nullable().optional(),
    practiceIds: z.array(cuidSchema).optional(),
  })
  .strict();

export const patchSadhanaGoalSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    targetMalas: z.number().int().positive().optional(),
    targetMinutes: z.number().int().positive().nullable().optional(),
    active: z.boolean().optional(),
    practiceIds: z.array(cuidSchema).optional(),
  })
  .strict();

// =============================================================================
// PRACTICE SCHEMAS
// =============================================================================

export const createSadhanaPracticeSchema = z
  .object({
    name: z.string().min(1).max(100),
    type: z.enum(["mantra_japa", "parayana", "other"]),
    mantraText: z.string().max(2000).nullable().optional(),
    countSize: z.number().int().min(1).nullable().optional(),
    notes: z.string().max(500).nullable().optional(),
  })
  .strict();

export const patchSadhanaPracticeSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    type: z.enum(["mantra_japa", "parayana", "other"]).optional(),
    mantraText: z.string().max(2000).nullable().optional(),
    countSize: z.number().int().min(1).nullable().optional(),
    notes: z.string().max(500).nullable().optional(),
    active: z.boolean().optional(),
  })
  .strict();

// =============================================================================
// ROUTINE SCHEMAS
// =============================================================================

const sadhanaRoutineItemSchema = z
  .object({
    practiceId: cuidSchema,
    quantity: z.number().int().min(1),
    unit: z.enum(["malas", "count"]).default("malas"),
    sortOrder: z.number().int().optional(),
  })
  .strict();

export const createSadhanaRoutineSchema = z
  .object({
    name: z.string().min(1).max(80),
    items: z.array(sadhanaRoutineItemSchema).min(1),
  })
  .strict();

export const patchSadhanaRoutineSchema = z
  .object({
    name: z.string().min(1).max(80).optional(),
    active: z.boolean().optional(),
    items: z.array(sadhanaRoutineItemSchema).min(1).optional(),
  })
  .strict();
