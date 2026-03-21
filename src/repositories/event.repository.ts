/**
 * Event Repository
 *
 * Data access layer for event occurrence queries.
 * Encapsulates Prisma query construction so API routes stay thin.
 *
 * @module repositories/event
 */

import { Prisma, EventType, Tithi } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { EventQueryParams } from "@/lib/validations";

// ============================================================================
// PRIVATE HELPERS
// ============================================================================

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
    where.category = { name: { in: params.categories } };
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
    occurrenceWhere.date = {
      gte: new Date(params.start),
      lte: new Date(params.end),
    };
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
          category: true,
          seriesParentEntries: {
            select: { parentEventId: true, dayNumber: true, sortOrder: true },
          },
          seriesChildEntries: {
            select: { childEventId: true },
          },
        },
      },
    },
    orderBy,
  });
}
