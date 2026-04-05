/**
 * Shared types for the pure rule engine.
 *
 * These types are intentionally minimal subsets of the DB models — the engine
 * does not depend on Prisma directly, making it fully unit-testable.
 */

/** A single calendar occurrence produced by the rule engine */
export interface GeneratedOccurrence {
  date: Date;
  endDate?: Date;
  startTime?: string;
  endTime?: string;
  notes?: string;
}

/** Previous-day data used to detect evening-start tithis */
export interface PrevDayInfo {
  tithiEndTime: string | null;
  sunrise: string | null;
  /** Required for Nishitakal date-shift rule; optional for other callers */
  sunset?: string | null;
}
