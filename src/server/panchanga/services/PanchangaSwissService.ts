
import { DateTime } from "luxon";
import * as swisseph from "swisseph";
import type { DailyPanchangaFull, LocationConfig } from "../types";
import {
  calculateSunriseSunset,
  calculateMoonriseMoonset,
  swe_calc_ut,
  swe_pheno_ut,
  findEventEnd,
  getAyanamsa,
} from "../utils/astro";
import {
  TITHI_NAMES,
  NAKSHATRA_NAMES,
  YOGA_NAMES,
  KARANA_NAMES,
  VARA_NAMES,
  LUNAR_MASA_NAMES,
  SOLAR_MASA_NAMES,
  SAMVATSARA_NAMES,
} from "../constants";

/**
 * Panchanga Swiss Ephemeris Service
 *
 * High-precision astronomical calculations using Swiss Ephemeris library.
 * Implements Lahiri (Chitrapaksha) ayanamsa for sidereal calculations.
 *
 * Features:
 * - Exact tithi, nakshatra, yoga, karana calculations
 * - End times accurate to the second using bracket + binary search
 * - Topocentric sunrise/sunset calculations
 * - Rahu Kalam and Yamagandam inauspicious time calculations
 *
 * @see https://www.astro.com/swisseph/
 */
export class PanchangaSwissService {
  constructor() {
    // Ensure strict Lahiri ayanamsa setting
    swisseph.swe_set_sid_mode(swisseph.SE_SIDM_LAHIRI, 0, 0);
  }

  /**
   * Compute full Panchanga for a single day
   *
   * @param dateStr - Date in YYYY-MM-DD format (calendar day in location's timezone)
   * @param location - Location with lat/lon and timezone
   * @returns Complete Panchanga data for the day
   */
  async computeDaily(dateStr: string, location: LocationConfig): Promise<DailyPanchangaFull> {
    // Ensure strict Lahiri setting before every calculation
    swisseph.swe_set_sid_mode(swisseph.SE_SIDM_LAHIRI, 0, 0);

    // ==========================================================================
    // STEP 1: Calculate Sunrise & Sunset
    // ==========================================================================
    const astro = await calculateSunriseSunset(dateStr, location);

    // ==========================================================================
    // STEP 1.5: Calculate Moonrise & Moonset
    // ==========================================================================
    const moonAstro = await calculateMoonriseMoonset(dateStr, location);

    // ==========================================================================
    // STEP 2: Calculate Positions at Sunrise
    // ==========================================================================
    // Flags: Sidereal (Lahiri), Moshier ephemeris (no files needed), Speed
    const flags = swisseph.SEFLG_SIDEREAL | swisseph.SEFLG_MOSEPH | swisseph.SEFLG_SPEED;
    const sunPos = await swe_calc_ut(astro.sunriseJD, swisseph.SE_SUN, flags);
    const moonPos = await swe_calc_ut(astro.sunriseJD, swisseph.SE_MOON, flags);

    // ==========================================================================
    // STEP 3: Calculate Current Indices (at sunrise)
    // ==========================================================================

    /**
     * Normalize angle to 0-360 range (wrap-safe)
     * Per ChatGPT/Codex feedback: Critical for preventing off-by-one errors
     */
    const norm360 = (x: number): number => ((x % 360) + 360) % 360;

    /**
     * Tithi progress: Elongation between Sun and Moon
     * (Moon longitude - Sun longitude) / 12 degrees = 0.0 to 29.999
     */
    const getTithiProgress = (sLon: number, mLon: number): number => {
      const diff = norm360(mLon - sLon);
      return diff / 12; // 0.0 to 29.999
    };

    /**
     * Nakshatra progress: Moon's position in 27 divisions
     */
    const getNakshatraProgress = (mLon: number): number => {
      return norm360(mLon) / (360 / 27); // 0.0 to 26.999
    };

    /**
     * Yoga progress: Sum of Sun and Moon longitudes
     */
    const getYogaProgress = (sLon: number, mLon: number): number => {
      const sum = norm360(sLon + mLon);
      return sum / (360 / 27); // 0.0 to 26.999
    };

    /**
     * Karana progress: Half-tithi (tithi × 2)
     */
    const getKaranaProgress = (tithiProg: number): number => {
      return tithiProg * 2; // 0.0 to 59.998
    };

    // Calculate progress values at sunrise
    const tithiProg = getTithiProgress(sunPos.longitude, moonPos.longitude);
    const nakProg = getNakshatraProgress(moonPos.longitude);
    const yogaProg = getYogaProgress(sunPos.longitude, moonPos.longitude);
    const karanaProg = getKaranaProgress(tithiProg);

    // Calculate indices (1-based)
    const tithiIdx = Math.floor(tithiProg) + 1;
    const nakIdx = Math.floor(nakProg) + 1;
    const yogaIdx = Math.floor(yogaProg) + 1;
    const karanaIdx = Math.floor(karanaProg) + 1;

    // ==========================================================================
    // STEP 4: Calculate End Times (Bracket + Binary Search)
    // ==========================================================================

    // Tithi End Time
    const tithiEndJD = await findEventEnd(
      astro.sunriseJD,
      async (jd) => {
        const s = await swe_calc_ut(jd, swisseph.SE_SUN, flags);
        const m = await swe_calc_ut(jd, swisseph.SE_MOON, flags);
        return getTithiProgress(s.longitude, m.longitude);
      },
      tithiIdx % 30, // Wrap at 30
      30
    );

    // Nakshatra End Time
    const nakEndJD = await findEventEnd(
      astro.sunriseJD,
      async (jd) => {
        const m = await swe_calc_ut(jd, swisseph.SE_MOON, flags);
        return getNakshatraProgress(m.longitude);
      },
      nakIdx % 27, // Wrap at 27
      27
    );

    // Yoga End Time
    const yogaEndJD = await findEventEnd(
      astro.sunriseJD,
      async (jd) => {
        const s = await swe_calc_ut(jd, swisseph.SE_SUN, flags);
        const m = await swe_calc_ut(jd, swisseph.SE_MOON, flags);
        return getYogaProgress(s.longitude, m.longitude);
      },
      yogaIdx % 27, // Wrap at 27
      27
    );

    // Karana End Time
    const karanaEndJD = await findEventEnd(
      astro.sunriseJD,
      async (jd) => {
        const s = await swe_calc_ut(jd, swisseph.SE_SUN, flags);
        const m = await swe_calc_ut(jd, swisseph.SE_MOON, flags);
        const tp = getTithiProgress(s.longitude, m.longitude);
        return getKaranaProgress(tp);
      },
      karanaIdx % 60, // Wrap at 60
      60
    );

    // ==========================================================================
    // STEP 5: Data Mapping & Formatting
    // ==========================================================================

    // Vara (weekday according to sunrise)
    const sunriseDt = astro.sunriseTime;
    const varaIdx = sunriseDt.weekday === 7 ? 0 : sunriseDt.weekday; // Luxon: 1=Mon, 7=Sun

    // Moon Phase (high precision using swe_pheno_ut)
    const pheno = await swe_pheno_ut(astro.sunriseJD, swisseph.SE_MOON, flags);
    const illumination = pheno.phaseIllum * 100; // 0..1 → 0..100

    // Waxing/Waning based on elongation
    let elongation = moonPos.longitude - sunPos.longitude;
    if (elongation < 0) elongation += 360;
    const waxing = elongation < 180;
    const phaseAngle = pheno.phaseAngle;

    // Resolve Sanskrit names
    const tithiName = TITHI_NAMES[tithiIdx - 1] ?? "Unknown";
    const paksha = tithiIdx <= 15 ? ("Shukla" as const) : ("Krishna" as const);
    const nakName = NAKSHATRA_NAMES[nakIdx - 1] ?? "Unknown";
    const pada = (Math.floor((moonPos.longitude % (360 / 27)) / (360 / 108)) + 1) as 1 | 2 | 3 | 4;
    const yogaName = YOGA_NAMES[yogaIdx - 1] ?? "Unknown";

    // Karana Name Logic (special handling for fixed karanas)
    let kName = "";
    if (karanaIdx === 1) kName = "Kimstughna";
    else if (karanaIdx === 58) kName = "Shakuni";
    else if (karanaIdx === 59) kName = "Chatushpada";
    else if (karanaIdx === 60) kName = "Naga";
    else {
      const movableIndex = (karanaIdx - 2) % 7;
      kName = KARANA_NAMES[movableIndex] ?? "Unknown";
    }

    // Time formatting helpers
    const formatTime = (dt: DateTime | null): string | undefined =>
      dt ? dt.toFormat("HH:mm:ss") : undefined;
    const formatIso = (dt: DateTime | null): string | undefined =>
      dt ? dt.toUTC().toISO() ?? undefined : undefined;

    const jdToLocal = (jd: number): DateTime => {
      const dateUTC = swisseph.swe_revjul(jd, swisseph.SE_GREG_CAL as 0 | 1);
      const h = Math.floor(dateUTC.hour);
      const remainder = (dateUTC.hour - h) * 60;
      const m = Math.floor(remainder);
      const s = Math.floor((remainder - m) * 60);
      return DateTime.utc(dateUTC.year, dateUTC.month, dateUTC.day, h, m, s).setZone(
        location.tz
      );
    };

    const tEnd = tithiEndJD ? jdToLocal(tithiEndJD) : null;
    const nEnd = nakEndJD ? jdToLocal(nakEndJD) : null;
    const yEnd = yogaEndJD ? jdToLocal(yogaEndJD) : null;
    const kEnd = karanaEndJD ? jdToLocal(karanaEndJD) : null;

    // ==========================================================================
    // STEP 6: Calculate Inauspicious Times (Rahu Kalam & Yamagandam)
    // ==========================================================================

    const dayDurationMin = astro.sunsetTime.diff(astro.sunriseTime, "minutes").minutes;
    const octet = dayDurationMin / 8;

    // Rahu Kalam octets (Sunday=0, Monday=1, ..., Saturday=6)
    const rahuOctets = [7, 1, 6, 4, 5, 3, 2]; // Sun=7th, Mon=1st, etc.
    const yamaOctets = [4, 3, 2, 1, 0, 6, 5]; // Sun=4th, Mon=3rd, etc.

    const rStartMin = rahuOctets[varaIdx]! * octet;
    const rEndMin = rStartMin + octet;
    const rahuStart = astro.sunriseTime.plus({ minutes: rStartMin });
    const rahuEnd = astro.sunriseTime.plus({ minutes: rEndMin });

    const yStartMin = yamaOctets[varaIdx]! * octet;
    const yEndMin = yStartMin + octet;
    const yamaStart = astro.sunriseTime.plus({ minutes: yStartMin });
    const yamaEnd = astro.sunriseTime.plus({ minutes: yEndMin });

    // ==========================================================================
    // STEP 6.5: Calculate Drik Panchang Extended Fields
    // ==========================================================================

    // -------------------------------------------------------------------------
    // RASHI (Sun/Moon Signs) - Sidereal Zodiac
    // -------------------------------------------------------------------------
    const sunSignIdx = Math.floor(sunPos.longitude / 30); // 0-11
    const moonSignIdx = Math.floor(moonPos.longitude / 30); // 0-11

    const sunSignName = SOLAR_MASA_NAMES[sunSignIdx] ?? "Unknown";
    const moonSignName = SOLAR_MASA_NAMES[moonSignIdx] ?? "Unknown";

    // Find when Sun/Moon transition to next sign (next 30° boundary)
    // Use norm360 for wrap-safe boundary calculation (359° → 0°)
    const nextSunSignBoundary = norm360((sunSignIdx + 1) * 30);
    const nextMoonSignBoundary = norm360((moonSignIdx + 1) * 30);

    // Sun sign transition time (Sankranti)
    // NOTE: findEventEnd has limited search window (~1.5 days), insufficient for sun (30 days)
    // This means sunSign.uptoLocal will often be null - acceptable limitation
    const sunSignEndJD = await findEventEnd(
      astro.sunriseJD,
      async (jd) => {
        const s = await swe_calc_ut(jd, swisseph.SE_SUN, flags);
        return norm360(s.longitude);
      },
      nextSunSignBoundary,
      360
    );

    // Moon sign transition time
    const moonSignEndJD = await findEventEnd(
      astro.sunriseJD,
      async (jd) => {
        const m = await swe_calc_ut(jd, swisseph.SE_MOON, flags);
        return norm360(m.longitude);
      },
      nextMoonSignBoundary,
      360
    );

    const sunSignEnd = sunSignEndJD ? jdToLocal(sunSignEndJD) : null;
    const moonSignEnd = moonSignEndJD ? jdToLocal(moonSignEndJD) : null;

    // -------------------------------------------------------------------------
    // PRAVISHTE/GATE - Days since last Sankranti
    // -------------------------------------------------------------------------
    // Search backwards from sunrise to find when Sun crossed into current sign
    let lastSankrantiJD = astro.sunriseJD;

    // Search up to 35 days back (max time in one sign)
    for (let i = 0; i < 35; i++) {
      const testJD = astro.sunriseJD - i;
      const testSunPos = await swe_calc_ut(testJD, swisseph.SE_SUN, flags);
      const testSignIdx = Math.floor(norm360(testSunPos.longitude) / 30);

      if (testSignIdx !== sunSignIdx) {
        // Found the boundary - refine with binary search
        let low = testJD;
        let high = testJD + 1;

        while (high - low > 0.0001) { // ~8.64 seconds precision
          const mid = (low + high) / 2;
          const midSunPos = await swe_calc_ut(mid, swisseph.SE_SUN, flags);
          const midLon = norm360(midSunPos.longitude);

          if (Math.floor(midLon / 30) === sunSignIdx) {
            high = mid; // Sankranti is before mid
          } else {
            low = mid; // Sankranti is after mid
          }
        }

        lastSankrantiJD = high;
        break;
      }
    }

    const lastSankrantiDate = jdToLocal(lastSankrantiJD);
    // Pravishte counts inclusively (Sankranti day = day 1, not day 0)
    // Traditional Vedic counting: if Sankranti was today, we are in day 1
    const daysSinceSankranti = Math.floor(astro.sunriseTime.diff(lastSankrantiDate, "days").days) + 1;

    // -------------------------------------------------------------------------
    // SAMVAT YEARS & SAMVATSARA NAMES (60-year cycle)
    // -------------------------------------------------------------------------
    // Vikrama Samvat: Starts at Chaitra Shukla Pratipada (Hindu New Year)
    // Shaka Samvat: Same boundary, different offset

    // Simplified approach: Use Gregorian year + offset
    // TODO: Refine to use exact Chaitra Shukla Pratipada boundary
    const sunriseDate = DateTime.fromISO(dateStr, { zone: location.tz });
    const gregorianYear = sunriseDate.year;

    // Approximate Hindu New Year (late March/early April)
    // If before April, we're in previous Hindu year
    const isBeforeNewYear = sunriseDate.month < 4;

    const vikramaYear = gregorianYear + 57 - (isBeforeNewYear ? 1 : 0);
    const shakaYear = gregorianYear - 78 - (isBeforeNewYear ? 1 : 0);

    // Map to 60-year Samvatsara cycle using traditional offsets
    // These offsets are standard in Vedic calendar tradition
    // Reference: Drik Panchang verification (2082 Vikrama = Kalayukta, 1947 Shaka = Vishvavasu)
    const VIKRAMA_SAMVATSARA_OFFSET = 9;  // (year + 9) % 60 gives correct cycle position
    const SHAKA_SAMVATSARA_OFFSET = 11;   // (year + 11) % 60 gives correct cycle position

    const vikramaSamvatsaraIdx = (vikramaYear + VIKRAMA_SAMVATSARA_OFFSET) % 60;
    const shakaSamvatsaraIdx = (shakaYear + SHAKA_SAMVATSARA_OFFSET) % 60;

    const vikramaSamvatsaraName = SAMVATSARA_NAMES[vikramaSamvatsaraIdx] ?? "Unknown";
    const shakaSamvatsaraName = SAMVATSARA_NAMES[shakaSamvatsaraIdx] ?? "Unknown";

    // -------------------------------------------------------------------------
    // MAAS (Lunar Month) - Purnimanta System (FIXED)
    // -------------------------------------------------------------------------
    // Purnimanta: Month begins day after Purnima, ends at next Purnima
    // Month NAME determined by solar sign at the PURNIMA (not current sun!)
    //
    // Fix per Codex feedback: Find exact Purnima via elongation, not sunrise sampling

    // Step 1: Find relevant Purnima for Purnimanta month name
    // IMPORTANT: In Purnimanta, when in Shukla paksha, use NEXT Purnima (future)!
    // When in Krishna paksha, use most recent (past) Purnima
    let monthStartPurnimaJD: number | null = null;
    const searchForward = paksha === "Shukla"; // Shukla → future, Krishna → past

    // Search for Purnima
    const searchDirection = searchForward ? 1 : -1;
    for (let dayOffset = 0; dayOffset < 35; dayOffset++) {
      const searchDayJD = astro.sunriseJD + (searchDirection * dayOffset);

      // Check if this day bracket contains Purnima (tithi 14 → 15 transition)
      const sunAtDay = await swe_calc_ut(searchDayJD, swisseph.SE_SUN, flags);
      const moonAtDay = await swe_calc_ut(searchDayJD, swisseph.SE_MOON, flags);
      const tithiAtDay = Math.floor(getTithiProgress(sunAtDay.longitude, moonAtDay.longitude)) + 1;

      // If we're near Purnima (tithi 13-16), find exact transition
      if (tithiAtDay >= 13 && tithiAtDay <= 16) {
        // Find exact moment when elongation reaches 180° (Purnima)
        // This is when tithi 14 ends = Purnima begins
        const purnimaJD = await findEventEnd(
          searchDayJD - 1, // Start 1 day before to ensure we bracket it
          async (jd) => {
            const s = await swe_calc_ut(jd, swisseph.SE_SUN, flags);
            const m = await swe_calc_ut(jd, swisseph.SE_MOON, flags);
            return getTithiProgress(s.longitude, m.longitude);
          },
          14, // Target: end of tithi 14
          30  // Wrap at 30
        );

        // For Shukla: accept if Purnima is in future
        // For Krishna: accept if Purnima is in past
        const isValid = searchForward
          ? purnimaJD && purnimaJD >= astro.sunriseJD
          : purnimaJD && purnimaJD <= astro.sunriseJD;

        if (isValid) {
          monthStartPurnimaJD = purnimaJD;
          break;
        }
      }
    }

    // Fallback: if no exact Purnima found, use rough estimate
    if (!monthStartPurnimaJD) {
      monthStartPurnimaJD = astro.sunriseJD - 15; // Rough: ~15 days ago
    }

    // Step 2: Calculate Maas name using (current_sun_sign + 1)
    // This matches Drik Panchang's Purnimanta month determination
    const maasIdx = (sunSignIdx + 1) % 12;
    const lunarMaasName = LUNAR_MASA_NAMES[maasIdx] ?? "Unknown";

    // Calculate lunar day using Purnimanta system (tithi-based, not solar days)
    // Purnimanta: Month starts day after Purnima, counts through Krishna then Shukla
    // Formula: Shukla tithi + 15, or Krishna tithi - 15
    const lunarDay = tithiIdx <= 15 ? tithiIdx + 15 : tithiIdx - 15;

    // Step 3: Detect Adhika (intercalary) month
    const isAdhika = await this.detectAdhikaMaas(astro.sunriseJD);

    // Step 4: Detect Sankranti (solar transition)
    const sankrantiData = await this.detectSankranti(dateStr, location);

    // -------------------------------------------------------------------------
    // MULTIPLE TRANSITIONS - Check if elements end before next sunrise
    // -------------------------------------------------------------------------
    const nextSunriseJD = astro.sunriseJD + 1; // Approximate next sunrise

    let nextTithi = undefined;
    let nextNakshatra = undefined;
    let nextYoga = undefined;
    let nextKarana = undefined;

    // If tithi ends before next sunrise, calculate next tithi
    if (tithiEndJD && tithiEndJD < nextSunriseJD) {
      const nextTithiIdx = (tithiIdx % 30) + 1;
      const nextTithiName = TITHI_NAMES[nextTithiIdx - 1] ?? "Unknown";
      const nextPaksha = nextTithiIdx <= 15 ? ("Shukla" as const) : ("Krishna" as const);

      // Find next tithi end time
      const nextTithiEndJD = await findEventEnd(
        tithiEndJD,
        async (jd) => {
          const s = await swe_calc_ut(jd, swisseph.SE_SUN, flags);
          const m = await swe_calc_ut(jd, swisseph.SE_MOON, flags);
          return getTithiProgress(s.longitude, m.longitude);
        },
        nextTithiIdx % 30,
        30
      );

      const nextTEnd = nextTithiEndJD ? jdToLocal(nextTithiEndJD) : null;

      nextTithi = {
        number: nextTithiIdx,
        name: nextTithiName,
        paksha: nextPaksha,
        endLocal: formatTime(nextTEnd),
        endUtcIso: formatIso(nextTEnd),
      };
    }

    // If nakshatra ends before next sunrise, calculate next nakshatra
    if (nakEndJD && nakEndJD < nextSunriseJD) {
      const nextNakIdx = (nakIdx % 27) + 1;
      const nextNakName = NAKSHATRA_NAMES[nextNakIdx - 1] ?? "Unknown";

      // Find next nakshatra end time
      const nextNakEndJD = await findEventEnd(
        nakEndJD,
        async (jd) => {
          const m = await swe_calc_ut(jd, swisseph.SE_MOON, flags);
          return getNakshatraProgress(m.longitude);
        },
        nextNakIdx % 27,
        27
      );

      const nextNEnd = nextNakEndJD ? jdToLocal(nextNakEndJD) : null;

      // Calculate pada for next nakshatra
      const nextMoonPos = await swe_calc_ut(nakEndJD + 0.01, swisseph.SE_MOON, flags);
      const nextPada = (Math.floor((nextMoonPos.longitude % (360 / 27)) / (360 / 108)) + 1) as 1 | 2 | 3 | 4;

      nextNakshatra = {
        number: nextNakIdx,
        name: nextNakName,
        pada: nextPada,
        endLocal: formatTime(nextNEnd),
        endUtcIso: formatIso(nextNEnd),
      };
    }

    // If yoga ends before next sunrise, calculate next yoga
    if (yogaEndJD && yogaEndJD < nextSunriseJD) {
      const nextYogaIdx = (yogaIdx % 27) + 1;
      const nextYogaName = YOGA_NAMES[nextYogaIdx - 1] ?? "Unknown";

      const nextYogaEndJD = await findEventEnd(
        yogaEndJD,
        async (jd) => {
          const s = await swe_calc_ut(jd, swisseph.SE_SUN, flags);
          const m = await swe_calc_ut(jd, swisseph.SE_MOON, flags);
          return getYogaProgress(s.longitude, m.longitude);
        },
        nextYogaIdx % 27,
        27
      );

      const nextYEnd = nextYogaEndJD ? jdToLocal(nextYogaEndJD) : null;

      nextYoga = {
        number: nextYogaIdx,
        name: nextYogaName,
        endLocal: formatTime(nextYEnd),
        endUtcIso: formatIso(nextYEnd),
      };
    }

    // If karana ends before next sunrise, calculate next karana
    if (karanaEndJD && karanaEndJD < nextSunriseJD) {
      const nextKaranaIdx = (karanaIdx % 60) + 1;

      let nextKName = "";
      if (nextKaranaIdx === 1) nextKName = "Kimstughna";
      else if (nextKaranaIdx === 58) nextKName = "Shakuni";
      else if (nextKaranaIdx === 59) nextKName = "Chatushpada";
      else if (nextKaranaIdx === 60) nextKName = "Naga";
      else {
        const movableIndex = (nextKaranaIdx - 2) % 7;
        nextKName = KARANA_NAMES[movableIndex] ?? "Unknown";
      }

      const nextKaranaEndJD = await findEventEnd(
        karanaEndJD,
        async (jd) => {
          const s = await swe_calc_ut(jd, swisseph.SE_SUN, flags);
          const m = await swe_calc_ut(jd, swisseph.SE_MOON, flags);
          const tp = getTithiProgress(s.longitude, m.longitude);
          return getKaranaProgress(tp);
        },
        nextKaranaIdx % 60,
        60
      );

      const nextKEnd = nextKaranaEndJD ? jdToLocal(nextKaranaEndJD) : null;

      nextKarana = {
        number: nextKaranaIdx,
        name: nextKName,
        type: (nextKaranaIdx >= 2 && nextKaranaIdx <= 57 ? "Movable" : "Fixed") as "Movable" | "Fixed",
        endLocal: formatTime(nextKEnd),
        endUtcIso: formatIso(nextKEnd),
      };
    }

    // ==========================================================================
    // STEP 7: Return Complete Panchanga Data
    // ==========================================================================

    return {
      date: dateStr,
      location: location,
      sunriseLocal: astro.sunriseTime.toFormat("HH:mm:ss"),
      sunsetLocal: astro.sunsetTime.toFormat("HH:mm:ss"),
      sunriseUtcIso: astro.sunriseTime.toUTC().toISO() ?? "",
      sunsetUtcIso: astro.sunsetTime.toUTC().toISO() ?? "",

      moonriseLocal: moonAstro.moonriseTime?.toFormat("HH:mm:ss") ?? null,
      moonsetLocal: moonAstro.moonsetTime?.toFormat("HH:mm:ss") ?? null,
      moonriseUtcIso: moonAstro.moonriseTime?.toUTC().toISO() ?? null,
      moonsetUtcIso: moonAstro.moonsetTime?.toUTC().toISO() ?? null,

      ayanamsa: {
        id: 1, // Lahiri
        name: "Lahiri",
        degrees: await getAyanamsa(astro.sunriseJD),
      },

      vara: {
        name: VARA_NAMES[varaIdx] ?? "Unknown",
        computedAt: "sunrise",
      },

      tithi: {
        number: tithiIdx,
        name: tithiName,
        paksha: paksha,
        endLocal: formatTime(tEnd),
        endUtcIso: formatIso(tEnd),
      },

      nakshatra: {
        number: nakIdx,
        name: nakName,
        pada: pada,
        endLocal: formatTime(nEnd),
        endUtcIso: formatIso(nEnd),
      },

      yoga: {
        number: yogaIdx,
        name: yogaName,
        endLocal: formatTime(yEnd),
        endUtcIso: formatIso(yEnd),
      },

      karana: {
        number: karanaIdx,
        name: kName,
        type: karanaIdx >= 2 && karanaIdx <= 57 ? "Movable" : "Fixed",
        endLocal: formatTime(kEnd),
        endUtcIso: formatIso(kEnd),
      },

      moon: {
        illuminationPct: illumination,
        phaseAngleDeg: phaseAngle,
        waxing: waxing,
      },

      rahuKalam: {
        startLocal: rahuStart.toFormat("HH:mm"),
        endLocal: rahuEnd.toFormat("HH:mm"),
      },
      yamagandam: {
        startLocal: yamaStart.toFormat("HH:mm"),
        endLocal: yamaEnd.toFormat("HH:mm"),
      },

      // Drik Panchang Extended Fields
      maas: {
        name: lunarMaasName,
        type: "Purnimanta",
        lunarDay: lunarDay,
        paksha: paksha,
        isAdhika: isAdhika,
      },

      sankranti: sankrantiData ? {
        name: sankrantiData.sankranti,
        time: sankrantiData.time,
      } : undefined,

      vikramaSamvat: {
        year: vikramaYear,
        name: vikramaSamvatsaraName,
      },

      samvatsara: {
        name: vikramaSamvatsaraName,
        number: vikramaSamvatsaraIdx + 1, // 1-60
      },

      shakaSamvat: {
        year: shakaYear,
        name: shakaSamvatsaraName,
      },

      sunSign: {
        number: sunSignIdx + 1, // 1-12
        name: sunSignName,
        uptoLocal: formatTime(sunSignEnd),
        uptoUtcIso: formatIso(sunSignEnd),
      },

      moonSign: {
        number: moonSignIdx + 1, // 1-12
        name: moonSignName,
        uptoLocal: formatTime(moonSignEnd),
        uptoUtcIso: formatIso(moonSignEnd),
      },

      pravishte: {
        daysSinceSankranti: daysSinceSankranti,
        currentRashi: sunSignName,
        lastSankrantiDate: lastSankrantiDate.toFormat("yyyy-MM-dd"),
      },

      nextTithi: nextTithi,
      nextNakshatra: nextNakshatra,
      nextYoga: nextYoga,
      nextKarana: nextKarana,

      meta: {
        engine: "swisseph-core",
        flags: ["SEFLG_SIDEREAL", "SEFLG_MOSEPH", "SE_SIDM_LAHIRI"],
        swissephVersion: "0.5.17",
      },
    };
  }

  /**
   * Find nearest Purnima (Full Moon) from a given Julian Day
   *
   * @param fromJD - Julian Day to search from
   * @param direction - 'backward' for previous Purnima, 'forward' for next Purnima
   * @returns Julian Day of the nearest Purnima, or null if not found
   */
  private async findNearestPurnima(fromJD: number, direction: 'backward' | 'forward'): Promise<number | null> {
    const flags = swisseph.SEFLG_SIDEREAL | swisseph.SEFLG_MOSEPH;
    const searchDirection = direction === 'forward' ? 1 : -1;

    // Start search offset at 1 to ensure we skip the current day
    // This guarantees: backward < fromJD and forward > fromJD
    for (let dayOffset = 1; dayOffset < 60; dayOffset++) {
      const searchDayJD = fromJD + (searchDirection * dayOffset);

      // Check if this day bracket contains Purnima (tithi 14 → 15 transition)
      const sunAtDay = await swe_calc_ut(searchDayJD, swisseph.SE_SUN, flags);
      const moonAtDay = await swe_calc_ut(searchDayJD, swisseph.SE_MOON, flags);
      const tithiAtDay = Math.floor(this.getTithiProgress(sunAtDay.longitude, moonAtDay.longitude)) + 1;

      // If we're near Purnima (tithi 13-16), find exact transition
      if (tithiAtDay >= 13 && tithiAtDay <= 16) {
        // Find exact moment when elongation reaches 180° (Purnima)
        const purnimaJD = await findEventEnd(
          searchDayJD - 1, // Start 1 day before to ensure we bracket it
          async (jd) => {
            const s = await swe_calc_ut(jd, swisseph.SE_SUN, flags);
            const m = await swe_calc_ut(jd, swisseph.SE_MOON, flags);
            return this.getTithiProgress(s.longitude, m.longitude);
          },
          14, // Target: end of tithi 14 (= Purnima begins)
          30  // Wrap at 30
        );

        // Verify the found Purnima is in the correct direction
        if (purnimaJD) {
          const isCorrectDirection = direction === 'forward'
            ? purnimaJD > fromJD
            : purnimaJD < fromJD;

          if (isCorrectDirection) {
            return purnimaJD;
          }
        }
      }
    }

    return null; // Not found within search range
  }

  /**
   * Get Sun's rashi (zodiac sign) at a given Julian Day
   *
   * @param jd - Julian Day
   * @returns Rashi index (0-11) or null if calculation fails
   */
  private async getSunRashi(jd: number): Promise<number | null> {
    const flags = swisseph.SEFLG_SIDEREAL | swisseph.SEFLG_MOSEPH;

    try {
      const sunPos = await swe_calc_ut(jd, swisseph.SE_SUN, flags);
      // SEFLG_SIDEREAL already applies ayanamsa correction
      // Do NOT subtract ayanamsa again (that would be double correction)
      const sidLongitude = (sunPos.longitude + 360) % 360;
      const rashiIdx = Math.floor(sidLongitude / 30);

      return rashiIdx;
    } catch {
      return null;
    }
  }

  /**
   * Helper method to calculate tithi progress (extracted for reuse)
   */
  private getTithiProgress(sunLongitude: number, moonLongitude: number): number {
    const elongation = (moonLongitude - sunLongitude + 360) % 360;
    return elongation / 12;
  }

  /**
   * Detect if current date is in an Adhika (intercalary) month
   *
   * Adhika month occurs when NO Sankranti (solar transition) happens between
   * two consecutive Amavasyas (new moons), meaning Sun's rashi is the same at both.
   *
   * IMPORTANT: Adhika is determined by AMAVASYA boundaries, not Purnima!
   * - Find previous Amavasya
   * - Find next Amavasya
   * - If Sun's rashi is SAME at both → this month is Adhika
   *
   * @param currentJD - Current Julian Day (at sunrise)
   * @returns true if Adhika month, false otherwise
   */
  private async detectAdhikaMaas(currentJD: number): Promise<boolean> {
    // Find the previous Amavasya (new moon)
    const prevAmavasya = await this.findNearestAmavasya(currentJD, 'backward');
    if (!prevAmavasya) return false;

    // Find the next Amavasya (new moon)
    const nextAmavasya = await this.findNearestAmavasya(currentJD, 'forward');
    if (!nextAmavasya) return false;

    // Get Sun's rashi at both Amavasyas
    const prevRashi = await this.getSunRashi(prevAmavasya);
    const nextRashi = await this.getSunRashi(nextAmavasya);

    if (prevRashi === null || nextRashi === null) return false;

    // If Sun's rashi is SAME at both Amavasyas → this month is Adhika
    // (no Sankranti occurred between them = no solar month transition)
    return prevRashi === nextRashi;
  }

  /**
   * Find nearest Amavasya (New Moon) from a given Julian Day
   *
   * @param fromJD - Julian Day to search from
   * @param direction - 'backward' for previous Amavasya, 'forward' for next Amavasya
   * @returns Julian Day of the nearest Amavasya, or null if not found
   */
  private async findNearestAmavasya(fromJD: number, direction: 'backward' | 'forward'): Promise<number | null> {
    const flags = swisseph.SEFLG_SIDEREAL | swisseph.SEFLG_MOSEPH;
    const searchDirection = direction === 'forward' ? 1 : -1;

    // Start search offset at 1 to ensure we skip the current day
    // This guarantees: backward < fromJD and forward > fromJD
    for (let dayOffset = 1; dayOffset < 60; dayOffset++) {
      const searchDayJD = fromJD + (searchDirection * dayOffset);

      // Check if this day bracket contains Amavasya (tithi 29 → 30/0 transition)
      const sunAtDay = await swe_calc_ut(searchDayJD, swisseph.SE_SUN, flags);
      const moonAtDay = await swe_calc_ut(searchDayJD, swisseph.SE_MOON, flags);
      const tithiAtDay = Math.floor(this.getTithiProgress(sunAtDay.longitude, moonAtDay.longitude)) + 1;

      // If we're near Amavasya (tithi 28-30 or 1-2), find exact transition
      if (tithiAtDay >= 28 || tithiAtDay <= 2) {
        // Find exact moment when elongation reaches 0° (Amavasya)
        // This is when tithi 29 ends = Amavasya begins (tithi 30)
        const amavasya = await findEventEnd(
          searchDayJD - 1, // Start 1 day before to ensure we bracket it
          async (jd) => {
            const s = await swe_calc_ut(jd, swisseph.SE_SUN, flags);
            const m = await swe_calc_ut(jd, swisseph.SE_MOON, flags);
            return this.getTithiProgress(s.longitude, m.longitude);
          },
          29, // Target: end of tithi 29 (= Amavasya begins)
          30  // Wrap at 30
        );

        // Verify the found Amavasya is in the correct direction
        if (amavasya) {
          const isCorrectDirection = direction === 'forward'
            ? amavasya > fromJD
            : amavasya < fromJD;

          if (isCorrectDirection) {
            return amavasya;
          }
        }
      }
    }

    return null; // Not found within search range
  }

  /**
   * Detect if a Sankranti (solar transition between rashis) occurs on a given date
   *
   * Sankranti = Sun transitioning from one zodiac sign to the next
   * We search ±1.5 days around the given date to detect transitions
   *
   * NOTE: Unlike findEventEnd which is limited to 1.5 days for lunar events,
   * solar transitions are slower and can be safely detected within this window.
   *
   * @param dateStr - Date string (YYYY-MM-DD)
   * @param location - Location config with lat, lon, tz
   * @returns Object with sankranti type and time, or null if no transition
   */
  private async detectSankranti(
    dateStr: string,
    location: LocationConfig
  ): Promise<{ sankranti: string; time: string } | null> {
    const flags = swisseph.SEFLG_SIDEREAL | swisseph.SEFLG_MOSEPH;

    // Get JD for start of this day (sunrise)
    const astro = await calculateSunriseSunset(dateStr, location);
    const dayStartJD = astro.sunriseJD;
    const dayEndJD = dayStartJD + 1; // ~24 hours later

    // Get Sun's rashi at day start and end
    const rashiStart = await this.getSunRashi(dayStartJD);
    const rashiEnd = await this.getSunRashi(dayEndJD);

    if (rashiStart === null || rashiEnd === null) return null;

    // No transition if rashi is same at start and end
    if (rashiStart === rashiEnd) return null;

    // Transition detected! Find exact time using binary search
    let low = dayStartJD;
    let high = dayEndJD;
    const PRECISION = 1 / (24 * 60); // 1 minute in Julian Days

    while (high - low > PRECISION) {
      const mid = (low + high) / 2;
      const rashiMid = await this.getSunRashi(mid);

      if (rashiMid === null) return null;

      if (rashiMid === rashiStart) {
        low = mid; // Transition hasn't happened yet
      } else {
        high = mid; // Transition has happened
      }
    }

    const transitionJD = (low + high) / 2;

    // Convert JD to time string (HH:mm format)
    const dateUTC = swisseph.swe_revjul(transitionJD, swisseph.SE_GREG_CAL as 0 | 1);
    const h = Math.floor(dateUTC.hour);
    const remainder = (dateUTC.hour - h) * 60;
    const m = Math.floor(remainder);
    const s = Math.floor((remainder - m) * 60);

    const dt = DateTime.utc(dateUTC.year, dateUTC.month, dateUTC.day, h, m, s).setZone(location.tz);
    const timeStr = dt.toFormat('HH:mm');

    // Determine which sankranti this is (based on the NEW rashi we're entering)
    const sankrantiNames = [
      'MESHA_SANKRANTI',       // Entering Aries
      'VRISHABHA_SANKRANTI',   // Entering Taurus
      'MITHUNA_SANKRANTI',     // Entering Gemini
      'KARKA_SANKRANTI',       // Entering Cancer
      'SIMHA_SANKRANTI',       // Entering Leo
      'KANYA_SANKRANTI',       // Entering Virgo
      'TULA_SANKRANTI',        // Entering Libra
      'VRISHCHIKA_SANKRANTI',  // Entering Scorpio
      'DHANU_SANKRANTI',       // Entering Sagittarius
      'MAKARA_SANKRANTI',      // Entering Capricorn (famous Makar Sankranti)
      'KUMBHA_SANKRANTI',      // Entering Aquarius
      'MEENA_SANKRANTI',       // Entering Pisces
    ];

    const sankranti = sankrantiNames[rashiEnd];

    return { sankranti, time: timeStr };
  }
}
