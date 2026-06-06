import "server-only";
import path from "path";
import { DateTime } from "luxon";
import * as swisseph from "swisseph";
import type { LocationConfig } from "../types";

// Resolve bundled Swiss Ephemeris data files from the swisseph package
export const EPHE_PATH = path.join(process.cwd(), "node_modules/swisseph/ephe");

// =============================================================================
// PROMISIFIED SWISS EPHEMERIS WRAPPERS
// =============================================================================

// Swiss Ephemeris keeps some calculation settings (notably topocentric
// coordinates) in process-global state. Serialize stateful sections so concurrent
// requests cannot observe each other's temporary settings.
let swissEphQueue: Promise<void> = Promise.resolve();

export async function withSwissEphLock<T>(fn: () => Promise<T> | T): Promise<T> {
  const run = swissEphQueue.then(fn, fn);
  swissEphQueue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

// Type definitions for swisseph callback results
interface SweRiseTransResult {
  error?: string | any; // eslint-disable-line @typescript-eslint/no-explicit-any
  transitTime?: number;
}

export const swe_julday = (
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

function jdToDateTime(jd: number, tz: string): DateTime {
  const dateUTC = swe_revjul(jd, swisseph.SE_GREG_CAL as 0 | 1);
  const h = Math.floor(dateUTC.hour);
  const remainder = (dateUTC.hour - h) * 60;
  const m = Math.floor(remainder);
  const s = Math.floor((remainder - m) * 60);
  return DateTime.utc(dateUTC.year, dateUTC.month, dateUTC.day, h, m, s).setZone(tz);
}

export const swe_calc_ut = (
  jd: number,
  ipl: number,
  iflag: number
): Promise<{ longitude: number; latitude: number; distance: number; speed: number }> => {
  return new Promise((resolve, reject) => {
    swisseph.swe_calc_ut(
      jd,
      ipl,
      iflag,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (result: any) => {
        if (result.error) reject(new Error(String(result.error)));
        else {
          resolve({
            longitude: result.longitude,
            latitude: result.latitude,
            distance: result.distance,
            speed: result.longitudeSpeed || 0,
          });
        }
      }
    );
  });
};

export const swe_pheno_ut = (
  jd: number,
  ipl: number,
  flags: number
): Promise<{ phaseAngle: number; phaseIllum: number }> => {
  return new Promise((resolve, reject) => {
    swisseph.swe_pheno_ut(
      jd,
      ipl,
      flags,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (res: any) => {
        if (res.error) reject(new Error(String(res.error)));
        // swisseph returns 'phase' for illumination fraction (0..1)
        else resolve({ phaseAngle: res.phaseAngle, phaseIllum: res.phase });
      }
    );
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
 * Find when a cyclic value (tithi/nakshatra/yoga/sun-sign) reaches a target.
 * maxScanDays controls the search window: 1.5 days (default) for lunar events,
 * 35 for Sankranti (sun stays in one sign ~30 days), 3 for moon sign changes.
 */
export async function findEventEnd(
  startJD: number,
  getVal: (jd: number) => Promise<number>,
  targetVal: number,
  wrapAt: number,
  maxScanDays = 1.5
): Promise<number | null> {
  // 1. Bracket the crossing
  let t1 = startJD;
  let t2 = startJD + 0.05; // Start with ~1.2 hours step
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

  const EPHE_FLAG = swisseph.SEFLG_SWIEPH;

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

  return {
    sunriseJD: riseTimeJD,
    sunsetJD: setTimeJD,
    sunriseTime: jdToDateTime(riseTimeJD, loc.tz),
    sunsetTime: jdToDateTime(setTimeJD, loc.tz),
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
  loc: LocationConfig,
  upcomingFromNow = false
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

  const EPHE_FLAG = swisseph.SEFLG_SWIEPH;

  let riseTimeJD = await swe_rise_trans(
    jdStart,
    swisseph.SE_MOON, // Moon instead of Sun
    "",
    EPHE_FLAG,
    swisseph.SE_CALC_RISE | swisseph.SE_BIT_DISC_CENTER,
    loc.lon,
    loc.lat,
    0
  );

  // Calculate moonset starting from moonrise, so the set always follows the rise.
  // Without this, moonset could be earlier in the day (from the previous night's rise).
  let setTimeJD = await swe_rise_trans(
    riseTimeJD,
    swisseph.SE_MOON, // Moon instead of Sun
    "",
    EPHE_FLAG,
    swisseph.SE_CALC_SET | swisseph.SE_BIT_DISC_CENTER,
    loc.lon,
    loc.lat,
    0
  );

  // When upcomingFromNow is true (today's view), check if the computed moonset is
  // already in the past. If so, recalculate from the current moment so the user
  // always sees the next upcoming rise and set, not one from earlier today.
  if (upcomingFromNow) {
    const nowUTC = DateTime.utc();
    const jdNow = await swe_julday(
      nowUTC.year,
      nowUTC.month,
      nowUTC.day,
      nowUTC.hour + nowUTC.minute / 60 + nowUTC.second / 3600,
      swisseph.SE_GREG_CAL as 0 | 1
    );

    if (setTimeJD < jdNow) {
      riseTimeJD = await swe_rise_trans(
        jdNow,
        swisseph.SE_MOON,
        "",
        EPHE_FLAG,
        swisseph.SE_CALC_RISE | swisseph.SE_BIT_DISC_CENTER,
        loc.lon,
        loc.lat,
        0
      );
      setTimeJD = await swe_rise_trans(
        riseTimeJD,
        swisseph.SE_MOON,
        "",
        EPHE_FLAG,
        swisseph.SE_CALC_SET | swisseph.SE_BIT_DISC_CENTER,
        loc.lon,
        loc.lat,
        0
      );
    }
  }

  return {
    moonriseJD: riseTimeJD,
    moonsetJD: setTimeJD,
    moonriseTime: jdToDateTime(riseTimeJD, loc.tz),
    moonsetTime: jdToDateTime(setTimeJD, loc.tz),
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

// =============================================================================
// TOPOCENTRIC SETUP
// =============================================================================

/**
 * Set geographic position for topocentric calculations.
 * Must be called before swe_calc_ut with SEFLG_TOPOCTR.
 * Affects Moon position by up to ~57 arcminutes.
 */
export const sweSetTopo = (lon: number, lat: number, altMeters = 0): void => {
  swisseph.swe_set_topo(lon, lat, altMeters);
};

// =============================================================================
// HOUSE CALCULATIONS
// =============================================================================

export interface HousesResult {
  ascendant: number; // Sidereal ascendant in degrees (0-360)
  mc: number; // Midheaven
  houses: number[]; // 12 house cusps [0..11]
}

/**
 * Calculate house cusps and ascendant using sidereal Lahiri ayanamsa.
 * Uses swe_houses_ex which applies the ayanamsa automatically when
 * SEFLG_SIDEREAL is passed.
 *
 * @param jd        Julian Day (UT)
 * @param geolat    Geographic latitude
 * @param geolon    Geographic longitude
 * @param hsys      House system: 'W' = Whole Sign (default, traditional Jyotisha)
 */
export const sweHousesEx = (
  jd: number,
  geolat: number,
  geolon: number,
  hsys: string = "W"
): HousesResult => {
  const result = swisseph.swe_houses_ex(
    jd,
    swisseph.SEFLG_SIDEREAL,
    geolat,
    geolon,
    hsys
  );
  if ("error" in result) throw new Error(`swe_houses_ex: ${result.error}`);
  return {
    ascendant: ((result.ascendant % 360) + 360) % 360,
    mc: ((result.mc % 360) + 360) % 360,
    houses: result.house,
  };
};
