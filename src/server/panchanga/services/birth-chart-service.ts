import path from "path";
import { DateTime } from "luxon";
import * as swisseph from "swisseph";
import type {
  BirthData,
  BirthChart,
  GrahaPosition,
  GrahaKey,
  NakshatraInfo,
  RashiInfo,
} from "../types";
import {
  swe_calc_ut,
  swe_julday,
  getAyanamsa,
  sweHousesEx,
  sweSetTopo,
} from "../utils/astro";
import { NAKSHATRA_NAMES, RASHI_NAMES, GRAHA_DEFINITIONS } from "../constants";

const EPHE_PATH = path.join(process.cwd(), "node_modules/swisseph/ephe");

// =============================================================================
// HELPERS
// =============================================================================

const norm360 = (x: number): number => ((x % 360) + 360) % 360;

function rashiFromLon(lon: number): RashiInfo {
  const idx = Math.floor(lon / 30); // 0-11
  return { number: idx + 1, name: RASHI_NAMES[idx] ?? "Unknown" };
}

function nakshatraFromLon(lon: number): NakshatraInfo {
  // Each nakshatra = 360/27 = 13.333...°
  // Each pada = 360/108 = 3.333...°
  const nakWidth = 360 / 27;
  const padaWidth = 360 / 108;
  const idx = Math.floor(lon / nakWidth); // 0-26
  const posInNak = lon % nakWidth;
  const pada = (Math.floor(posInNak / padaWidth) + 1) as 1 | 2 | 3 | 4;
  return { number: idx + 1, name: NAKSHATRA_NAMES[idx] ?? "Unknown", pada };
}

// =============================================================================
// BIRTH CHART SERVICE
// =============================================================================

export class BirthChartService {
  constructor() {
    swisseph.swe_set_ephe_path(EPHE_PATH);
    swisseph.swe_set_sid_mode(swisseph.SE_SIDM_LAHIRI, 0, 0);
  }

  /**
   * Compute a full Jyotisha birth chart for a given birth moment and location.
   *
   * Precision notes:
   * - Lahiri (Chitrapaksha) ayanamsa
   * - Mean Node for Rahu (traditional Parashari; True Node configurable later)
   * - Topocentric correction applied to Chandra (Moon parallax up to ~57')
   * - All other grahas geocentric (parallax negligible)
   * - Whole Sign house system for lagna and bhava cusps
   */
  async compute(birth: BirthData): Promise<BirthChart> {
    const altitude = birth.altitude ?? 0;

    // -------------------------------------------------------------------------
    // Step 1: Convert local birth time to Julian Day (UT)
    // -------------------------------------------------------------------------
    // Parse the local time in the birth timezone, then convert to UTC.
    // Luxon handles DST and historical timezone offsets correctly.
    const localDt = DateTime.fromISO(`${birth.date}T${birth.time}`, {
      zone: birth.tz,
    });
    if (!localDt.isValid) {
      throw new Error(
        `Invalid birth date/time: ${birth.date}T${birth.time} in zone ${birth.tz}`
      );
    }
    const utcDt = localDt.toUTC();

    const jd = await swe_julday(
      utcDt.year,
      utcDt.month,
      utcDt.day,
      utcDt.hour + utcDt.minute / 60 + utcDt.second / 3600,
      swisseph.SE_GREG_CAL as 0 | 1
    );

    // -------------------------------------------------------------------------
    // Step 2: Ayanamsa at birth moment
    // -------------------------------------------------------------------------
    const ayanamsaDeg = await getAyanamsa(jd);

    // -------------------------------------------------------------------------
    // Step 3: Set topocentric position for Moon calculation
    // Must be called before any swe_calc_ut with SEFLG_TOPOCTR
    // -------------------------------------------------------------------------
    sweSetTopo(birth.lon, birth.lat, altitude);

    // -------------------------------------------------------------------------
    // Step 4: Calculate all Grahas
    // -------------------------------------------------------------------------
    const baseFlags =
      swisseph.SEFLG_SIDEREAL | swisseph.SEFLG_SWIEPH | swisseph.SEFLG_SPEED;

    const grahas: Record<string, GrahaPosition> = {};

    for (const def of GRAHA_DEFINITIONS) {
      // Apply topocentric correction to Chandra only (Moon parallax up to ~57')
      // All other grahas use geocentric — parallax is negligible for planets
      const flags =
        def.ipl === swisseph.SE_MOON ? baseFlags | swisseph.SEFLG_TOPOCTR : baseFlags;
      const pos = await swe_calc_ut(jd, def.ipl, flags);
      const lon = norm360(pos.longitude);

      grahas[def.key] = {
        name: def.name,
        longitude: lon,
        latitude: pos.latitude,
        speed: pos.speed,
        retrograde: pos.speed < 0,
        rashi: rashiFromLon(lon),
        degreeInRashi: lon % 30,
        nakshatra: nakshatraFromLon(lon),
      };
    }

    // Ketu: exactly opposite Rahu
    const rahu = grahas["rahu"];
    if (!rahu) throw new Error("Rahu calculation failed");
    const rahuLon = rahu.longitude;
    const ketuLon = norm360(rahuLon + 180);
    grahas["ketu"] = {
      name: "Ketu",
      longitude: ketuLon,
      latitude: -rahu.latitude, // Nodes are ecliptic-symmetric
      speed: rahu.speed, // Same angular speed as Rahu
      retrograde: true, // Nodes always retrograde (mean node)
      rashi: rashiFromLon(ketuLon),
      degreeInRashi: ketuLon % 30,
      nakshatra: nakshatraFromLon(ketuLon),
    };

    // -------------------------------------------------------------------------
    // Step 5: Lagna (Ascendant) via Whole Sign houses
    // swe_houses_ex with SEFLG_SIDEREAL applies Lahiri ayanamsa automatically
    // -------------------------------------------------------------------------
    const housesResult = sweHousesEx(jd, birth.lat, birth.lon, "W");
    const lagnaLon = housesResult.ascendant;

    return {
      birthData: birth,
      julianDay: jd,
      ayanamsa: {
        name: "Lahiri",
        degrees: ayanamsaDeg,
      },
      lagna: {
        longitude: lagnaLon,
        rashi: rashiFromLon(lagnaLon),
        degreeInRashi: lagnaLon % 30,
        nakshatra: nakshatraFromLon(lagnaLon),
      },
      grahas: grahas as Record<GrahaKey, GrahaPosition>,
    };
  }
}
