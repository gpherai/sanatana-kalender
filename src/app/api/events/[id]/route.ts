import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { updateEventSchema, cuidSchema } from "@/lib/validations";
import {
  errorResponse,
  notFoundError,
  serverError,
  validationError,
} from "@/lib/api-response";
import { parseCalendarDate } from "@/lib/utils";
import { Prisma } from "@/generated/prisma/client";
import {
  EventType,
  Importance,
  RecurrenceType,
  Tithi,
  Nakshatra,
  Maas,
} from "@/generated/prisma/enums";

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

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        category: true,
        occurrences: {
          orderBy: { date: "asc" },
        },
      },
    });

    if (!event) {
      return notFoundError("Event");
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error("[API] GET /api/events/[id] error:", error);
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

    const body = await request.json();

    // Check if event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id },
      include: {
        occurrences: {
          orderBy: { date: "asc" },
          take: 1,
        },
      },
    });

    if (!existingEvent) {
      return notFoundError("Event");
    }

    // Validate with Zod
    const result = updateEventSchema.safeParse(body);
    if (!result.success) {
      return validationError(result.error);
    }

    const data = result.data;

    // Validate categoryId exists if provided
    if (data.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
      });
      if (!category) {
        return errorResponse("Categorie niet gevonden", 400, [
          { field: "categoryId", message: "Categorie bestaat niet" },
        ]);
      }
    }

    // Update event and occurrence in a transaction
    const event = await prisma.$transaction(async (tx) => {
      const updatedEvent = await tx.event.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.eventType !== undefined && { eventType: data.eventType as EventType }),
          ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
          ...(data.importance !== undefined && {
            importance: data.importance as Importance,
          }),
          ...(data.recurrenceType !== undefined && {
            recurrenceType: data.recurrenceType as RecurrenceType,
          }),
          ...(data.tithi !== undefined && { tithi: data.tithi as Tithi | null }),
          ...(data.nakshatra !== undefined && {
            nakshatra: data.nakshatra as Nakshatra | null,
          }),
          ...(data.maas !== undefined && { maas: data.maas as Maas | null }),
          ...(data.tags !== undefined && { tags: data.tags }),
        },
        include: {
          category: true,
        },
      });

      // Update first occurrence if date data provided
      const firstOccurrence = existingEvent.occurrences[0];
      if (data.date !== undefined && firstOccurrence) {
        await tx.eventOccurrence.update({
          where: { id: firstOccurrence.id },
          data: {
            date: parseCalendarDate(data.date),
            endDate: data.endDate ? parseCalendarDate(data.endDate) : null,
            startTime: data.startTime ?? null,
            endTime: data.endTime ?? null,
            notes: data.notes ?? null,
          },
        });
      }

      return updatedEvent;
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error("[API] PUT /api/events/[id] error:", error);

    // Handle specific Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case "P2002":
          return errorResponse("Er bestaat al een event met deze naam", 409, [
            { field: "name", message: "Naam moet uniek zijn" },
          ]);
        case "P2003":
          return errorResponse("Gerelateerde data niet gevonden", 400, [
            { field: "categoryId", message: "Categorie bestaat niet" },
          ]);
        case "P2025":
          return notFoundError("Event");
      }
    }

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

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      return notFoundError("Event");
    }

    // Delete event (occurrences are cascade deleted)
    await prisma.event.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] DELETE /api/events/[id] error:", error);

    // Handle Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return notFoundError("Event");
      }
    }

    return serverError("Kon event niet verwijderen");
  }
}
