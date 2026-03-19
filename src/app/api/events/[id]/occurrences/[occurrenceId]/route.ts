import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { updateOccurrenceSchema, cuidSchema } from "@/lib/validations";
import {
  errorResponse,
  notFoundError,
  serverError,
  validationError,
} from "@/lib/api-response";
import { parseCalendarDate } from "@/lib/date-utils";

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

    // Verify occurrence exists and belongs to this event
    const occurrence = await prisma.eventOccurrence.findUnique({
      where: { id: occurrenceId },
    });

    if (!occurrence) {
      return notFoundError("Occurrence");
    }

    if (occurrence.eventId !== id) {
      return errorResponse("Occurrence behoort niet tot dit event", 403);
    }

    const data = result.data;

    // If date changes, check for unique constraint (eventId + date)
    if (data.date !== undefined) {
      const newDate = parseCalendarDate(data.date);
      const conflict = await prisma.eventOccurrence.findFirst({
        where: {
          eventId: id,
          date: newDate,
          NOT: { id: occurrenceId },
        },
      });

      if (conflict) {
        return errorResponse(
          "Er bestaat al een occurrence op deze datum voor dit event",
          409
        );
      }
    }

    const updated = await prisma.eventOccurrence.update({
      where: { id: occurrenceId },
      data: {
        ...(data.date !== undefined && { date: parseCalendarDate(data.date) }),
        ...(data.endDate !== undefined && {
          endDate: data.endDate ? parseCalendarDate(data.endDate) : null,
        }),
        ...(data.startTime !== undefined && { startTime: data.startTime }),
        ...(data.endTime !== undefined && { endTime: data.endTime }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[API] PUT /api/events/[id]/occurrences/[occurrenceId] error:", error);
    return serverError("Kon occurrence niet bijwerken");
  }
}
