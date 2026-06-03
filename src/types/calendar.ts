/**
 * Calendar Types
 *
 * Types for react-big-calendar and API responses.
 * Uses Prisma enums for type safety.
 */

import type { EventType, Tithi, Nakshatra, Maas } from "@prisma/client";
import { EVENT_TYPES } from "@/lib/domain";
import { TIME_REGEX } from "@/lib/patterns";
import { parseLocalDate } from "@/lib/date-utils";

// =============================================================================
// RE-EXPORT PRISMA ENUMS
// =============================================================================

// Re-export enums used in CalendarEvent/CalendarEventResource shapes
export type { EventType, Tithi, Nakshatra, Maas };

// =============================================================================
// CATEGORY TYPE
// =============================================================================

/**
 * Category interface matching the database model
 */
export interface Category {
  id: string;
  name: string;
  displayName: string;
  icon: string;
  color: string;
  colorDark: string | null;
  description: string | null;
  sortOrder: number;
}

// =============================================================================
// CALENDAR EVENT RESOURCE TYPES
// =============================================================================

/**
 * Resource data attached to each calendar event.
 * Contains all event metadata for display.
 */
export interface CalendarEventResource {
  description: string | null;
  eventType: EventType;
  /** All categories ordered by sortOrder; [0] is the primary (color/icon on calendar) */
  categories: Category[];
  tithi: Tithi | null;
  nakshatra: Nakshatra | null;
  maas: Maas | null;
  tags: string[];
  notes: string | null;
  /** Start time in HH:mm format */
  startTime: string | null;
  /** End time in HH:mm format */
  endTime: string | null;
  /** Original end date from database (without +1 day adjustment for RBC) */
  originalEndDate: Date | null;
  /** Event IDs of parent series events (e.g. Navratri), empty for standalone events */
  seriesParentEventIds: string[];
  /** Position within the series (e.g. 1 = dag 1, null for non-series events) */
  seriesDayNumber: number | null;
  /** Whether this event has series children (i.e. it is a parent) */
  hasSeriesChildren: boolean;
  /** Recurrence type — "NONE" for one-time events */
  recurrenceType: string;
}

/**
 * Resource data in API response format (enums as strings, dates as ISO strings)
 */
export interface CalendarEventResourceResponse {
  description: string | null;
  eventType: string;
  /** All categories ordered by sortOrder; [0] is the primary (color/icon on calendar) */
  categories: Category[];
  tithi: string | null;
  nakshatra: string | null;
  maas: string | null;
  tags: string[];
  notes: string | null;
  startTime: string | null;
  endTime: string | null;
  originalEndDate: string | null;
  seriesParentEventIds: string[];
  seriesDayNumber: number | null;
  hasSeriesChildren: boolean;
  recurrenceType: string;
}

// =============================================================================
// CALENDAR EVENT TYPES
// =============================================================================

/**
 * Calendar event type for react-big-calendar.
 * Uses parsed Date objects.
 */
export interface CalendarEvent {
  /** Occurrence ID */
  id: string;
  /** Master Event ID */
  eventId: string;
  /** Event name */
  title: string;
  /** Start date/time */
  start: Date;
  /** End date/time (adjusted for react-big-calendar exclusive end) */
  end: Date;
  /** Is this an all-day event? */
  allDay: boolean;
  /** Event metadata */
  resource: CalendarEventResource;
}

/**
 * API response type (dates as ISO strings).
 * JSON serializable for network transport.
 */
export interface CalendarEventResponse {
  id: string;
  eventId: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  resource: CalendarEventResourceResponse;
}

// =============================================================================
// PARSER FUNCTIONS
// =============================================================================

// Date parsing (LOCAL midnight, with calendar-overflow validation) is shared
// from @/lib/date-utils — imported above.

/**
 * Transform API response to CalendarEvent with parsed dates.
 *
 * @param event - API response with string dates
 * @returns CalendarEvent with Date objects
 */
export function parseCalendarEvent(event: CalendarEventResponse): CalendarEvent {
  return {
    ...event,
    start: parseLocalDate(event.start),
    end: parseLocalDate(event.end),
    resource: {
      ...event.resource,
      // Cast validated string enums back to typed enums
      eventType: event.resource.eventType as EventType,
      tithi: event.resource.tithi as Tithi | null,
      nakshatra: event.resource.nakshatra as Nakshatra | null,
      maas: event.resource.maas as Maas | null,
      originalEndDate: event.resource.originalEndDate
        ? parseLocalDate(event.resource.originalEndDate)
        : null,
      seriesParentEventIds: event.resource.seriesParentEventIds,
      seriesDayNumber: event.resource.seriesDayNumber,
      hasSeriesChildren: event.resource.hasSeriesChildren,
      recurrenceType: event.resource.recurrenceType,
    },
  };
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

/**
 * Type guard to check if a string is a valid EventType.
 * Uses the Prisma-generated enum for accuracy.
 */
export function isValidEventType(value: string): value is EventType {
  return EVENT_TYPES.some((t) => t.value === value);
}

/**
 * Validate a time string is in HH:mm format.
 */
export function isValidTimeString(value: string): boolean {
  return TIME_REGEX.test(value);
}

// =============================================================================
// TIME STRING TYPE
// =============================================================================

/**
 * Branded type for validated time strings (HH:mm format).
 * Use isValidTimeString() before casting.
 */
export type TimeString = string & { readonly __brand: "TimeString" };

/**
 * Create a validated TimeString.
 * Returns null if validation fails.
 */
export function toTimeString(value: string): TimeString | null {
  return isValidTimeString(value) ? (value as TimeString) : null;
}
