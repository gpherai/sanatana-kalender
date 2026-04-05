/**
 * Panchanga Types - Server-only
 * Type definitions for Swiss Ephemeris Panchanga calculations
 */

// =============================================================================
// BIRTH CHART TYPES
// =============================================================================

export interface BirthData {
  date: string; // YYYY-MM-DD (local calendar date)
  time: string; // HH:mm or HH:mm:ss (local time)
  lat: number; // Geographic latitude
  lon: number; // Geographic longitude
  tz: string; // IANA timezone (e.g. "Europe/Amsterdam")
  altitude?: number; // Meters above sea level (default 0)
}

export interface RashiInfo {
  number: number; // 1-12 (Mesha to Meena)
  name: string; // Sanskrit name
}

export interface NakshatraInfo {
  number: number; // 1-27
  name: string; // Sanskrit name
  pada: 1 | 2 | 3 | 4; // Quarter (each pada = 3°20')
}

export interface GrahaPosition {
  name: string; // Sanskrit name (e.g. "Surya", "Chandra")
  longitude: number; // Sidereal longitude 0-360°
  latitude: number; // Celestial latitude
  speed: number; // Degrees/day (negative = retrograde)
  retrograde: boolean;
  rashi: RashiInfo;
  degreeInRashi: number; // 0-29.999° within rashi
  nakshatra: NakshatraInfo;
}

export interface LagnaInfo {
  longitude: number; // Sidereal ascendant 0-360°
  rashi: RashiInfo;
  degreeInRashi: number; // 0-29.999°
  nakshatra: NakshatraInfo;
}

export type GrahaKey =
  | "surya"
  | "chandra"
  | "mangala"
  | "budha"
  | "guru"
  | "shukra"
  | "shani"
  | "rahu"
  | "ketu"
  | "uranus"
  | "neptune"
  | "pluto";

export interface BirthChart {
  birthData: BirthData;
  julianDay: number; // JD (UT) of birth moment
  ayanamsa: {
    name: string; // "Lahiri"
    degrees: number; // Ayanamsa value at birth JD
  };
  lagna: LagnaInfo;
  grahas: Record<GrahaKey, GrahaPosition>;
}

export interface LocationConfig {
  name: string;
  lat: number;
  lon: number;
  tz: string; // IANA timezone (e.g., "Europe/Amsterdam")
}

export interface DailyPanchangaFull {
  date: string; // YYYY-MM-DD (local)
  location: LocationConfig;

  // Sun times
  sunriseLocal: string; // HH:mm:ss
  sunsetLocal: string; // HH:mm:ss
  sunriseUtcIso: string; // ISO timestamp
  sunsetUtcIso: string; // ISO timestamp

  // Moon times
  moonriseLocal: string | null; // HH:mm:ss
  moonsetLocal: string | null; // HH:mm:ss
  moonriseUtcIso: string | null; // ISO timestamp
  moonsetUtcIso: string | null; // ISO timestamp

  // Ayanamsa
  ayanamsa: {
    id: number; // 1 = Lahiri
    name: string; // "Lahiri"
    degrees: number; // Ayanamsa value in degrees
  };

  // Vara (weekday according to sunrise)
  vara: {
    name: string; // Sanskrit weekday name
    computedAt: "sunrise";
  };

  // Tithi (lunar day)
  tithi: {
    number: number; // 1-30
    name: string; // Sanskrit name
    paksha: "Shukla" | "Krishna"; // Waxing or waning fortnight
    endUtcIso?: string; // ISO timestamp when tithi ends
    endLocal?: string; // HH:mm:ss when tithi ends
  };

  // Nakshatra (lunar mansion)
  nakshatra: {
    number: number; // 1-27
    name: string; // Sanskrit name
    pada: 1 | 2 | 3 | 4; // Quarter (1-4)
    endUtcIso?: string; // ISO timestamp when nakshatra ends
    endLocal?: string; // HH:mm:ss when nakshatra ends
  };

  // Yoga (Sun-Moon angular relationship)
  yoga: {
    number: number; // 1-27
    name: string; // Sanskrit name
    endUtcIso?: string; // ISO timestamp when yoga ends
    endLocal?: string; // HH:mm:ss when yoga ends
  };

  // Karana (half-tithi)
  karana: {
    number: number; // 1-60
    name: string; // Sanskrit name
    type: "Fixed" | "Movable";
    endUtcIso?: string; // ISO timestamp when karana ends
    endLocal?: string; // HH:mm:ss when karana ends
  };

  // Moon phase
  moon: {
    illuminationPct: number; // 0-100
    phaseAngleDeg?: number; // Phase angle in degrees
    waxing: boolean; // True if waxing, false if waning
  };

  // Inauspicious times
  rahuKalam?: {
    startLocal: string; // HH:mm
    endLocal: string; // HH:mm
  };
  yamagandam?: {
    startLocal: string; // HH:mm
    endLocal: string; // HH:mm
  };

  // =========================================================================
  // DRIK PANCHANG EXTENDED FIELDS
  // =========================================================================

  // Lunar month (Maas) - Amanta or Purnimanta system
  maas?: {
    name: string; // Sanskrit name (e.g., "Pausha", "Magha")
    type: "Amanta" | "Purnimanta"; // Month system
    lunarDay: number; // Day number within the month (1-30)
    paksha: "Shukla" | "Krishna"; // Which half of the month
    isAdhika: boolean; // Adhika (intercalary) month flag
  };

  // Exact moon phase event for this calendar day (midnight-to-midnight)
  // Calculated via Swiss Ephemeris binary search; null when no phase occurs
  moonPhaseEvent?: {
    type: "new" | "first_quarter" | "full" | "last_quarter";
    timeLocal: string; // HH:mm
    timeUtcIso: string; // ISO UTC string
  } | null;

  // Solar transition (Sankranti) - occurs when Sun enters a new zodiac sign
  sankranti?: {
    name: string; // e.g., "MAKARA_SANKRANTI", "MESHA_SANKRANTI"
    time: string; // HH:mm format - when the transition occurs
  };

  // Hindu calendar years
  vikramaSamvat?: {
    year: number; // Vikrama Samvat year (Gregorian + 57)
    name?: string; // Optional year name
  };

  samvatsara?: {
    name: string; // Name from 60-year cycle (e.g., "Kalayukta")
    number: number; // Position in 60-year cycle (1-60)
  };

  shakaSamvat?: {
    year: number; // Shaka Samvat year (Gregorian - 78)
    name: string; // Name from 60-year cycle (e.g., "Vishvavasu")
  };

  // Zodiac signs (Rashi) - Sidereal
  sunSign?: {
    number: number; // 1-12 (Mesha to Meena)
    name: string; // Sanskrit name (e.g., "Mesha", "Vrishabha")
    uptoLocal?: string; // HH:mm:ss when sun transitions to next sign
    uptoUtcIso?: string; // ISO timestamp of transition
  };

  moonSign?: {
    number: number; // 1-12 (Mesha to Meena)
    name: string; // Sanskrit name
    uptoLocal?: string; // HH:mm:ss when moon transitions to next sign
    uptoUtcIso?: string; // ISO timestamp of transition
  };

  // Pravishte/Gate - Days since last Sankranti
  pravishte?: {
    daysSinceSankranti: number; // Days since last solar ingress
    currentRashi: string; // Current solar rashi
    lastSankrantiDate?: string; // YYYY-MM-DD of last sankranti
  };

  // Multiple transitions per day (if applicable)
  // If tithi/nakshatra/yoga/karana ends before next sunrise,
  // we also include the next one
  nextTithi?: {
    number: number;
    name: string;
    paksha: "Shukla" | "Krishna";
    endUtcIso?: string;
    endLocal?: string;
  };

  nextNakshatra?: {
    number: number;
    name: string;
    pada: 1 | 2 | 3 | 4;
    endUtcIso?: string;
    endLocal?: string;
  };

  nextYoga?: {
    number: number;
    name: string;
    endUtcIso?: string;
    endLocal?: string;
  };

  nextKarana?: {
    number: number;
    name: string;
    type: "Fixed" | "Movable";
    endUtcIso?: string;
    endLocal?: string;
  };

  // Metadata
  meta: {
    engine: string; // "swisseph-core"
    flags: string[]; // ["SEFLG_SIDEREAL", "SEFLG_SWIEPH", "SE_SIDM_LAHIRI"]
    swissephVersion: string;
    ephemerisPath?: string;
  };
}
