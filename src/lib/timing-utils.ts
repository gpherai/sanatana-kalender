/**
 * Timing Utilities for Hindu Astronomical Observation Windows
 *
 * Calculates traditional puja/observation time windows from sunrise/sunset times.
 * All time strings are in "HH:MM" format (24-hour, no seconds).
 *
 * References:
 * - Nishita Kaal: midpoint of the night, calculated as the 8th muhurta of 15 night muhurtas
 * - Pradosh Kaal: the twilight window beginning ~1.5 hours before sunset
 */

import type { TimingType } from "@prisma/client";

export interface TimeWindow {
  startTime: string;
  endTime: string;
}

/**
 * Parse "HH:MM" string into total minutes since midnight.
 * Returns null if the string is invalid.
 */
export function parseTimeToMinutes(time: string): number | null {
  // Accept "HH:MM" or "HH:MM:SS" (seconds are ignored — DailyInfo stores times with seconds)
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(time);
  if (!match) return null;
  const hours = parseInt(match[1]!, 10);
  const minutes = parseInt(match[2]!, 10);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/**
 * Format total minutes since midnight to "HH:MM" string.
 * Wraps around 24-hour clock (e.g. 1500min → "01:00" next day).
 */
export function formatMinutesToTime(totalMinutes: number): string {
  const wrapped = ((totalMinutes % 1440) + 1440) % 1440; // ensure positive, wrap at 24h
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Add (or subtract with negative value) minutes to a "HH:MM" time string.
 */
export function addMinutesToTime(time: string, minutes: number): string | null {
  const base = parseTimeToMinutes(time);
  if (base === null) return null;
  return formatMinutesToTime(base + minutes);
}

/**
 * NISHITA KAAL — Midpoint of the night
 *
 * The night extends from sunset to sunrise of the following day.
 * Nishita kaal is the midpoint (8th of 15 night muhurtas), traditionally
 * the most sacred moment for midnight pujas (Janmashtami, Shivaratri, Kali Puja).
 *
 * Window: midpoint ± 24 minutes (= 1 muhurta of the night / 15)
 *
 * @param sunset - Sunset time "HH:MM" on the occurrence day
 * @param nextSunrise - Sunrise time "HH:MM" on the following day
 * @returns Time window, or null if input times are invalid
 */
export function calculateNishitaKaal(
  sunset: string,
  nextSunrise: string
): TimeWindow | null {
  const sunsetMin = parseTimeToMinutes(sunset);
  // nextSunrise is on the next calendar day, so add 1440 (24h) to get minutes past midnight
  const nextSunriseMin = parseTimeToMinutes(nextSunrise);

  if (sunsetMin === null || nextSunriseMin === null) return null;

  // Night duration in minutes (sunrise is on next day, so add 1440)
  const nightDuration = nextSunriseMin + 1440 - sunsetMin;
  const midpoint = sunsetMin + Math.round(nightDuration / 2);
  // One muhurta = nightDuration / 15 (rounded)
  const muhurta = Math.round(nightDuration / 15);

  return {
    startTime: formatMinutesToTime(midpoint - muhurta),
    endTime: formatMinutesToTime(midpoint + muhurta),
  };
}

/**
 * PRADOSH KAAL — Twilight observation window for Shiva
 *
 * Begins 1 hour 30 minutes before sunset and extends 45 minutes after sunset.
 * This is the traditional window for Pradosh Vrat puja.
 *
 * @param sunset - Sunset time "HH:MM" on the occurrence day
 * @returns Time window, or null if sunset time is invalid
 */
export function calculatePradoshKaal(sunset: string): TimeWindow | null {
  const start = addMinutesToTime(sunset, -90);
  const end = addMinutesToTime(sunset, 45);
  if (!start || !end) return null;
  return { startTime: start, endTime: end };
}

/**
 * SUNRISE — Sunrise-based observation window
 *
 * Used for dawn rituals (Ratha Saptami, Chhath morning arghya, etc.).
 * Window: sunrise to sunrise + 2 hours.
 *
 * @param sunrise - Sunrise time "HH:MM" on the occurrence day
 * @returns Time window, or null if sunrise time is invalid
 */
export function calculateSunriseWindow(sunrise: string): TimeWindow | null {
  // Format startTime through the parser to strip seconds and normalise to "HH:MM"
  const startMinutes = parseTimeToMinutes(sunrise);
  if (startMinutes === null) return null;
  const start = formatMinutesToTime(startMinutes);
  const end = addMinutesToTime(sunrise, 120);
  if (!end) return null;
  return { startTime: start, endTime: end };
}

/**
 * SUNSET — Sunset-based observation window
 *
 * Used for dusk/evening rituals.
 * Window: sunset - 30 minutes to sunset + 1 hour.
 *
 * @param sunset - Sunset time "HH:MM" on the occurrence day
 * @returns Time window, or null if sunset time is invalid
 */
export function calculateSunsetWindow(sunset: string): TimeWindow | null {
  const start = addMinutesToTime(sunset, -30);
  const end = addMinutesToTime(sunset, 60);
  if (!start || !end) return null;
  return { startTime: start, endTime: end };
}

/**
 * MADHYAHNA — Midday observation window
 *
 * The day is divided into 5 equal parts (muhurtas).
 * Madhyahna = the 3rd muhurta = from 2/5 to 3/5 of the daytime arc.
 * Used for Ganesh Chaturthi puja and other midday rituals.
 *
 * @param sunrise - Sunrise time "HH:MM" on the occurrence day
 * @param sunset - Sunset time "HH:MM" on the occurrence day
 * @returns Time window, or null if times are invalid
 */
export function calculateMadhyahna(sunrise: string, sunset: string): TimeWindow | null {
  const sunriseMin = parseTimeToMinutes(sunrise);
  const sunsetMin = parseTimeToMinutes(sunset);
  if (sunriseMin === null || sunsetMin === null) return null;
  const dayDuration = sunsetMin - sunriseMin;
  if (dayDuration <= 0) return null;
  const muhurta = dayDuration / 5;
  const start = formatMinutesToTime(sunriseMin + muhurta * 2);
  const end = formatMinutesToTime(sunriseMin + muhurta * 3);
  return { startTime: start, endTime: end };
}

/**
 * Calculate a time window for a given TimingType.
 *
 * @param timingType - The type of timing calculation to perform
 * @param sunset - Sunset time for the occurrence day ("HH:MM")
 * @param nextSunrise - Sunrise time for the following day ("HH:MM"), required for NISHITA_KAAL
 * @param sunrise - Sunrise time for the occurrence day ("HH:MM"), required for SUNRISE
 * @returns Calculated time window, or null if required data is missing/invalid
 */
export function calculateTimingWindow(
  timingType: TimingType,
  {
    sunset,
    nextSunrise,
    sunrise,
  }: { sunset?: string | null; nextSunrise?: string | null; sunrise?: string | null }
): TimeWindow | null {
  switch (timingType) {
    case "NISHITA_KAAL":
      if (!sunset || !nextSunrise) return null;
      return calculateNishitaKaal(sunset, nextSunrise);

    case "PRADOSH_KAAL":
      if (!sunset) return null;
      return calculatePradoshKaal(sunset);

    case "SUNRISE":
      if (!sunrise) return null;
      return calculateSunriseWindow(sunrise);

    case "SUNSET":
      if (!sunset) return null;
      return calculateSunsetWindow(sunset);

    case "MADHYAHNA":
      if (!sunrise || !sunset) return null;
      return calculateMadhyahna(sunrise, sunset);

    default:
      return null;
  }
}
