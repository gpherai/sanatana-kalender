
import { DateTime } from "luxon";
import * as swisseph from "swisseph";
import type { LocationConfig } from "../types";

// Ensure strict Lahiri setting globally for this module
swisseph.swe_set_sid_mode(swisseph.SE_SIDM_LAHIRI, 0, 0);

// =============================================================================
// PROMISIFIED SWISS EPHEMERIS WRAPPERS
// =============================================================================

// Type definitions for swisseph callback results
interface SweRiseTransResult {
  error?: string;
  transitTime?: number;
}

interface SweCalcUtResult {
  error?: string;
  longitude: number;
  latitude: number;
  distance: number;
  speed: number;
}

interface SwePhenoUtResult {
  error?: string;
  phaseAngle: number;
  phase: number; // illumination fraction (0..1)
}

const swe_julday = (
  year: number,
  month: number,
  day: number,
  hour: number,
  gregflag: number
): Promise<number> => {
  return new Promise((resolve, reject) => {
    try {
      const jd = swisseph.swe_julday(year, month, day, hour, gregflag as 0 | 1);
      resolve(jd);
    } catch (e) {
      reject(e);
    }
  });
};

const swe_rise_trans = (
  tjd_ut: number,
  ipl: number,
  starname: string,
  ephe_flag: number,
  rsmi: number,
  geolon: number,
  geolat: number,
  geoalt: number
): Promise<number> => {
  return new Promise((resolve, reject) => {
    swisseph.swe_rise_trans(
      tjd_ut,
      ipl,
      starname,
      ephe_flag,
      rsmi,
      geolon,
      geolat,
      geoalt,
      0,
      0,
      (result: SweRiseTransResult) => {
        if (result.error) {
          reject(new Error(result.error));
        } else {
          if ("transitTime" in result && result.transitTime !== undefined) {
            resolve(result.transitTime);
          } else {
            reject(new Error("No rise time found (missing transitTime)"));
          }
        }
      }
    );
  });
};

const swe_revjul = (
  jd: number,
  gregflag: number
): { year: number; month: number; day: number; hour: number } => {
  return swisseph.swe_revjul(jd, gregflag as 0 | 1);
};

export const swe_calc_ut = (
  jd: number,
  ipl: number,
  iflag: number
): Promise<{ longitude: number; latitude: number; distance: number; speed: number }> => {
  return new Promise((resolve, reject) => {
    swisseph.swe_calc_ut(jd, ipl, iflag, (result: SweCalcUtResult) => {
      if (result.error) reject(new Error(result.error));
      else resolve(result);
    });
  });
};

export const swe_pheno_ut = (
  jd: number,
  ipl: number,
  flags: number
): Promise<{ phaseAngle: number; phaseIllum: number }> => {
  return new Promise((resolve, reject) => {
    swisseph.swe_pheno_ut(jd, ipl, flags, (res: SwePhenoUtResult) => {
      if (res.error) reject(new Error(res.error));
      // swisseph returns 'phase' for illumination fraction (0..1)
      else resolve({ phaseAngle: res.phaseAngle, phaseIllum: res.phase });
    });
  });
};

// =============================================================================
// EVENT FINDER (BRACKET + BINARY SEARCH)
// =============================================================================

/**
 * Robust Event Finder using Bracket + Binary Search algorithm
 * Finds the Julian Day where a cyclic value crosses the target value
 *
 * @param startJD - Starting Julian Day
 * @param getVal - Function to get value at a given Julian Day
 * @param targetVal - Target value to find crossing for
 * @param wrapAt - Wrap point for cyclic values (e.g., 30 for tithis, 360 for degrees)
 * @returns Julian Day of crossing, or null if not found within search window
 */
/**
 * Find when a cyclic value (tithi/nakshatra/yoga) reaches a target
 *
 * NOTE: Has wrap-handling logic but not fully wrap-safe for all edge cases
 * (per Codex/ChatGPT feedback). Works well for most scenarios.
 * Also has limited search window (1.5 days) - insufficient for long events
 * like sun sign changes (~30 days).
 */
export async function findEventEnd(
  startJD: number,
  getVal: (jd: number) => Promise<number>,
  targetVal: number,
  wrapAt: number
): Promise<number | null> {
  // 1. Bracket the crossing
  let t1 = startJD;
  let t2 = startJD + 0.05; // Start with ~1.2 hours step
  const maxScanDays = 1.5; // Look ahead max 36 hours
  let foundBracket = false;

  let v1 = await getVal(t1);

  // Scan forward to find the bracket [t1, t2] containing the target
  for (let i = 0; i < maxScanDays / 0.05 + 2; i++) {
    const v2 = await getVal(t2);

    // Unwrapped check: normalize to handle wrap point
    // e.g. v1=29.9, target=0.0, wrap=30 → val2Unwrapped should be 30.1 if v2 is 0.1
    let val2Unwrapped = v2;
    if (v2 < v1) val2Unwrapped += wrapAt;

    let targetUnwrapped = targetVal;
    if (targetVal < v1) targetUnwrapped += wrapAt;

    // Check if we passed the target
    if (v1 <= targetUnwrapped && val2Unwrapped >= targetUnwrapped) {
      foundBracket = true;
      break;
    }

    t1 = t2;
    v1 = v2;
    t2 += 0.05;
  }

  if (!foundBracket) {
    // Event does not end within scan range
    return null;
  }

  // 2. Binary search for precision (20 iterations → ~second-level accuracy)
  for (let i = 0; i < 20; i++) {
    const mid = (t1 + t2) / 2;
    const vMid = await getVal(mid);

    const vMidNorm = vMid < v1 ? vMid + wrapAt : vMid;
    const targetNorm = targetVal < v1 ? targetVal + wrapAt : targetVal;

    if (vMidNorm < targetNorm) {
      t1 = mid;
    } else {
      t2 = mid;
    }
  }

  return t2;
}

// =============================================================================
// SUNRISE / SUNSET CALCULATION
// =============================================================================

export type AstroResult = {
  sunriseJD: number;
  sunsetJD: number;
  sunriseTime: DateTime; // Local time
  sunsetTime: DateTime; // Local time
};

/**
 * Calculate sunrise and sunset for a given date and location
 *
 * @param dateStr - Date in YYYY-MM-DD format
 * @param loc - Location configuration with timezone
 * @returns Sunrise/sunset times in both JD and local DateTime
 */
export async function calculateSunriseSunset(
  dateStr: string,
  loc: LocationConfig
): Promise<AstroResult> {
  // Parse date string in the location's timezone (NOT UTC!)
  // This ensures we're calculating for the correct calendar day
  const localStart = DateTime.fromISO(`${dateStr}T00:00:00`, { zone: loc.tz });
  const localStartUTC = localStart.toUTC();

  const jdStart = await swe_julday(
    localStartUTC.year,
    localStartUTC.month,
    localStartUTC.day,
    localStartUTC.hour + localStartUTC.minute / 60 + localStartUTC.second / 3600,
    swisseph.SE_GREG_CAL as 0 | 1
  );

  const EPHE_FLAG = swisseph.SEFLG_MOSEPH;

  const riseTimeJD = await swe_rise_trans(
    jdStart,
    swisseph.SE_SUN,
    "",
    EPHE_FLAG,
    swisseph.SE_CALC_RISE | swisseph.SE_BIT_DISC_CENTER,
    loc.lon,
    loc.lat,
    0
  );

  const setTimeJD = await swe_rise_trans(
    jdStart,
    swisseph.SE_SUN,
    "",
    EPHE_FLAG,
    swisseph.SE_CALC_SET | swisseph.SE_BIT_DISC_CENTER,
    loc.lon,
    loc.lat,
    0
  );

  const jdToDateTime = (jd: number): DateTime => {
    const dateUTC = swe_revjul(jd, swisseph.SE_GREG_CAL as 0 | 1);
    const h = Math.floor(dateUTC.hour);
    const remainder = (dateUTC.hour - h) * 60;
    const m = Math.floor(remainder);
    const s = Math.floor((remainder - m) * 60);

    return DateTime.utc(dateUTC.year, dateUTC.month, dateUTC.day, h, m, s).setZone(loc.tz);
  };

  return {
    sunriseJD: riseTimeJD,
    sunsetJD: setTimeJD,
    sunriseTime: jdToDateTime(riseTimeJD),
    sunsetTime: jdToDateTime(setTimeJD),
  };
}

// =============================================================================
// MOONRISE / MOONSET CALCULATION
// =============================================================================

export type MoonRiseSetResult = {
  moonriseJD: number;
  moonsetJD: number;
  moonriseTime: DateTime; // Local time
  moonsetTime: DateTime; // Local time
};

/**
 * Calculate moonrise and moonset for a given date and location
 *
 * @param dateStr - Date in YYYY-MM-DD format
 * @param loc - Location configuration with timezone
 * @returns Moonrise/moonset times in both JD and local DateTime
 */
export async function calculateMoonriseMoonset(
  dateStr: string,
  loc: LocationConfig
): Promise<MoonRiseSetResult> {
  // Parse date string in the location's timezone (NOT UTC!)
  const localStart = DateTime.fromISO(`${dateStr}T00:00:00`, { zone: loc.tz });
  const localStartUTC = localStart.toUTC();

  const jdStart = await swe_julday(
    localStartUTC.year,
    localStartUTC.month,
    localStartUTC.day,
    localStartUTC.hour + localStartUTC.minute / 60 + localStartUTC.second / 3600,
    swisseph.SE_GREG_CAL as 0 | 1
  );

  const EPHE_FLAG = swisseph.SEFLG_MOSEPH;

  const riseTimeJD = await swe_rise_trans(
    jdStart,
    swisseph.SE_MOON, // Moon instead of Sun
    "",
    EPHE_FLAG,
    swisseph.SE_CALC_RISE | swisseph.SE_BIT_DISC_CENTER,
    loc.lon,
    loc.lat,
    0
  );

  const setTimeJD = await swe_rise_trans(
    jdStart,
    swisseph.SE_MOON, // Moon instead of Sun
    "",
    EPHE_FLAG,
    swisseph.SE_CALC_SET | swisseph.SE_BIT_DISC_CENTER,
    loc.lon,
    loc.lat,
    0
  );

  const jdToDateTime = (jd: number): DateTime => {
    const dateUTC = swe_revjul(jd, swisseph.SE_GREG_CAL as 0 | 1);
    const h = Math.floor(dateUTC.hour);
    const remainder = (dateUTC.hour - h) * 60;
    const m = Math.floor(remainder);
    const s = Math.floor((remainder - m) * 60);

    return DateTime.utc(dateUTC.year, dateUTC.month, dateUTC.day, h, m, s).setZone(loc.tz);
  };

  return {
    moonriseJD: riseTimeJD,
    moonsetJD: setTimeJD,
    moonriseTime: jdToDateTime(riseTimeJD),
    moonsetTime: jdToDateTime(setTimeJD),
  };
}

// =============================================================================
// AYANAMSA
// =============================================================================

/**
 * Get Lahiri ayanamsa for a given Julian Day
 */
export const getAyanamsa = (jd: number): Promise<number> => {
  return new Promise((resolve) => {
    swisseph.swe_get_ayanamsa_ut(jd, (result: number) => {
      resolve(result);
    });
  });
};
