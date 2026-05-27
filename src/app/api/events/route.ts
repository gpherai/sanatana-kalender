import { NextRequest, NextResponse } from "next/server";
import { createEventSchema, eventQuerySchema } from "@/lib/validations";
import {
  errorResponse,
  handlePrismaError,
  parseJsonBody,
  serverError,
  validationError,
} from "@/lib/api-response";
import { logError } from "@/lib/utils";
import { findEventOccurrences } from "@/repositories/event.repository";
import { CategoryNotFoundError, createEvent } from "@/services/event.service";
import { transformOccurrenceToCalendarEvent } from "@/lib/api-transformers";

// ============================================================================
// Helper: Parse Query Parameters
// ============================================================================

/**
 * Parse and validate query parameters using centralized schema
 */
function parseQueryParams(searchParams: URLSearchParams) {
  const raw = {
    start: searchParams.get("start") ?? undefined,
    end: searchParams.get("end") ?? undefined,
    search: searchParams.get("search")?.trim() || undefined,
    categories: searchParams.get("categories")?.split(",").filter(Boolean),
    types: searchParams.get("types")?.split(",").filter(Boolean),
    tithis: searchParams.get("tithis")?.split(",").filter(Boolean),
    sortBy: searchParams.get("sortBy") ?? undefined,
    order: searchParams.get("order") ?? undefined,
  };

  return eventQuerySchema.safeParse(raw);
}

// ============================================================================
// GET /api/events
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Validate query parameters
    const paramsResult = parseQueryParams(request.nextUrl.searchParams);

    if (!paramsResult.success) {
      return validationError(paramsResult.error);
    }

    const occurrences = await findEventOccurrences(paramsResult.data);

    const calendarEvents = occurrences.map(transformOccurrenceToCalendarEvent);

    return NextResponse.json(calendarEvents);
  } catch (error) {
    logError("[API] GET /api/events error:", error);
    return serverError("Kon events niet ophalen");
  }
}

// ============================================================================
// POST /api/events
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const bodyResult = await parseJsonBody(request);
    if (!bodyResult.ok) return bodyResult.response;

    const result = createEventSchema.safeParse(bodyResult.data);
    if (!result.success) {
      return validationError(result.error);
    }

    const data = result.data;
    const event = await createEvent({
      ...data,
      endDate: data.endDate ?? null,
      startTime: data.startTime ?? null,
      endTime: data.endTime ?? null,
      notes: data.notes ?? null,
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    logError("[API] POST /api/events error:", error);

    if (error instanceof CategoryNotFoundError) {
      return errorResponse("Categorie niet gevonden", 400, [
        { field: "categoryId", message: "Categorie bestaat niet" },
      ]);
    }

    const prismaError = handlePrismaError(error);
    if (prismaError) return prismaError;

    return serverError("Kon event niet aanmaken");
  }
}
