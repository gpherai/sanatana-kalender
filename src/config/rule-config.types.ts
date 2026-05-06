/**
 * Type-safe rule configuration shapes for each EventNaming ruleType.
 *
 * These replace the `Record<string, unknown>` catch-all and ensure that
 * catalog entries are checked at compile time. The recurrence service uses
 * these types to safely access config properties without casting.
 */

import type { Maas, Nakshatra, Sankranti, Tithi } from "@prisma/client";

// ---------------------------------------------------------------------------
// Per-rule-type config shapes
// ---------------------------------------------------------------------------

/** TITHI: match a specific tithi, optionally in a specific maas */
export interface TithiRuleConfig {
  tithi: Tithi;
  /** Single maas or array of maas (for multi-occurrence events like Navadurga) */
  maas?: Maas | Maas[];
  /** Fire every month instead of yearly */
  monthly?: boolean;
  /** Match only Adhika months */
  isAdhikaOnly?: boolean;
  /** Number of days the event spans (e.g. Navratri = 9) */
  durationDays?: number;
  /** For kshaya tithi: place occurrence on the next calendar day instead of the predecessor's day */
  kshayaNextDay?: boolean;
  /**
   * Use Nishitakal-based date assignment instead of the udaya (sunrise) rule.
   * The festival is placed on the day whose Nishitakal the tithi was active in
   * for at least one muhurta. Example: Vaikuntha Chaturdashi.
   */
  nishitakalDateRule?: boolean;
  /**
   * Ratri Vyapini (night-pervading) date rule: observe on the day whose Pradosh
   * Kaal (sunset → sunset + nightDuration/5) is covered by the tithi.
   * If the tithi starts before Pradosh ends → that day (even if it precedes the
   * Udaya Tithi). If after Pradosh → the Udaya Tithi day. Example: Kalashtami.
   */
  dateRule?: "RATRI_VYAPINI";
}

/** SOLAR: match a specific Sankranti (sun entering a new sign) */
export interface SolarRuleConfig {
  sankranti: Sankranti;
}

/** NAKSHATRA: match a specific nakshatra, optionally in a specific maas */
export interface NakshatraRuleConfig {
  nakshatra: Nakshatra;
  maas?: Maas;
  /**
   * Filter to the Maargazhi solar month (Dhanu Sankranti → Makara Sankranti,
   * ~14 dec – 15 jan). No per-year deduplication: 0 or 2 occurrences per
   * calendar year are valid. Example: Arudra Darshan.
   */
  maargazhiRule?: boolean;
}

/** TITHI_NAKSHATRA: both tithi AND nakshatra must match */
export interface TithiNakshatraRuleConfig {
  tithi: Tithi;
  nakshatra: Nakshatra;
  maas?: Maas;
}

/** WEEKDAY_TITHI: tithi must fall on a specific weekday (JS getUTCDay(), 0=Sun … 6=Sat) */
export interface WeekdayTithiRuleConfig {
  tithi: Tithi;
  weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

/**
 * PRADOSH: Trayodashi must be active during Pradosh Kaal (sunset window).
 *
 * Uses sunset-based matching instead of udaya tithi (sunrise):
 * - Case 1: Trayodashi is udaya tithi AND active at sunset (tithiEndTime ≥ sunset or null)
 * - Case 2: Dwadashi is udaya tithi AND ends before sunset (Trayodashi starts before sunset)
 *
 * This correctly handles kshaya Trayodashi (never appears as udaya tithi)
 * and avoids backshift errors from the regular WEEKDAY_TITHI approach.
 */
export interface PradoshRuleConfig {
  paksha?: "SHUKLA" | "KRISHNA";
  weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

/** CUSTOM: open-ended for complex rules not covered by other types */
export type CustomRuleConfig = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Discriminated map (ruleType → config type)
// ---------------------------------------------------------------------------

export interface RuleConfigMap {
  TITHI: TithiRuleConfig;
  SOLAR: SolarRuleConfig;
  NAKSHATRA: NakshatraRuleConfig;
  TITHI_NAKSHATRA: TithiNakshatraRuleConfig;
  WEEKDAY_TITHI: WeekdayTithiRuleConfig;
  PRADOSH: PradoshRuleConfig;
  CUSTOM: CustomRuleConfig;
}

// ---------------------------------------------------------------------------
// Runtime helper
// ---------------------------------------------------------------------------

/**
 * Safely cast a raw Prisma JsonValue to a typed rule config.
 * Returns the typed object if `raw` is a plain object, or an empty object if not.
 * Fields are all optional (Partial<T>) because DB data may be incomplete.
 * Callers are still responsible for validating required fields at runtime.
 */
export function asRuleConfig<T>(raw: unknown): Partial<T> {
  if (raw !== null && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Partial<T>;
  }
  return {} as Partial<T>;
}
