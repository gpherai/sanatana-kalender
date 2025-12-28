/**
 * API Response Types
 * Type definitions for API endpoint responses
 */

import type { DailyInfoData } from "@/services";

/**
 * API response shape for /api/daily-info endpoint
 *
 * This extends DailyInfoData but transforms certain fields from simple strings
 * to structured objects containing the full Panchanga data from Swiss Ephemeris.
 *
 * Key differences from DailyInfoData:
 * - date: Date object → ISO string
 * - tithi: string → { number, name, paksha, endTime }
 * - nakshatra: string → { number, name, pada, endTime }
 * - yogaName: string → yoga: { number, name, endTime }
 * - karanaName: string → karana: { number, name, type, endTime }
 * - Adds: moonPhaseEmoji, moonPhaseName, vara, rahuKalam
 *
 * @see /src/app/api/daily-info/route.ts for the transformation logic
 */
export interface DailyInfoResponse
  extends Omit<
    DailyInfoData,
    "date" | "moonPhaseType" | "tithi" | "nakshatra" | "yogaName" | "karanaName" | "maas"
  > {
  /** ISO date string (YYYY-MM-DD) */
  date: string;

  /** Moon phase type enum value (e.g., "FULL_MOON", "NEW_MOON") */
  moonPhaseType: string | null;

  /** Unicode emoji representing the current moon phase */
  moonPhaseEmoji: string;

  /** Dutch name of the moon phase (e.g., "Volle Maan", "Nieuwe Maan") */
  moonPhaseName: string;

  /**
   * Vara (Vedic weekday)
   * Each day is ruled by a planetary deity
   */
  vara?: {
    /** Sanskrit name (e.g., "Ravivara" for Sunday) */
    name: string;
  };

  /**
   * Tithi (lunar day, 1-15 in each paksha)
   * The moon's angular distance from the sun in 12° increments
   */
  tithi?: {
    /** Tithi number (1-15) */
    number: number;
    /** Sanskrit name (e.g., "Pratipada", "Purnima") */
    name: string;
    /** Lunar fortnight: Shukla (waxing) or Krishna (waning) */
    paksha: "Shukla" | "Krishna";
    /** Local time when this tithi ends (HH:mm format) */
    endTime: string | null;
  };

  /**
   * Nakshatra (lunar mansion, 1 of 27)
   * The moon's position in one of 27 asterisms along the ecliptic
   */
  nakshatra?: {
    /** Nakshatra number (1-27) */
    number: number;
    /** Sanskrit name (e.g., "Ashwini", "Bharani") */
    name: string;
    /** Pada (quarter) within the nakshatra (1-4) */
    pada: 1 | 2 | 3 | 4;
    /** Local time when this nakshatra ends (HH:mm format) */
    endTime: string | null;
  };

  /**
   * Yoga (auspicious/inauspicious combination, 1 of 27)
   * Sum of sun and moon's longitudes divided into 27 parts
   */
  yoga?: {
    /** Yoga number (1-27) */
    number: number;
    /** Sanskrit name (e.g., "Vishkambha", "Siddha") */
    name: string;
    /** Local time when this yoga ends (HH:mm format) */
    endTime?: string | null;
  };

  /**
   * Karana (half-tithi, 1 of 11)
   * Half of a tithi; used for determining auspicious timings
   */
  karana?: {
    /** Karana number (1-11) */
    number: number;
    /** Sanskrit name (e.g., "Bava", "Balava") */
    name: string;
    /** Type: "Movable" or "Fixed" */
    type: string;
    /** Local time when this karana ends (HH:mm format) */
    endTime?: string | null;
  };

  /**
   * Rahu Kalam (inauspicious time period)
   * 90-minute period ruled by Rahu; avoided for new ventures
   */
  rahuKalam?: {
    /** Start time in HH:mm format */
    start: string;
    /** End time in HH:mm format */
    end: string;
  };

  /**
   * Special day metadata (server-calculated)
   * Detects significant lunar days based on tithi and paksha
   * Replaces client-side detectSpecialDay() calls
   * @since v1.3.0
   */
  specialDay?: {
    /** Type identifier (e.g., "purnima", "amavasya", "ekadashi") */
    type: string;
    /** Display name (e.g., "Purnima", "Shukla Ekadashi") */
    name: string;
    /** Dutch description */
    description: string;
    /** Display emoji */
    emoji: string;
  } | null;

  // =========================================================================
  // DRIK PANCHANG EXTENDED FIELDS
  // =========================================================================

  /**
   * Maas (Lunar Month) - Amanta or Purnimanta system
   * Hindu lunar month based on new moon or full moon cycles
   * @since v1.4.0
   */
  maas?: {
    /** Sanskrit month name (e.g., "Pausha", "Magha") */
    name: string;
    /** Month system: Amanta (ends at new moon) or Purnimanta (ends at full moon) */
    type: "Amanta" | "Purnimanta";
    /** Day number within the lunar month (1-30) */
    lunarDay: number;
    /** Which half of the month: Shukla (waxing) or Krishna (waning) */
    paksha: "Shukla" | "Krishna";
  };

  /**
   * Vikrama Samvat - Hindu calendar year
   * Starts at Chaitra Shukla Pratipada (Hindu New Year)
   * Approximately Gregorian year + 57
   * @since v1.4.0
   */
  vikramaSamvat?: {
    /** Vikrama Samvat year number */
    year: number;
    /** Optional year name from 60-year cycle */
    name?: string;
  };

  /**
   * Samvatsara - 60-year cycle name
   * Used in traditional Hindu calendar systems
   * @since v1.4.0
   */
  samvatsara?: {
    /** Name from 60-year cycle (e.g., "Kalayukta", "Prabhava") */
    name: string;
    /** Position in 60-year cycle (1-60) */
    number: number;
  };

  /**
   * Shaka Samvat - National calendar of India
   * Starts at Chaitra Shukla Pratipada
   * Approximately Gregorian year - 78
   * @since v1.4.0
   */
  shakaSamvat?: {
    /** Shaka Samvat year number */
    year: number;
    /** Year name from 60-year cycle */
    name: string;
  };

  /**
   * Sun Sign (Rashi) - Sidereal zodiac position of the Sun
   * Based on Lahiri ayanamsa
   * @since v1.4.0
   */
  sunSign?: {
    /** Sign number (1-12: Mesha to Meena) */
    number: number;
    /** Sanskrit name (e.g., "Mesha", "Vrishabha") */
    name: string;
    /** Local time when Sun transitions to next sign (HH:mm:ss format) */
    uptoLocal?: string | null;
    /** UTC ISO timestamp when Sun transitions to next sign */
    uptoUtcIso?: string | null;
  };

  /**
   * Moon Sign (Rashi) - Sidereal zodiac position of the Moon
   * Based on Lahiri ayanamsa
   * @since v1.4.0
   */
  moonSign?: {
    /** Sign number (1-12: Mesha to Meena) */
    number: number;
    /** Sanskrit name (e.g., "Mesha", "Vrishabha") */
    name: string;
    /** Local time when Moon transitions to next sign (HH:mm:ss format) */
    uptoLocal?: string | null;
    /** UTC ISO timestamp when Moon transitions to next sign */
    uptoUtcIso?: string | null;
  };

  /**
   * Pravishte/Gate - Days elapsed since last Sankranti
   * Sankranti is when the Sun enters a new zodiac sign
   * @since v1.4.0
   */
  pravishte?: {
    /** Number of days since last solar ingress */
    daysSinceSankranti: number;
    /** Current solar rashi (sign) */
    currentRashi: string;
    /** Date of last Sankranti (YYYY-MM-DD format) */
    lastSankrantiDate?: string;
  };

  /**
   * Next Tithi - If current tithi ends before next sunrise
   * Provides information about the next tithi that will occur today
   * @since v1.4.0
   */
  nextTithi?: {
    /** Tithi number (1-15) */
    number: number;
    /** Sanskrit name */
    name: string;
    /** Lunar fortnight */
    paksha: "Shukla" | "Krishna";
    /** Local time when this tithi ends (HH:mm:ss format) */
    endLocal?: string | null;
    /** UTC ISO timestamp when this tithi ends */
    endUtcIso?: string | null;
  };

  /**
   * Next Nakshatra - If current nakshatra ends before next sunrise
   * @since v1.4.0
   */
  nextNakshatra?: {
    /** Nakshatra number (1-27) */
    number: number;
    /** Sanskrit name */
    name: string;
    /** Pada (quarter) within the nakshatra (1-4) */
    pada: 1 | 2 | 3 | 4;
    /** Local time when this nakshatra ends (HH:mm:ss format) */
    endLocal?: string | null;
    /** UTC ISO timestamp when this nakshatra ends */
    endUtcIso?: string | null;
  };

  /**
   * Next Yoga - If current yoga ends before next sunrise
   * @since v1.4.0
   */
  nextYoga?: {
    /** Yoga number (1-27) */
    number: number;
    /** Sanskrit name */
    name: string;
    /** Local time when this yoga ends (HH:mm:ss format) */
    endLocal?: string | null;
    /** UTC ISO timestamp when this yoga ends */
    endUtcIso?: string | null;
  };

  /**
   * Next Karana - If current karana ends before next sunrise
   * @since v1.4.0
   */
  nextKarana?: {
    /** Karana number (1-11) */
    number: number;
    /** Sanskrit name */
    name: string;
    /** Type: "Movable" or "Fixed" */
    type: string;
    /** Local time when this karana ends (HH:mm:ss format) */
    endLocal?: string | null;
    /** UTC ISO timestamp when this karana ends */
    endUtcIso?: string | null;
  };
}
