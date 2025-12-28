/**
 * Calendar Types
 *
 * Types for react-big-calendar and API responses.
 * Uses Prisma enums for type safety.
 */

import type {
  EventType,
  Importance,
  Tithi,
  Nakshatra,
  Maas,
  Paksha,
  RecurrenceType,
  CalendarView,
  MoonPhaseType,
} from "@/generated/prisma/enums";
import {
  EventType as EventTypeEnum,
  Importance as ImportanceEnum,
} from "@/generated/prisma/enums";
import { TIME_REGEX } from "@/lib/patterns";

// =============================================================================
// RE-EXPORT PRISMA ENUMS
// =============================================================================

// Re-export all Prisma enums for convenient imports
export type {
  EventType,
  Importance,
  Tithi,
  Nakshatra,
  Maas,
  Paksha,
  RecurrenceType,
  CalendarView,
  MoonPhaseType,
};

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
  importance: Importance;
  category: Category | null;
  categoryId: string | null;
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
}

/**
 * Resource data in API response format (enums as strings, dates as ISO strings)
 */
export interface CalendarEventResourceResponse {
  description: string | null;
  eventType: string;
  importance: string;
  category: Category | null;
  categoryId: string | null;
  tithi: string | null;
  nakshatra: string | null;
  maas: string | null;
  tags: string[];
  notes: string | null;
  startTime: string | null;
  endTime: string | null;
  originalEndDate: string | null;
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

/**
 * Parse a date string (YYYY-MM-DD) as LOCAL midnight, not UTC.
 * This ensures react-big-calendar displays all-day events correctly without timezone shifts.
 *
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Date object at LOCAL midnight
 */
function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  // Creates date at LOCAL midnight (not UTC)
  // This prevents timezone shifts in calendar display
  return new Date(year!, month! - 1, day!);
}

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
      importance: event.resource.importance as Importance,
      tithi: event.resource.tithi as Tithi | null,
      nakshatra: event.resource.nakshatra as Nakshatra | null,
      maas: event.resource.maas as Maas | null,
      originalEndDate: event.resource.originalEndDate
        ? parseLocalDate(event.resource.originalEndDate)
        : null,
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
  return Object.values(EventTypeEnum).includes(value as EventType);
}

/**
 * Type guard to check if a string is a valid Importance.
 * Uses the Prisma-generated enum for accuracy.
 */
export function isValidImportance(value: string): value is Importance {
  return Object.values(ImportanceEnum).includes(value as Importance);
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
