import "server-only";

import {
  EventType,
  RecurrenceType,
  Tithi,
  Nakshatra,
  Maas,
  Sankranti,
} from "@prisma/client";
import { parseCalendarDate } from "@/lib/date-utils";
import { findCategoryById } from "@/repositories/category.repository";
import {
  createEventWithInitialOccurrence,
  deleteEventById,
  deleteOccurrenceById,
  findEventById,
  findEventByIdBasic,
  findEventsWithRecurrence,
  findOccurrenceById,
  findOccurrenceConflict,
  persistGeneratedOccurrencesForEvent,
  persistGeneratedOccurrencesForEvents,
  updateEventWithPrimaryOccurrence,
  updateOccurrenceById,
} from "@/repositories/event.repository";
import {
  generateOccurrences,
  generateOccurrencesForEvents,
} from "@/services/recurrence.service";

// ============================================================================
// ERROR TYPES
// ============================================================================

class EventServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class EventNotFoundError extends EventServiceError {}
export class CategoryNotFoundError extends EventServiceError {}
export class OccurrenceNotFoundError extends EventServiceError {}
export class OccurrenceOwnershipError extends EventServiceError {}
export class OccurrenceConflictError extends EventServiceError {}

// ============================================================================
// TYPES
// ============================================================================

interface EventDateFieldsInput {
  date: string;
  endDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  notes?: string | null;
}

interface EventBaseInput {
  name: string;
  description?: string | null;
  eventType: string;
  categoryId?: string | null;
  recurrenceType: string;
  tithi?: string | null;
  nakshatra?: string | null;
  maas?: string | null;
  sankranti?: string | null;
  tags?: string[];
}

export interface CreateEventInput extends EventBaseInput, EventDateFieldsInput {}

export interface UpdateEventInput extends Partial<EventBaseInput> {
  date?: string;
  endDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  notes?: string | null;
}

export interface UpdateEventOccurrenceInput {
  date?: string;
  endDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  notes?: string | null;
}

export interface GenerateEventOccurrencesInput {
  eventId?: string;
  startDate: Date;
  endDate: Date;
  location: {
    name: string;
    lat: number;
    lon: number;
  };
  timezone: string;
  maxOccurrences?: number;
  replace: boolean;
}

// ============================================================================
// HELPERS
// ============================================================================

function normalizeEventMutationInput(input: CreateEventInput | UpdateEventInput) {
  return {
    ...(input.name !== undefined && { name: input.name }),
    ...(input.description !== undefined && { description: input.description ?? null }),
    ...(input.eventType !== undefined && { eventType: input.eventType as EventType }),
    ...(input.recurrenceType !== undefined && {
      recurrenceType: input.recurrenceType as RecurrenceType,
    }),
    ...(input.tithi !== undefined && { tithi: (input.tithi as Tithi | null) ?? null }),
    ...(input.nakshatra !== undefined && {
      nakshatra: (input.nakshatra as Nakshatra | null) ?? null,
    }),
    ...(input.maas !== undefined && { maas: (input.maas as Maas | null) ?? null }),
    ...(input.sankranti !== undefined && {
      sankranti: (input.sankranti as Sankranti | null) ?? null,
    }),
    ...(input.tags !== undefined && { tags: input.tags }),
    ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
    ...(input.date !== undefined && { date: parseCalendarDate(input.date) }),
    ...(input.endDate !== undefined && {
      endDate: input.endDate ? parseCalendarDate(input.endDate) : null,
    }),
    ...(input.startTime !== undefined && { startTime: input.startTime ?? null }),
    ...(input.endTime !== undefined && { endTime: input.endTime ?? null }),
    ...(input.notes !== undefined && { notes: input.notes ?? null }),
  };
}

// ============================================================================
// DETAIL LOOKUP
// ============================================================================

export async function getEventDetails(id: string) {
  const eventRaw = await findEventById(id);

  if (!eventRaw) {
    return null;
  }

  const { seriesParentEntries, seriesChildEntries, ...rest } = eventRaw;

  const childEventMap = new Map<
    string,
    { id: string; name: string; dayNumber: number | null }
  >();
  for (const entry of seriesParentEntries) {
    if (!childEventMap.has(entry.child.id)) {
      childEventMap.set(entry.child.id, {
        ...entry.child,
        dayNumber: entry.dayNumber,
      });
    }
  }

  const parentEventMap = new Map<string, { id: string; name: string }>();
  for (const entry of seriesChildEntries) {
    parentEventMap.set(entry.parent.id, entry.parent);
  }

  return {
    ...rest,
    parentEvents: [...parentEventMap.values()],
    childEvents: [...childEventMap.values()],
  };
}

// ============================================================================
// EVENT MUTATIONS
// ============================================================================

export async function createEvent(input: CreateEventInput) {
  if (input.categoryId) {
    const category = await findCategoryById(input.categoryId);
    if (!category) {
      throw new CategoryNotFoundError("Categorie niet gevonden");
    }
  }

  const normalized = normalizeEventMutationInput(input);

  return createEventWithInitialOccurrence({
    name: normalized.name!,
    description: normalized.description ?? null,
    eventType: normalized.eventType!,
    recurrenceType: normalized.recurrenceType!,
    tithi: normalized.tithi ?? null,
    nakshatra: normalized.nakshatra ?? null,
    maas: normalized.maas ?? null,
    sankranti: normalized.sankranti ?? null,
    tags: normalized.tags ?? [],
    categoryId: normalized.categoryId,
    date: normalized.date!,
    endDate: normalized.endDate,
    startTime: normalized.startTime,
    endTime: normalized.endTime,
    notes: normalized.notes,
  });
}

export async function updateEvent(
  id: string,
  input: UpdateEventInput,
  firstOccurrenceId?: string
) {
  if (input.categoryId) {
    const category = await findCategoryById(input.categoryId);
    if (!category) {
      throw new CategoryNotFoundError("Categorie niet gevonden");
    }
  }

  const normalized = normalizeEventMutationInput(input);

  return updateEventWithPrimaryOccurrence(id, {
    ...normalized,
    firstOccurrenceId,
  });
}

export async function deleteEvent(id: string) {
  const event = await findEventByIdBasic(id);

  if (!event) {
    throw new EventNotFoundError("Event niet gevonden");
  }

  await deleteEventById(id);
}

// ============================================================================
// OCCURRENCE MUTATIONS
// ============================================================================

export async function updateEventOccurrence(
  eventId: string,
  occurrenceId: string,
  input: UpdateEventOccurrenceInput
) {
  const occurrence = await findOccurrenceById(occurrenceId);

  if (!occurrence) {
    throw new OccurrenceNotFoundError("Occurrence niet gevonden");
  }

  if (occurrence.eventId !== eventId) {
    throw new OccurrenceOwnershipError("Occurrence behoort niet tot dit event");
  }

  if (input.date !== undefined) {
    const conflict = await findOccurrenceConflict(
      eventId,
      parseCalendarDate(input.date),
      occurrenceId
    );

    if (conflict) {
      throw new OccurrenceConflictError(
        "Er bestaat al een occurrence op deze datum voor dit event"
      );
    }
  }

  return updateOccurrenceById(occurrenceId, {
    ...(input.date !== undefined && { date: parseCalendarDate(input.date) }),
    ...(input.endDate !== undefined && {
      endDate: input.endDate ? parseCalendarDate(input.endDate) : null,
    }),
    ...(input.startTime !== undefined && { startTime: input.startTime ?? null }),
    ...(input.endTime !== undefined && { endTime: input.endTime ?? null }),
    ...(input.notes !== undefined && { notes: input.notes ?? null }),
  });
}

export async function deleteEventOccurrence(eventId: string, occurrenceId: string) {
  const occurrence = await findOccurrenceById(occurrenceId);

  if (!occurrence) {
    throw new OccurrenceNotFoundError("Occurrence niet gevonden");
  }

  if (occurrence.eventId !== eventId) {
    throw new OccurrenceOwnershipError("Occurrence behoort niet tot dit event");
  }

  await deleteOccurrenceById(occurrenceId);
}

// ============================================================================
// GENERATION
// ============================================================================

export async function generateEventOccurrences(input: GenerateEventOccurrencesInput) {
  if (input.eventId) {
    const event = await findEventByIdBasic(input.eventId);

    if (!event) {
      throw new EventNotFoundError("Event niet gevonden");
    }

    if (event.recurrenceType === "NONE") {
      return {
        message: "Event has no recurrence",
        eventId: event.id,
        generated: 0,
        deleted: 0,
      };
    }

    const occurrences = await generateOccurrences(event, {
      startDate: input.startDate,
      endDate: input.endDate,
      location: input.location,
      timezone: input.timezone,
      maxOccurrences: input.maxOccurrences,
    });

    const { deletedCount, generatedCount } = await persistGeneratedOccurrencesForEvent(
      event.id,
      occurrences,
      {
        startDate: input.startDate,
        endDate: input.endDate,
        replace: input.replace,
      }
    );

    return {
      message: `Generated occurrences for "${event.name}"`,
      eventId: event.id,
      generated: generatedCount,
      deleted: deletedCount,
    };
  }

  const eventsWithRecurrence = await findEventsWithRecurrence();

  if (eventsWithRecurrence.length === 0) {
    return {
      message: "No events with recurrence found",
      generated: 0,
      deleted: 0,
    };
  }

  const { results: occurrencesMap, failedCount } = await generateOccurrencesForEvents(
    eventsWithRecurrence,
    {
      startDate: input.startDate,
      endDate: input.endDate,
      location: input.location,
      timezone: input.timezone,
      maxOccurrences: input.maxOccurrences,
    }
  );

  const { deletedCount, generatedCount } = await persistGeneratedOccurrencesForEvents(
    occurrencesMap,
    {
      startDate: input.startDate,
      endDate: input.endDate,
      replace: input.replace,
    }
  );

  return {
    message: `Generated occurrences for ${eventsWithRecurrence.length} events`,
    eventsProcessed: eventsWithRecurrence.length,
    generated: generatedCount,
    deleted: deletedCount,
    ...(failedCount > 0 && { failed: failedCount }),
  };
}
