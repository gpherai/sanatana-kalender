import { NextRequest, NextResponse } from "next/server";
import { revalidateEventPaths } from "@/lib/revalidate";
import { updateOccurrenceSchema, cuidSchema } from "@/lib/validations";
import {
  errorResponse,
  notFoundError,
  parseJsonBody,
  serverError,
  validationError,
} from "@/lib/api-response";
import { logError } from "@/lib/utils";
import {
  LastOccurrenceError,
  OccurrenceConflictError,
  OccurrenceNotFoundError,
  OccurrenceOwnershipError,
  deleteEventOccurrence,
  updateEventOccurrence,
} from "@/services/event.service";

interface RouteParams {
  params: Promise<{ id: string; occurrenceId: string }>;
}

// ============================================================================
// DELETE /api/events/[id]/occurrences/[occurrenceId]
// ============================================================================

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id, occurrenceId } = await params;

    if (!cuidSchema.safeParse(id).success) {
      return errorResponse("Ongeldig event ID formaat", 400);
    }
    if (!cuidSchema.safeParse(occurrenceId).success) {
      return errorResponse("Ongeldig occurrence ID formaat", 400);
    }

    await deleteEventOccurrence(id, occurrenceId);

    revalidateEventPaths(id);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof OccurrenceNotFoundError) {
      return notFoundError("Occurrence");
    }

    if (error instanceof OccurrenceOwnershipError) {
      return errorResponse("Occurrence behoort niet tot dit event", 403);
    }

    if (error instanceof LastOccurrenceError) {
      return errorResponse(
        "Kan het laatste voorkomen van een terugkerend event niet verwijderen",
        409
      );
    }

    logError("[API] DELETE /api/events/[id]/occurrences/[occurrenceId] error:", error);
    return serverError("Kon occurrence niet verwijderen");
  }
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

    const bodyResult = await parseJsonBody(request);
    if (!bodyResult.ok) return bodyResult.response;

    // Validate request body
    const result = updateOccurrenceSchema.safeParse(bodyResult.data);
    if (!result.success) {
      return validationError(result.error);
    }

    const updated = await updateEventOccurrence(id, occurrenceId, result.data);

    revalidateEventPaths(id);

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
