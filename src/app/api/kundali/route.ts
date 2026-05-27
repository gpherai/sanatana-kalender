import { NextRequest, NextResponse } from "next/server";
import { DateTime } from "luxon";
import { z } from "zod";
import {
  BirthChartInputError,
  BirthChartService,
} from "@/engine/panchanga/services/birth-chart-service";
import type { BirthData } from "@/engine/panchanga/types";
import {
  errorResponse,
  parseJsonBody,
  serverError,
  validationError,
} from "@/lib/api-response";
import { logError } from "@/lib/utils";

const service = new BirthChartService();

const TIME_WITH_OPTIONAL_SECONDS = /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;

function isValidCalendarDate(date: string): boolean {
  const parsed = DateTime.fromISO(date, { zone: "UTC" });
  return parsed.isValid && parsed.toISODate() === date;
}

function isValidTimeZone(tz: string): boolean {
  return DateTime.now().setZone(tz).isValid;
}

const birthDataSchema = z
  .object({
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Ongeldig datumformaat (gebruik YYYY-MM-DD)")
      .refine(isValidCalendarDate, "Ongeldige geboortedatum"),
    time: z
      .string()
      .regex(TIME_WITH_OPTIONAL_SECONDS, "Ongeldige geboortetijd (gebruik HH:mm)"),
    lat: z
      .number()
      .finite()
      .min(-90, "Breedtegraad moet minimaal -90 zijn")
      .max(90, "Breedtegraad moet maximaal 90 zijn"),
    lon: z
      .number()
      .finite()
      .min(-180, "Lengtegraad moet minimaal -180 zijn")
      .max(180, "Lengtegraad moet maximaal 180 zijn"),
    tz: z
      .string()
      .trim()
      .min(1, "Tijdzone is verplicht")
      .max(100, "Tijdzone is te lang")
      .refine(isValidTimeZone, "Ongeldige IANA tijdzone"),
    altitude: z.number().finite().min(-500).max(10000).optional().default(0),
  })
  .strict();

export async function POST(req: NextRequest) {
  const bodyResult = await parseJsonBody(req);
  if (!bodyResult.ok) return bodyResult.response;

  const parsed = birthDataSchema.safeParse(bodyResult.data);
  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const birthData: BirthData = parsed.data;

  try {
    const chart = await service.compute(birthData);
    return NextResponse.json(chart);
  } catch (err) {
    if (err instanceof BirthChartInputError) {
      return errorResponse(err.message, 400);
    }

    logError("[API] POST /api/kundali error:", err);
    return serverError("Kon kundali niet berekenen");
  }
}
