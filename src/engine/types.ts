/**
 * Shared types for the pure rule engine.
 *
 * These types are intentionally minimal subsets of the DB models — the engine
 * does not depend on Prisma directly, making it fully unit-testable.
 */

/** Subset of DailyInfo needed by occurrence-matching logic */
export interface DailyInfoRow {
  date: Date;
  tithi: string | null;
  tithiEndTime: string | null;
  nakshatra: string | null;
  nakshatraEndTime: string | null;
  maas: string | null;
  isAdhika: boolean;
  sankranti: string | null;
  sankrantiTime: string | null;
  sunrise: string | null;
  sunset: string | null;
}

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
}
