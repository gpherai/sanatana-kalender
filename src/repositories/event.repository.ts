/**
 * Event Repository
 *
 * Data access layer for event records and event occurrence queries.
 * Encapsulates Prisma query construction so API routes stay thin.
 *
 * @module repositories/event
 */

import {
  Prisma,
  EventType,
  Tithi,
  Nakshatra,
  Maas,
  Sankranti,
  RecurrenceType,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { DateTime } from "luxon";
import { DEFAULT_LOCATION } from "@/lib/domain";
import type { EventQueryParams } from "@/lib/validations";
import type { GeneratedOccurrence } from "@/engine";

// ============================================================================
// TYPES
// ============================================================================

export interface CreateEventRecordInput {
  name: string;
  description: string | null;
  eventType: EventType;
  recurrenceType: RecurrenceType;
  tithi: Tithi | null;
  nakshatra: Nakshatra | null;
  maas: Maas | null;
  sankranti: Sankranti | null;
  tags: string[];
  categoryId?: string | null;
  date: Date;
  endDate?: Date | null;
  startTime?: string | null;
  endTime?: string | null;
  notes?: string | null;
}

export interface UpdateEventRecordInput {
  name?: string;
  description?: string | null;
  eventType?: EventType;
  recurrenceType?: RecurrenceType;
  tithi?: Tithi | null;
  nakshatra?: Nakshatra | null;
  maas?: Maas | null;
  sankranti?: Sankranti | null;
  tags?: string[];
  categoryId?: string | null;
  firstOccurrenceId?: string;
  date?: Date;
  endDate?: Date | null;
  startTime?: string | null;
  endTime?: string | null;
  notes?: string | null;
}

export interface UpdateOccurrenceRecordInput {
  date?: Date;
  endDate?: Date | null;
  startTime?: string | null;
  endTime?: string | null;
  notes?: string | null;
}

interface GeneratedOccurrencesWindow {
  startDate: Date;
  endDate: Date;
  replace: boolean;
}

// ============================================================================
// PRIVATE HELPERS
// ============================================================================

const eventCategoryInclude = {
  include: { category: true },
  orderBy: { sortOrder: "asc" as const },
} satisfies Prisma.EventCategoryFindManyArgs;

const eventDetailInclude = {
  categories: eventCategoryInclude,
  occurrences: {
    orderBy: { date: "asc" as const },
  },
  seriesParentEntries: {
    include: {
      child: { select: { id: true, name: true } },
    },
    orderBy: { sortOrder: "asc" as const },
  },
  seriesChildEntries: {
    include: {
      parent: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.EventInclude;

function buildEventWhere(params: EventQueryParams): Prisma.EventWhereInput {
  const where: Prisma.EventWhereInput = {};

  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: "insensitive" } },
      { description: { contains: params.search, mode: "insensitive" } },
      { tags: { has: params.search.toLowerCase() } },
    ];
  }

  if (params.categories && params.categories.length > 0) {
    where.categories = {
      some: { category: { name: { in: params.categories } } },
    };
  }

  if (params.types && params.types.length > 0) {
    const validTypes = params.types.filter((t) =>
      Object.keys(EventType).includes(t)
    ) as EventType[];
    if (validTypes.length > 0) {
      where.eventType = { in: validTypes };
    }
  }

  if (params.tithis && params.tithis.length > 0) {
    const validTithis = params.tithis.filter((t) =>
      Object.keys(Tithi).includes(t)
    ) as Tithi[];
    if (validTithis.length > 0) {
      where.tithi = { in: validTithis };
    }
  }

  return where;
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Find event occurrences matching the given filter parameters.
 * Includes the parent event, its category, and series relationships.
 */
export async function findEventOccurrences(params: EventQueryParams) {
  const occurrenceWhere: Prisma.EventOccurrenceWhereInput = {};

  if (params.start && params.end) {
    const start = new Date(params.start);
    const end = new Date(params.end);
    // Include occurrences that overlap the range:
    // - No endDate: start date falls within range
    // - Has endDate: event period [date, endDate] overlaps [start, end]
    occurrenceWhere.OR = [
      { date: { gte: start, lte: end }, endDate: null },
      { date: { lte: end }, endDate: { gte: start } },
    ];
  }

  const eventWhere = buildEventWhere(params);
  if (Object.keys(eventWhere).length > 0) {
    occurrenceWhere.event = eventWhere;
  }

  const order = params.order === "desc" ? "desc" : "asc";
  const orderBy: Prisma.EventOccurrenceOrderByWithRelationInput[] =
    params.sortBy === "name" ? [{ event: { name: order } }] : [{ date: order }];

  return prisma.eventOccurrence.findMany({
    where: occurrenceWhere,
    include: {
      event: {
        include: {
          categories: eventCategoryInclude,
          seriesChildEntries: {
            select: { parentEventId: true, dayNumber: true, sortOrder: true },
          },
          seriesParentEntries: {
            select: { childEventId: true },
          },
        },
      },
    },
    orderBy,
  });
}

/**
 * Find upcoming event occurrences from today through N days after today.
 * Starting from today in Europe/Amsterdam timezone (DEFAULT_LOCATION.timezone).
 * Includes multi-day events that started before today but end within window.
 */
export async function findUpcomingOccurrences(
  daysAfterToday = 6,
  now = DateTime.now().setZone(DEFAULT_LOCATION.timezone)
) {
  const anchor = now.startOf("day");
  const todayStart = anchor.toUTC().toJSDate();
  const futureEnd = anchor.plus({ days: daysAfterToday }).endOf("day").toUTC().toJSDate();

  return prisma.eventOccurrence.findMany({
    where: {
      OR: [
        { date: { gte: todayStart, lte: futureEnd }, endDate: null },
        { date: { lte: futureEnd }, endDate: { gte: todayStart } },
      ],
    },
    include: {
      event: {
        include: {
          categories: eventCategoryInclude,
        },
      },
    },
    orderBy: {
      date: "asc",
    },
  });
}

/**
 * Find all occurrences needed to generate an iCal export.
 */
export async function findOccurrencesForIcalExport() {
  return prisma.eventOccurrence.findMany({
    include: {
      event: {
        include: {
          categories: eventCategoryInclude,
        },
      },
    },
    orderBy: { date: "asc" },
  });
}

/**
 * Find a single event by ID with all relations needed for the detail endpoint.
 */
export async function findEventById(id: string) {
  return prisma.event.findUnique({
    where: { id },
    include: eventDetailInclude,
  });
}

/**
 * Find a single event by ID with only the data needed for the detail display page.
 * Excludes series relationship entries (not shown on the page) to keep the query lean.
 */
export async function findEventByIdForDisplay(id: string) {
  return prisma.event.findUnique({
    where: { id },
    include: {
      categories: eventCategoryInclude,
      occurrences: {
        orderBy: { date: "asc" as const },
      },
    },
  });
}

/**
 * Find a single event by ID with just its first occurrence for update flows.
 */
export async function findEventForUpdate(id: string) {
  return prisma.event.findUnique({
    where: { id },
    include: {
      categories: {
        ...eventCategoryInclude,
        take: 1,
      },
      occurrences: {
        orderBy: { date: "asc" as const },
        take: 1,
      },
    },
  });
}

/**
 * Find a single event by ID without eager-loading relations.
 */
export async function findEventByIdBasic(id: string) {
  return prisma.event.findUnique({
    where: { id },
  });
}

/**
 * Find all events that have a recurrence rule.
 */
export async function findEventsWithRecurrence() {
  return prisma.event.findMany({
    where: {
      recurrenceType: {
        not: "NONE",
      },
    },
  });
}

/**
 * Create an event, its primary category link, and its initial occurrence.
 */
export async function createEventWithInitialOccurrence(input: CreateEventRecordInput) {
  return prisma.$transaction(async (tx) => {
    const newEvent = await tx.event.create({
      data: {
        name: input.name,
        description: input.description,
        eventType: input.eventType,
        recurrenceType: input.recurrenceType,
        tithi: input.tithi,
        nakshatra: input.nakshatra,
        maas: input.maas,
        sankranti: input.sankranti,
        tags: input.tags,
      },
    });

    if (input.categoryId) {
      await tx.eventCategory.create({
        data: {
          eventId: newEvent.id,
          categoryId: input.categoryId,
          sortOrder: 0,
        },
      });
    }

    await tx.eventOccurrence.create({
      data: {
        eventId: newEvent.id,
        date: input.date,
        endDate: input.endDate ?? null,
        startTime: input.startTime ?? null,
        endTime: input.endTime ?? null,
        notes: input.notes ?? null,
      },
    });

    return newEvent;
  });
}

/**
 * Update an event, its primary category link, and optionally its first occurrence.
 */
export async function updateEventWithPrimaryOccurrence(
  id: string,
  input: UpdateEventRecordInput
) {
  return prisma.$transaction(async (tx) => {
    const updatedEvent = await tx.event.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.eventType !== undefined && { eventType: input.eventType }),
        ...(input.recurrenceType !== undefined && {
          recurrenceType: input.recurrenceType,
        }),
        ...(input.tithi !== undefined && { tithi: input.tithi }),
        ...(input.nakshatra !== undefined && { nakshatra: input.nakshatra }),
        ...(input.maas !== undefined && { maas: input.maas }),
        ...(input.sankranti !== undefined && { sankranti: input.sankranti }),
        ...(input.tags !== undefined && { tags: input.tags }),
      },
      include: {
        categories: eventCategoryInclude,
      },
    });

    if (input.categoryId !== undefined) {
      await tx.eventCategory.deleteMany({
        where: { eventId: id, sortOrder: 0 },
      });

      if (input.categoryId) {
        await tx.eventCategory.upsert({
          where: { eventId_categoryId: { eventId: id, categoryId: input.categoryId } },
          create: { eventId: id, categoryId: input.categoryId, sortOrder: 0 },
          update: { sortOrder: 0 },
        });
      }
    }

    if (input.firstOccurrenceId) {
      const occurrenceData = {
        ...(input.date !== undefined && { date: input.date }),
        ...(input.endDate !== undefined && { endDate: input.endDate }),
        ...(input.startTime !== undefined && { startTime: input.startTime }),
        ...(input.endTime !== undefined && { endTime: input.endTime }),
        ...(input.notes !== undefined && { notes: input.notes }),
      };

      if (Object.keys(occurrenceData).length > 0) {
        await tx.eventOccurrence.update({
          where: { id: input.firstOccurrenceId },
          data: occurrenceData,
        });
      }
    }

    if (input.categoryId === undefined) {
      return updatedEvent;
    }

    return tx.event.findUniqueOrThrow({
      where: { id },
      include: {
        categories: eventCategoryInclude,
      },
    });
  });
}

/**
 * Delete an event by ID.
 */
export async function deleteEventById(id: string) {
  return prisma.event.delete({
    where: { id },
  });
}

/**
 * Find a single occurrence by ID.
 */
export async function findOccurrenceById(id: string) {
  return prisma.eventOccurrence.findUnique({
    where: { id },
  });
}

/**
 * Delete a single occurrence by ID.
 * Does NOT delete the parent event.
 */
export async function deleteOccurrenceById(id: string) {
  return prisma.eventOccurrence.delete({
    where: { id },
  });
}

/**
 * Check if an event already has another occurrence on the target date.
 */
export async function findOccurrenceConflict(
  eventId: string,
  date: Date,
  excludeOccurrenceId: string
) {
  return prisma.eventOccurrence.findFirst({
    where: {
      eventId,
      date,
      NOT: { id: excludeOccurrenceId },
    },
  });
}

/**
 * Update an occurrence by ID.
 */
export async function updateOccurrenceById(
  id: string,
  input: UpdateOccurrenceRecordInput
) {
  return prisma.eventOccurrence.update({
    where: { id },
    data: {
      ...(input.date !== undefined && { date: input.date }),
      ...(input.endDate !== undefined && { endDate: input.endDate }),
      ...(input.startTime !== undefined && { startTime: input.startTime }),
      ...(input.endTime !== undefined && { endTime: input.endTime }),
      ...(input.notes !== undefined && { notes: input.notes }),
    },
  });
}

/**
 * Replace or append generated occurrences for a single event.
 */
export async function persistGeneratedOccurrencesForEvent(
  eventId: string,
  occurrences: GeneratedOccurrence[],
  window: GeneratedOccurrencesWindow
) {
  return prisma.$transaction(async (tx) => {
    let deleted = 0;

    if (window.replace) {
      const deleteResult = await tx.eventOccurrence.deleteMany({
        where: {
          eventId,
          date: { gte: window.startDate, lte: window.endDate },
        },
      });
      deleted = deleteResult.count;
    }

    if (occurrences.length === 0) {
      return { deletedCount: deleted, generatedCount: 0 };
    }

    const createResult = await tx.eventOccurrence.createMany({
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

    return { deletedCount: deleted, generatedCount: createResult.count };
  });
}

/**
 * Replace or append generated occurrences for multiple events in one transaction.
 */
export async function persistGeneratedOccurrencesForEvents(
  occurrencesMap: Map<string, GeneratedOccurrence[]>,
  window: GeneratedOccurrencesWindow
) {
  let totalGenerated = 0;
  let totalDeleted = 0;

  await prisma.$transaction(async (tx) => {
    for (const [eventId, occurrences] of occurrencesMap.entries()) {
      if (window.replace) {
        const deleteResult = await tx.eventOccurrence.deleteMany({
          where: {
            eventId,
            date: { gte: window.startDate, lte: window.endDate },
          },
        });
        totalDeleted += deleteResult.count;
      }

      if (occurrences.length === 0) {
        continue;
      }

      const createResult = await tx.eventOccurrence.createMany({
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
      totalGenerated += createResult.count;
    }
  });

  return { deletedCount: totalDeleted, generatedCount: totalGenerated };
}
