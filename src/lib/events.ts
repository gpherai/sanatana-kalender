import { CalendarEventResponse } from "@/types/calendar";

// Fallback sort key for series children without a dayNumber — sorts them last.
const UNKNOWN_DAY_ORDER = 999;

/**
 * Re-order events so series children appear directly below their parent occurrence.
 * Matching is date-range based: a child belongs to the parent occurrence whose
 * date range (start..originalEndDate) contains the child's start date.
 * This correctly separates e.g. Chaitra Navratri (April) children from
 * Sharad Navratri (October) children even though they share the same parent event IDs.
 */
export function groupChildrenUnderParents(
  events: CalendarEventResponse[]
): CalendarEventResponse[] {
  // Pre-sort: on the same date, series parents come before their children
  const sorted = [...events].sort((a, b) => {
    const dateDiff = a.start.localeCompare(b.start);
    if (dateDiff !== 0) return dateDiff;
    // Same date: parent (hasSeriesChildren) before child (has parents)
    return (
      (a.resource.hasSeriesChildren ? 0 : 1) - (b.resource.hasSeriesChildren ? 0 : 1)
    );
  });

  // Build map: parentEventId → all parent occurrences present in this result set
  const parentOccByEventId = new Map<string, CalendarEventResponse[]>();
  for (const event of sorted) {
    if (event.resource.hasSeriesChildren) {
      const arr = parentOccByEventId.get(event.eventId) ?? [];
      arr.push(event);
      parentOccByEventId.set(event.eventId, arr);
    }
  }

  // For each child occurrence, find the specific parent occurrence whose date range contains it.
  // Map: parentOccurrence.id → child occurrences (sorted by dayNumber)
  const childrenByParentOccId = new Map<string, CalendarEventResponse[]>();

  for (const event of sorted) {
    if (event.resource.seriesParentEventIds.length === 0) continue;

    for (const parentEventId of event.resource.seriesParentEventIds) {
      const parentOccs = parentOccByEventId.get(parentEventId) ?? [];
      const match = parentOccs.find((p) => {
        const rangeEnd = p.resource.originalEndDate ?? p.start;
        return event.start >= p.start && event.start <= rangeEnd;
      });
      if (match) {
        const arr = childrenByParentOccId.get(match.id) ?? [];
        arr.push(event);
        childrenByParentOccId.set(match.id, arr);
        break; // matched to exactly one parent occurrence
      }
    }
  }

  // Sort children within each parent occurrence by dayNumber
  for (const children of childrenByParentOccId.values()) {
    children.sort(
      (a, b) =>
        (a.resource.seriesDayNumber ?? UNKNOWN_DAY_ORDER) -
          (b.resource.seriesDayNumber ?? UNKNOWN_DAY_ORDER) ||
        a.start.localeCompare(b.start)
    );
  }

  const placed = new Set<string>();
  const result: CalendarEventResponse[] = [];

  for (const event of sorted) {
    if (placed.has(event.id)) continue;
    placed.add(event.id);
    result.push(event);

    // After a parent occurrence, insert its matched children immediately
    if (event.resource.hasSeriesChildren) {
      for (const child of childrenByParentOccId.get(event.id) ?? []) {
        if (!placed.has(child.id)) {
          placed.add(child.id);
          result.push(child);
        }
      }
    }
  }

  // Append children whose parent wasn't in this result set (e.g. filtered out)
  for (const event of sorted) {
    if (!placed.has(event.id)) result.push(event);
  }

  return result;
}
