/**
 * API Response Types
 * Type definitions for API endpoint responses
 */

/**
 * Scalar fields shared by all /api/daily-info responses.
 * DailyInfoResponse extends this and adds all structured Panchanga objects
 * (tithi, nakshatra, yoga, karana, etc.) on top.
 */
export interface DailyInfoData {
  date: string; // YYYY-MM-DD
  locationName: string;
  locationLat: number;
  locationLon: number;
  sunrise: string | null; // HH:mm
  sunset: string | null;
  moonrise: string | null;
  moonset: string | null;
  moonriseUtcIso: string | null;
  moonsetUtcIso: string | null;
  moonPhasePercent: number;
  moonPhaseType: string | null;
  isWaxing: boolean;
}

/**
 * API response shape for /api/daily-info endpoint
 *
 * Extends DailyInfoData with all structured Panchanga fields from Swiss Ephemeris.
 * Adds tithi, nakshatra, yoga, karana, vara, moonPhaseEmoji/Name, rahuKalam and more.
 *
 * @see src/lib/api-transformers.ts for the transformation logic
 * @see src/app/api/daily-info/route.ts for the route handler
 */
export interface DailyInfoResponse extends Omit<DailyInfoData, "date" | "moonPhaseType"> {
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
   * Always present in transformer output.
   */
  vara: {
    /** Sanskrit name (e.g., "Ravivara" for Sunday) */
    name: string;
  };

  /**
   * Tithi (lunar day, 1-15 in each paksha)
   * The moon's angular distance from the sun in 12° increments
   * Always present in transformer output.
   */
  tithi: {
    /** Tithi number (1-15) */
    number: number;
    /** Sanskrit name (e.g., "Pratipada", "Purnima") */
    name: string;
    /** Lunar fortnight: Shukla (waxing) or Krishna (waning) */
    paksha: "Shukla" | "Krishna";
    /** Local time when this tithi ends (HH:mm format) */
    endTime: string | null;
    endUtcIso?: string | null;
  };

  /**
   * Nakshatra (lunar mansion, 1 of 27)
   * The moon's position in one of 27 asterisms along the ecliptic
   * Always present in transformer output.
   */
  nakshatra: {
    /** Nakshatra number (1-27) */
    number: number;
    /** Sanskrit name (e.g., "Ashwini", "Bharani") */
    name: string;
    /** Pada (quarter) within the nakshatra (1-4) */
    pada: 1 | 2 | 3 | 4;
    /** Local time when this nakshatra ends (HH:mm format) */
    endTime: string | null;
    endUtcIso?: string | null;
  };

  /**
   * Yoga (auspicious/inauspicious combination, 1 of 27)
   * Sum of sun and moon's longitudes divided into 27 parts
   * Always present in transformer output.
   */
  yoga: {
    /** Yoga number (1-27) */
    number: number;
    /** Sanskrit name (e.g., "Vishkambha", "Siddha") */
    name: string;
    /** Local time when this yoga ends (HH:mm format) */
    endTime: string | null;
    endUtcIso?: string | null;
  };

  /**
   * Karana (half-tithi, 1 of 11)
   * Half of a tithi; used for determining auspicious timings
   * Always present in transformer output.
   */
  karana: {
    /** Karana number (1-11) */
    number: number;
    /** Sanskrit name (e.g., "Bava", "Balava") */
    name: string;
    /** Type: "Movable" or "Fixed" */
    type: string;
    /** Local time when this karana ends (HH:mm format) */
    endTime: string | null;
    endUtcIso?: string | null;
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
  } | null;

  /**
   * Yamagandam (inauspicious time period)
   * Returned as null when unavailable.
   */
  yamagandam?: {
    /** Start time in HH:mm format */
    start: string;
    /** End time in HH:mm format */
    end: string;
  } | null;

  /**
   * Gulika Kalam / Mandi (inauspicious time period ruled by Saturn's son)
   * Octet-based, like Rahu Kalam and Yamagandam.
   */
  gulikaKalam?: {
    /** Start time in HH:mm format */
    start: string;
    /** End time in HH:mm format */
    end: string;
  } | null;

  /**
   * Abhijit Muhurta (auspicious midday window)
   * 8th of 15 day-muhurtas; generally auspicious for all undertakings.
   */
  abhijitMuhurta?: {
    /** Start time in HH:mm format */
    start: string;
    /** End time in HH:mm format */
    end: string;
  } | null;

  /**
   * Vijay Muhurta (auspicious afternoon window)
   * 11th of 15 day-muhurtas; associated with victory and success.
   */
  vijayMuhurta?: {
    /** Start time in HH:mm format */
    start: string;
    /** End time in HH:mm format */
    end: string;
  } | null;

  /**
   * Brahma Muhurta (sacred pre-dawn window)
   * 14th of 15 night-muhurtas; ideal for meditation and sadhana.
   */
  brahmaMuhurta?: {
    /** Start time in HH:mm format (pre-dawn, before sunrise) */
    start: string;
    /** End time in HH:mm format */
    end: string;
  } | null;

  /**
   * Exact moon phase event occurring on this calendar day (if any).
   * Calculated using Swiss Ephemeris binary search; null when no phase occurs.
   */
  moonPhaseEvent?: {
    /** Phase type */
    type: "new" | "first_quarter" | "full" | "last_quarter";
    /** Local time when the exact phase occurs (HH:mm) */
    timeLocal: string;
    /** UTC ISO timestamp of the exact phase */
    timeUtcIso: string;
  } | null;

  /**
   * Special day metadata (server-calculated)
   * Detects significant lunar days based on tithi and paksha
   * Replaces client-side detectSpecialDay() calls
   * @since v1.3.0
   */
  specialDay: {
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

  /** Response metadata for calculation/debugging. */
  meta?: {
    engine: string;
    generatedAt: string;
  };
}
