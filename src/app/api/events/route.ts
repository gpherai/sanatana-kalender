import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createEventSchema, eventQuerySchema } from "@/lib/validations";
import { errorResponse, serverError, validationError } from "@/lib/api-response";
import { parseCalendarDate, addDayForDisplay, formatDateLocal } from "@/lib/utils";
import { Prisma } from "@/generated/prisma/client";
import {
  Tithi,
  Nakshatra,
  Maas,
  EventType,
  Importance,
  RecurrenceType,
} from "@/generated/prisma/enums";

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
    importance: searchParams.get("importance")?.split(",").filter(Boolean),
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
      return errorResponse(
        "Ongeldige filter parameters",
        400,
        paramsResult.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        }))
      );
    }

    const params = paramsResult.data;

    // Build where clause for occurrences
    const occurrenceWhere: Prisma.EventOccurrenceWhereInput = {};

    if (params.start && params.end) {
      occurrenceWhere.date = {
        gte: new Date(params.start),
        lte: new Date(params.end),
      };
    }

    // Build where clause for events
    const eventWhere: Prisma.EventWhereInput = {};

    // Search filter (name, description, tags)
    if (params.search) {
      eventWhere.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { description: { contains: params.search, mode: "insensitive" } },
        { tags: { has: params.search.toLowerCase() } },
      ];
    }

    // Category filter - filter by category.name for backwards compatibility
    if (params.categories && params.categories.length > 0) {
      eventWhere.category = { name: { in: params.categories } };
    }

    // Event type filter - validate against enum
    if (params.types && params.types.length > 0) {
      const validTypes = params.types.filter((t) =>
        Object.keys(EventType).includes(t)
      ) as EventType[];
      if (validTypes.length > 0) {
        eventWhere.eventType = { in: validTypes };
      }
    }

    // Importance filter - validate against enum
    if (params.importance && params.importance.length > 0) {
      const validImportances = params.importance.filter((i) =>
        Object.keys(Importance).includes(i)
      ) as Importance[];
      if (validImportances.length > 0) {
        eventWhere.importance = { in: validImportances };
      }
    }

    // Special tithi filter - validate against enum
    if (params.tithis && params.tithis.length > 0) {
      const validTithis = params.tithis.filter((t) =>
        Object.keys(Tithi).includes(t)
      ) as Tithi[];
      if (validTithis.length > 0) {
        eventWhere.tithi = { in: validTithis };
      }
    }

    // Add event filter to occurrence query
    if (Object.keys(eventWhere).length > 0) {
      occurrenceWhere.event = eventWhere;
    }

    // Determine sort order
    const order = params.order === "desc" ? "desc" : "asc";
    const orderBy: Prisma.EventOccurrenceOrderByWithRelationInput[] = [];

    if (params.sortBy === "name") {
      orderBy.push({ event: { name: order } });
    } else {
      orderBy.push({ date: order });
    }

    // Fetch occurrences with their parent events AND category
    const occurrences = await prisma.eventOccurrence.findMany({
      where: occurrenceWhere,
      include: {
        event: {
          include: {
            category: true,
          },
        },
      },
      orderBy,
    });

    // Transform to calendar-friendly format
    const calendarEvents = occurrences.map((occ) => {
      const endDate = occ.endDate ?? occ.date;

      return {
        id: occ.id,
        eventId: occ.event.id,
        title: occ.event.name,
        // Format dates as local YYYY-MM-DD to prevent timezone shifts
        start: formatDateLocal(occ.date),
        end: formatDateLocal(addDayForDisplay(endDate)),
        allDay: true,
        resource: {
          description: occ.event.description,
          eventType: occ.event.eventType,
          importance: occ.event.importance,
          category: occ.event.category,
          categoryId: occ.event.categoryId,
          tithi: occ.event.tithi,
          nakshatra: occ.event.nakshatra,
          maas: occ.event.maas,
          tags: occ.event.tags,
          notes: occ.notes,
          startTime: occ.startTime,
          endTime: occ.endTime,
          originalEndDate: occ.endDate ? formatDateLocal(occ.endDate) : null,
        },
      };
    });

    return NextResponse.json(calendarEvents);
  } catch (error) {
    console.error("[API] GET /api/events error:", error);
    return serverError("Kon events niet ophalen");
  }
}

// ============================================================================
// POST /api/events
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate with Zod
    const result = createEventSchema.safeParse(body);
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

    // Create event and occurrence in a transaction
    const event = await prisma.$transaction(async (tx) => {
      const newEvent = await tx.event.create({
        data: {
          name: data.name,
          description: data.description ?? null,
          eventType: data.eventType as EventType,
          categoryId: data.categoryId ?? null,
          importance: (data.importance ?? "MODERATE") as Importance,
          recurrenceType: data.recurrenceType as RecurrenceType,
          tithi: (data.tithi as Tithi) ?? null,
          nakshatra: (data.nakshatra as Nakshatra) ?? null,
          maas: (data.maas as Maas) ?? null,
          tags: data.tags ?? [],
        },
      });

      await tx.eventOccurrence.create({
        data: {
          eventId: newEvent.id,
          date: parseCalendarDate(data.date),
          endDate: data.endDate ? parseCalendarDate(data.endDate) : null,
          startTime: data.startTime ?? null,
          endTime: data.endTime ?? null,
          notes: data.notes ?? null,
        },
      });

      return newEvent;
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("[API] POST /api/events error:", error);

    // Handle specific Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case "P2002":
          // Unique constraint violation
          return errorResponse("Er bestaat al een event met deze naam", 409, [
            { field: "name", message: "Naam moet uniek zijn" },
          ]);
        case "P2003":
          // Foreign key constraint failed
          return errorResponse("Gerelateerde data niet gevonden", 400, [
            { field: "categoryId", message: "Categorie bestaat niet" },
          ]);
        case "P2025":
          // Record not found
          return errorResponse("Record niet gevonden", 404);
      }
    }

    return serverError("Kon event niet aanmaken");
  }
}
