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
import { DEFAULT_LOCATION } from "@/lib/constants";
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

    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

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

      // Optionally delete existing occurrences in range
      let deletedCount = 0;
      if (replace) {
        const deleteResult = await prisma.eventOccurrence.deleteMany({
          where: {
            eventId: event.id,
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
        });
        deletedCount = deleteResult.count;
      }

      // Insert new occurrences (upsert to handle duplicates)
      const insertedCount = await Promise.all(
        occurrences.map((occ) =>
          prisma.eventOccurrence.upsert({
            where: {
              eventId_date: {
                eventId: event.id,
                date: occ.date,
              },
            },
            create: {
              eventId: event.id,
              date: occ.date,
              endDate: occ.endDate,
              startTime: occ.startTime,
              endTime: occ.endTime,
              notes: occ.notes,
            },
            update: {
              endDate: occ.endDate,
              startTime: occ.startTime,
              endTime: occ.endTime,
              notes: occ.notes,
            },
          })
        )
      );

      return NextResponse.json({
        message: `Generated occurrences for "${event.name}"`,
        eventId: event.id,
        generated: insertedCount.length,
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

    // Process each event
    for (const [eventId, occurrences] of occurrencesMap.entries()) {
      // Optionally delete existing occurrences in range
      if (replace) {
        const deleteResult = await prisma.eventOccurrence.deleteMany({
          where: {
            eventId,
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
        });
        totalDeleted += deleteResult.count;
      }

      // Insert new occurrences (upsert to handle duplicates)
      const inserted = await Promise.all(
        occurrences.map((occ) =>
          prisma.eventOccurrence.upsert({
            where: {
              eventId_date: {
                eventId,
                date: occ.date,
              },
            },
            create: {
              eventId,
              date: occ.date,
              endDate: occ.endDate,
              startTime: occ.startTime,
              endTime: occ.endTime,
              notes: occ.notes,
            },
            update: {
              endDate: occ.endDate,
              startTime: occ.startTime,
              endTime: occ.endTime,
              notes: occ.notes,
            },
          })
        )
      );

      totalGenerated += inserted.length;
    }

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
