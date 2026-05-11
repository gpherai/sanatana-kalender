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
  withSwissEphLock,
  EPHE_PATH,
} from "../utils/astro";
import {
  NAKSHATRA_NAMES,
  RASHI_NAMES,
  GRAHA_DEFINITIONS,
  TITHI_NAMES,
  YOGA_NAMES,
  VARA_NAMES,
  resolveKaranaName,
} from "../constants";

// =============================================================================
// HELPERS
// =============================================================================

const norm360 = (x: number): number => ((x % 360) + 360) % 360;

function rashiFromLon(lon: number): RashiInfo {
  const normalized = norm360(lon);
  const idx = Math.floor(normalized / 30); // 0-11
  return { number: idx + 1, name: RASHI_NAMES[idx] ?? "Unknown" };
}

function nakshatraFromLon(lon: number): NakshatraInfo {
  const normalized = norm360(lon);
  // Each nakshatra = 360/27 = 13.333...°
  // Each pada = 360/108 = 3.333...°
  const nakWidth = 360 / 27;
  const padaWidth = 360 / 108;
  const idx = Math.floor(normalized / nakWidth); // 0-26
  const posInNak = normalized % nakWidth;
  const pada = (Math.floor(posInNak / padaWidth) + 1) as 1 | 2 | 3 | 4;
  return { number: idx + 1, name: NAKSHATRA_NAMES[idx] ?? "Unknown", pada };
}

type SwissEphPosition = Awaited<ReturnType<typeof swe_calc_ut>>;

function grahaPosition(name: string, pos: SwissEphPosition): GrahaPosition {
  const lon = norm360(pos.longitude);
  return {
    name,
    longitude: lon,
    latitude: pos.latitude,
    speed: pos.speed,
    retrograde: pos.speed < 0,
    rashi: rashiFromLon(lon),
    degreeInRashi: lon % 30,
    nakshatra: nakshatraFromLon(lon),
  };
}

function parseBirthDateTime(birth: BirthData): DateTime {
  const localDt = DateTime.fromISO(`${birth.date}T${birth.time}`, {
    zone: birth.tz,
  });
  if (!localDt.isValid) {
    throw new BirthChartInputError(
      `Invalid birth date/time: ${birth.date}T${birth.time} in zone ${birth.tz}`
    );
  }

  const expectedLocal = `${birth.date}T${
    birth.time.length === 5 ? `${birth.time}:00` : birth.time
  }`;
  const actualLocal = `${localDt.toISODate()}T${localDt.toFormat("HH:mm:ss")}`;
  if (actualLocal !== expectedLocal) {
    throw new BirthChartInputError(
      `Invalid birth date/time: ${birth.date}T${birth.time} does not exist in zone ${birth.tz}`
    );
  }

  const possibleOffsets = localDt.getPossibleOffsets();
  if (possibleOffsets.length > 1) {
    throw new BirthChartInputError(
      `Ambigue geboortetijd: ${birth.date} ${birth.time} komt meerdere keren voor in ${birth.tz} door zomer-/wintertijd. Gebruik een niet-ambigue lokale tijd of geef de equivalente UTC-tijd met tz UTC door.`
    );
  }

  return localDt;
}

// =============================================================================
// BIRTH CHART SERVICE
// =============================================================================

export class BirthChartInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BirthChartInputError";
  }
}

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
    // Ambiguous/non-existent DST wall-clock times are rejected instead of guessed.
    const localDt = parseBirthDateTime(birth);
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
    // Step 3: Calculate all Grahas
    // -------------------------------------------------------------------------
    const baseFlags =
      swisseph.SEFLG_SIDEREAL | swisseph.SEFLG_SWIEPH | swisseph.SEFLG_SPEED;

    const grahas: Record<string, GrahaPosition> = {};

    const chandraDef = GRAHA_DEFINITIONS.find((def) => def.ipl === swisseph.SE_MOON);
    if (!chandraDef) throw new Error("Chandra definition missing");

    // Topocentric coordinates are global Swiss Ephemeris state. Keep set_topo and
    // the Moon calculation inside one serialized block.
    const chandraPos = await withSwissEphLock(() => {
      sweSetTopo(birth.lon, birth.lat, altitude);
      return swe_calc_ut(jd, chandraDef.ipl, baseFlags | swisseph.SEFLG_TOPOCTR);
    });
    grahas[chandraDef.key] = grahaPosition(chandraDef.name, chandraPos);

    for (const def of GRAHA_DEFINITIONS) {
      // Chandra is calculated separately with topocentric correction.
      // All other grahas use geocentric positions.
      if (def.ipl === swisseph.SE_MOON) continue;
      const pos = await swe_calc_ut(jd, def.ipl, baseFlags);
      grahas[def.key] = grahaPosition(def.name, pos);
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
    // Step 4: Lagna (Ascendant) via Whole Sign houses
    // swe_houses_ex with SEFLG_SIDEREAL applies Lahiri ayanamsa automatically
    // -------------------------------------------------------------------------
    const housesResult = sweHousesEx(jd, birth.lat, birth.lon, "W");
    const lagnaLon = housesResult.ascendant;

    // -------------------------------------------------------------------------
    // Step 5: Panchanga at birth moment (derived from already-computed positions)
    // -------------------------------------------------------------------------
    const sLon = grahas["surya"]!.longitude;
    const mLon = grahas["chandra"]!.longitude;

    const tithiProg = norm360(mLon - sLon) / 12; // 0.0–29.999
    const tithiIdx = Math.floor(tithiProg) + 1; // 1–30
    const paksha: "Shukla" | "Krishna" = tithiIdx <= 15 ? "Shukla" : "Krishna";

    const yogaProg = norm360(sLon + mLon) / (360 / 27); // 0.0–26.999
    const yogaIdx = Math.floor(yogaProg) + 1; // 1–27

    // 60 half-tithis per lunar month:
    const karanaProg = tithiProg * 2; // 0.0–59.998
    const karanaIdx = Math.floor(karanaProg) + 1; // 1–60

    // Vara: weekday of birth local date (Luxon weekday 1=Mon–7=Sun → 0=Sun…6=Sat)
    const varaIdx = localDt.weekday % 7;

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
      janmaPanchanga: {
        tithi: { number: tithiIdx, name: TITHI_NAMES[tithiIdx - 1]!, paksha },
        nakshatra: grahas["chandra"]!.nakshatra,
        yoga: { number: yogaIdx, name: YOGA_NAMES[yogaIdx - 1]! },
        karana: { number: karanaIdx, name: resolveKaranaName(karanaIdx) },
        vara: { name: VARA_NAMES[varaIdx]! },
      },
    };
  }
}
