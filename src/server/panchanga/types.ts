
/**
 * Panchanga Types - Server-only
 * Type definitions for Swiss Ephemeris Panchanga calculations
 */

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
  moonriseLocal: string; // HH:mm:ss
  moonsetLocal: string; // HH:mm:ss
  moonriseUtcIso: string; // ISO timestamp
  moonsetUtcIso: string; // ISO timestamp

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
    flags: string[]; // ["SEFLG_SIDEREAL", "SEFLG_MOSEPH", "SE_SIDM_LAHIRI"]
    swissephVersion: string;
    ephemerisPath?: string;
  };
}
