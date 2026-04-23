import { NextRequest, NextResponse } from "next/server";
import { updateOccurrenceSchema, cuidSchema } from "@/lib/validations";
import {
  errorResponse,
  notFoundError,
  serverError,
  validationError,
} from "@/lib/api-response";
import { logError } from "@/lib/utils";
import {
  OccurrenceConflictError,
  OccurrenceNotFoundError,
  OccurrenceOwnershipError,
  updateEventOccurrence,
} from "@/services/event.service";

interface RouteParams {
  params: Promise<{ id: string; occurrenceId: string }>;
}

// ============================================================================
// PUT /api/events/[id]/occurrences/[occurrenceId]
// ============================================================================

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, occurrenceId } = await params;

    // Validate ID formats
    if (!cuidSchema.safeParse(id).success) {
      return errorResponse("Ongeldig event ID formaat", 400);
    }
    if (!cuidSchema.safeParse(occurrenceId).success) {
      return errorResponse("Ongeldig occurrence ID formaat", 400);
    }

    const body = await request.json();

    // Validate request body
    const result = updateOccurrenceSchema.safeParse(body);
    if (!result.success) {
      return validationError(result.error);
    }

    const updated = await updateEventOccurrence(id, occurrenceId, result.data);

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof OccurrenceNotFoundError) {
      return notFoundError("Occurrence");
    }

    if (error instanceof OccurrenceOwnershipError) {
      return errorResponse("Occurrence behoort niet tot dit event", 403);
    }

    if (error instanceof OccurrenceConflictError) {
      return errorResponse(
        "Er bestaat al een occurrence op deze datum voor dit event",
        409
      );
    }

    logError("[API] PUT /api/events/[id]/occurrences/[occurrenceId] error:", error);
    return serverError("Kon occurrence niet bijwerken");
  }
}
