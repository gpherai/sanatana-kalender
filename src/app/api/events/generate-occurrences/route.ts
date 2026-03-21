/**
 * API Route: Generate Event Occurrences
 *
 * POST /api/events/generate-occurrences
 *
 * Generates EventOccurrences for events based on their recurrence rules.
 * Can generate for a single event or all events with recurrence.
 *
 * @example Single event generation
 * POST /api/events/generate-occurrences
 * {
 *   "eventId": "cm...",
 *   "startDate": "2025-01-01",
 *   "endDate": "2027-12-31"
 * }
 *
 * @example Batch generation (all events)
 * POST /api/events/generate-occurrences
 * {
 *   "startDate": "2025-01-01",
 *   "endDate": "2027-12-31"
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  generateOccurrences,
  generateOccurrencesForEvents,
} from "@/services/recurrence.service";
import { DEFAULT_LOCATION } from "@/lib/domain";
import { parseCalendarDate } from "@/lib/date-utils";
import { generateOccurrencesSchema } from "@/lib/validations";
import { validationError, notFoundError, serverError } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate with Zod
    const result = generateOccurrencesSchema.safeParse(body);
    if (!result.success) {
      return validationError(result.error);
    }

    const data = result.data;

    const startDate = parseCalendarDate(data.startDate);
    const endDate = parseCalendarDate(data.endDate);

    if (startDate > endDate) {
      return NextResponse.json(
        { error: "startDate must be before endDate" },
        { status: 400 }
      );
    }

    const location = data.location || DEFAULT_LOCATION;
    const timezone = data.timezone || DEFAULT_LOCATION.timezone;
    const maxOccurrences = data.maxOccurrences;
    const replace = data.replace;

    // Single event generation
    if (data.eventId) {
      const event = await prisma.event.findUnique({
        where: { id: data.eventId },
      });

      if (!event) {
        return notFoundError("Event");
      }

      if (event.recurrenceType === "NONE") {
        return NextResponse.json(
          {
            message: "Event has no recurrence",
            generated: 0,
            deleted: 0,
          },
          { status: 200 }
        );
      }

      // Generate occurrences
      const occurrences = await generateOccurrences(event, {
        startDate,
        endDate,
        location,
        timezone,
        maxOccurrences,
      });

      // Delete + insert in a single transaction to prevent partial state on failure
      const { deletedCount, generatedCount } = await prisma.$transaction(async (tx) => {
        let deleted = 0;
        if (replace) {
          const deleteResult = await tx.eventOccurrence.deleteMany({
            where: {
              eventId: event.id,
              date: { gte: startDate, lte: endDate },
            },
          });
          deleted = deleteResult.count;
        }

        const createResult = await tx.eventOccurrence.createMany({
          data: occurrences.map((occ) => ({
            eventId: event.id,
            date: occ.date,
            endDate: occ.endDate,
            startTime: occ.startTime,
            endTime: occ.endTime,
            notes: occ.notes,
          })),
          skipDuplicates: true,
        });

        return { deletedCount: deleted, generatedCount: createResult.count };
      });

      return NextResponse.json({
        message: `Generated occurrences for "${event.name}"`,
        eventId: event.id,
        generated: generatedCount,
        deleted: deletedCount,
      });
    }

    // Batch generation (all events with recurrence)
    const eventsWithRecurrence = await prisma.event.findMany({
      where: {
        recurrenceType: {
          not: "NONE",
        },
      },
    });

    if (eventsWithRecurrence.length === 0) {
      return NextResponse.json({
        message: "No events with recurrence found",
        generated: 0,
        deleted: 0,
      });
    }

    // Generate occurrences for all events
    const occurrencesMap = await generateOccurrencesForEvents(eventsWithRecurrence, {
      startDate,
      endDate,
      location,
      timezone,
      maxOccurrences,
    });

    let totalGenerated = 0;
    let totalDeleted = 0;

    // Process all events in a single transaction to prevent partial state on failure
    await prisma.$transaction(async (tx) => {
      for (const [eventId, occurrences] of occurrencesMap.entries()) {
        if (replace) {
          const deleteResult = await tx.eventOccurrence.deleteMany({
            where: {
              eventId,
              date: { gte: startDate, lte: endDate },
            },
          });
          totalDeleted += deleteResult.count;
        }

        if (occurrences.length > 0) {
          const insertResult = await tx.eventOccurrence.createMany({
            data: occurrences.map((occ) => ({
              eventId,
              date: occ.date,
              endDate: occ.endDate,
              startTime: occ.startTime,
              endTime: occ.endTime,
              notes: occ.notes,
            })),
            skipDuplicates: true,
          });
          totalGenerated += insertResult.count;
        }
      }
    });

    return NextResponse.json({
      message: `Generated occurrences for ${eventsWithRecurrence.length} events`,
      eventsProcessed: eventsWithRecurrence.length,
      generated: totalGenerated,
      deleted: totalDeleted,
    });
  } catch (error) {
    console.error("[API] POST /api/events/generate-occurrences error:", error);
    return serverError("Kon occurrences niet genereren");
  }
}
