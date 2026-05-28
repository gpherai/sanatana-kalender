import { NextRequest, NextResponse } from "next/server";
import { createEventSchema, updateEventSchema, cuidSchema } from "@/lib/validations";
import {
  errorResponse,
  handlePrismaError,
  notFoundError,
  parseJsonBody,
  serverError,
  validationError,
} from "@/lib/api-response";
import { logError } from "@/lib/utils";
import { formatDateLocal } from "@/lib/date-utils";
import { findEventForUpdate } from "@/repositories/event.repository";
import { dbTimeToStr } from "@/lib/timing-utils";
import {
  CategoryNotFoundError,
  deleteEvent,
  EventNotFoundError,
  getEventDetails,
  updateEvent,
} from "@/services/event.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ============================================================================
// GET /api/events/[id]
// ============================================================================

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Validate ID format using centralized schema
    const idResult = cuidSchema.safeParse(id);
    if (!idResult.success) {
      return errorResponse("Ongeldig event ID formaat", 400);
    }

    const event = await getEventDetails(id);

    if (!event) {
      return notFoundError("Event");
    }

    return NextResponse.json(event);
  } catch (error) {
    logError("[API] GET /api/events/[id] error:", error);
    return serverError("Kon event niet ophalen");
  }
}

// ============================================================================
// PUT /api/events/[id]
// ============================================================================

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Validate ID format using centralized schema
    const idResult = cuidSchema.safeParse(id);
    if (!idResult.success) {
      return errorResponse("Ongeldig event ID formaat", 400);
    }

    const bodyResult = await parseJsonBody(request);
    if (!bodyResult.ok) return bodyResult.response;

    const result = updateEventSchema.safeParse(bodyResult.data);
    if (!result.success) {
      return validationError(result.error);
    }

    const data = result.data;
    const existingEvent = await findEventForUpdate(id);

    if (!existingEvent) {
      return notFoundError("Event");
    }

    const firstOccurrence = existingEvent.occurrences[0];
    // Guard: validate the full resulting state after merging partial update with existing values.
    // Enforces cross-field rules (e.g. YEARLY_LUNAR requires tithi) without using the merged
    // data itself — only the changed fields in `data` are passed to the service below.
    const mergedStateCheck = createEventSchema.safeParse({
      name: data.name ?? existingEvent.name,
      description:
        data.description !== undefined ? data.description : existingEvent.description,
      eventType: data.eventType ?? existingEvent.eventType,
      categoryId: data.categoryId !== undefined ? data.categoryId : undefined,
      recurrenceType: data.recurrenceType ?? existingEvent.recurrenceType,
      tithi: data.tithi !== undefined ? data.tithi : existingEvent.tithi,
      nakshatra: data.nakshatra !== undefined ? data.nakshatra : existingEvent.nakshatra,
      maas: data.maas !== undefined ? data.maas : existingEvent.maas,
      sankranti: data.sankranti !== undefined ? data.sankranti : existingEvent.sankranti,
      tags: data.tags ?? existingEvent.tags,
      date: data.date ?? (firstOccurrence ? formatDateLocal(firstOccurrence.date) : ""),
      endDate:
        data.endDate !== undefined
          ? data.endDate
          : firstOccurrence?.endDate
            ? formatDateLocal(firstOccurrence.endDate)
            : null,
      startTime:
        data.startTime !== undefined
          ? data.startTime
          : (dbTimeToStr(firstOccurrence?.startTime) ?? null),
      endTime:
        data.endTime !== undefined
          ? data.endTime
          : (dbTimeToStr(firstOccurrence?.endTime) ?? null),
      notes: data.notes !== undefined ? data.notes : (firstOccurrence?.notes ?? null),
    });

    if (!mergedStateCheck.success) {
      return validationError(mergedStateCheck.error);
    }

    const event = await updateEvent(id, data, firstOccurrence?.id);

    return NextResponse.json(event);
  } catch (error) {
    logError("[API] PUT /api/events/[id] error:", error);

    if (error instanceof EventNotFoundError) return notFoundError("Event");

    if (error instanceof CategoryNotFoundError) {
      return errorResponse("Categorie niet gevonden", 400, [
        { field: "categoryId", message: "Categorie bestaat niet" },
      ]);
    }

    const prismaError = handlePrismaError(error, { notFound: "Event niet gevonden" });
    if (prismaError) return prismaError;

    return serverError("Kon event niet bijwerken");
  }
}

// ============================================================================
// DELETE /api/events/[id]
// ============================================================================

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Validate ID format using centralized schema
    const idResult = cuidSchema.safeParse(id);
    if (!idResult.success) {
      return errorResponse("Ongeldig event ID formaat", 400);
    }

    await deleteEvent(id);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logError("[API] DELETE /api/events/[id] error:", error);

    if (error instanceof EventNotFoundError) {
      return notFoundError("Event");
    }

    const prismaError = handlePrismaError(error, { notFound: "Event niet gevonden" });
    if (prismaError) return prismaError;

    return serverError("Kon event niet verwijderen");
  }
}
