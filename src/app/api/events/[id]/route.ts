import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { updateEventSchema, cuidSchema } from "@/lib/validations";
import {
  errorResponse,
  notFoundError,
  serverError,
  validationError,
} from "@/lib/api-response";
import { logError } from "@/lib/utils";
import { parseCalendarDate } from "@/lib/date-utils";
import { Prisma } from "@prisma/client";
import {
  EventType,
  RecurrenceType,
  Tithi,
  Nakshatra,
  Maas,
  Sankranti,
} from "@prisma/client";

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

    const eventRaw = await prisma.event.findUnique({
      where: { id },
      include: {
        categories: {
          include: { category: true },
          orderBy: { sortOrder: "asc" as const },
        },
        occurrences: {
          orderBy: { date: "asc" },
        },
        seriesParentEntries: {
          include: {
            parent: { select: { id: true, name: true } },
          },
        },
        seriesChildEntries: {
          include: {
            child: { select: { id: true, name: true } },
          },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!eventRaw) {
      return notFoundError("Event");
    }

    // Transform junction table entries to flat arrays, deduplicating by event id
    const { seriesParentEntries, seriesChildEntries, ...rest } = eventRaw;
    const parentEventMap = new Map<string, { id: string; name: string }>();
    for (const e of seriesParentEntries) {
      parentEventMap.set(e.parent.id, e.parent);
    }
    const childEventMap = new Map<
      string,
      { id: string; name: string; dayNumber: number | null }
    >();
    for (const e of seriesChildEntries) {
      if (!childEventMap.has(e.child.id)) {
        childEventMap.set(e.child.id, { ...e.child, dayNumber: e.dayNumber });
      }
    }
    const event = {
      ...rest,
      parentEvents: [...parentEventMap.values()],
      childEvents: [...childEventMap.values()],
    };

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
          ...(data.recurrenceType !== undefined && {
            recurrenceType: data.recurrenceType as RecurrenceType,
          }),
          ...(data.tithi !== undefined && { tithi: data.tithi as Tithi | null }),
          ...(data.nakshatra !== undefined && {
            nakshatra: data.nakshatra as Nakshatra | null,
          }),
          ...(data.maas !== undefined && { maas: data.maas as Maas | null }),
          ...(data.sankranti !== undefined && {
            sankranti: data.sankranti as Sankranti | null,
          }),
          ...(data.tags !== undefined && { tags: data.tags }),
        },
        include: {
          categories: {
            include: { category: true },
            orderBy: { sortOrder: "asc" as const },
          },
        },
      });

      // Update primary category (sortOrder=0) if provided
      if (data.categoryId !== undefined) {
        await tx.eventCategory.deleteMany({ where: { eventId: id, sortOrder: 0 } });
        if (data.categoryId) {
          await tx.eventCategory.upsert({
            where: { eventId_categoryId: { eventId: id, categoryId: data.categoryId } },
            create: { eventId: id, categoryId: data.categoryId, sortOrder: 0 },
            update: { sortOrder: 0 },
          });
        }
      }

      // Update first occurrence whenever any occurrence field is provided
      const firstOccurrence = existingEvent.occurrences[0];
      if (firstOccurrence) {
        const occurrenceData = {
          ...(data.date !== undefined && { date: parseCalendarDate(data.date) }),
          ...(data.endDate !== undefined && {
            endDate: data.endDate ? parseCalendarDate(data.endDate) : null,
          }),
          ...(data.startTime !== undefined && { startTime: data.startTime }),
          ...(data.endTime !== undefined && { endTime: data.endTime }),
          ...(data.notes !== undefined && { notes: data.notes }),
        };
        if (Object.keys(occurrenceData).length > 0) {
          await tx.eventOccurrence.update({
            where: { id: firstOccurrence.id },
            data: occurrenceData,
          });
        }
      }

      return updatedEvent;
    });

    return NextResponse.json(event);
  } catch (error) {
    logError("[API] PUT /api/events/[id] error:", error);

    // Handle specific Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case "P2002":
          // Unique constraint violation (namingKey)
          return errorResponse("Er bestaat al een event met deze sleutel", 409, [
            { field: "namingKey", message: "Naming key moet uniek zijn" },
          ]);
        case "P2003":
          return errorResponse("Gerelateerde data niet gevonden", 400);
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

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logError("[API] DELETE /api/events/[id] error:", error);

    // Handle Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return notFoundError("Event");
      }
    }

    return serverError("Kon event niet verwijderen");
  }
}
