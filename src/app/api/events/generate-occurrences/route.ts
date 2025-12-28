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

interface GenerateRequest {
  eventId?: string; // Optional: if provided, generate only for this event
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  location?: {
    name: string;
    lat: number;
    lon: number;
  };
  timezone?: string;
  maxOccurrences?: number;
  replace?: boolean; // If true, delete existing occurrences in range first
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();

    // Validate required fields
    if (!body.startDate || !body.endDate) {
      return NextResponse.json(
        { error: "startDate and endDate are required" },
        { status: 400 }
      );
    }

    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }

    if (startDate > endDate) {
      return NextResponse.json(
        { error: "startDate must be before endDate" },
        { status: 400 }
      );
    }

    const location = body.location || DEFAULT_LOCATION;
    const timezone = body.timezone || DEFAULT_LOCATION.timezone;
    const maxOccurrences = body.maxOccurrences;
    const replace = body.replace ?? false;

    // Single event generation
    if (body.eventId) {
      const event = await prisma.event.findUnique({
        where: { id: body.eventId },
      });

      if (!event) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
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
    console.error("Error generating occurrences:", error);
    return NextResponse.json(
      {
        error: "Failed to generate occurrences",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
