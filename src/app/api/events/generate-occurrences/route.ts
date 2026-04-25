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
import { DEFAULT_LOCATION } from "@/lib/domain";
import { parseCalendarDate } from "@/lib/date-utils";
import { generateOccurrencesSchema } from "@/lib/validations";
import { validationError, notFoundError, serverError } from "@/lib/api-response";
import { logError } from "@/lib/utils";
import { EventNotFoundError, generateEventOccurrences } from "@/services/event.service";

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

    const maxOccurrences = data.maxOccurrences;
    const replace = data.replace;

    const response = await generateEventOccurrences({
      eventId: data.eventId,
      startDate,
      endDate,
      location: DEFAULT_LOCATION,
      timezone: DEFAULT_LOCATION.timezone,
      maxOccurrences,
      replace,
    });

    return NextResponse.json(response);
  } catch (error) {
    logError("[API] POST /api/events/generate-occurrences error:", error);

    if (error instanceof EventNotFoundError) {
      return notFoundError("Event");
    }

    return serverError("Kon occurrences niet genereren");
  }
}
