import "server-only";
import { DateTime } from "luxon";
import * as swisseph from "swisseph";
import swissephPkg from "swisseph/package.json";
import type { DailyPanchangaFull, LocationConfig } from "../types";
import {
  calculateSunriseSunset,
  calculateMoonriseMoonset,
  swe_calc_ut,
  swe_pheno_ut,
  findEventEnd,
  getAyanamsa,
  swe_julday,
  EPHE_PATH,
} from "../utils/astro";
import {
  TITHI_NAMES,
  NAKSHATRA_NAMES,
  YOGA_NAMES,
  VARA_NAMES,
  LUNAR_MASA_NAMES,
  RASHI_NAMES,
  SAMVATSARA_NAMES,
  resolveKaranaName,
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
    // Use bundled Swiss Ephemeris data files (more accurate than Moshier)
    swisseph.swe_set_ephe_path(EPHE_PATH);
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
  async computeDaily(
    dateStr: string,
    location: LocationConfig
  ): Promise<DailyPanchangaFull> {
    // ==========================================================================
    // STEP 1: Calculate Sunrise & Sunset
    // ==========================================================================
    const astro = await calculateSunriseSunset(dateStr, location);

    // ==========================================================================
    // STEP 1.5: Calculate Moonrise & Moonset
    // ==========================================================================
    // Pass upcomingFromNow=true for today so that if the moonset already passed,
    // the next upcoming rise/set is returned instead of the stale earlier one.
    const todayStr = DateTime.now().setZone(location.tz).toISODate();
    const moonAstro = await calculateMoonriseMoonset(
      dateStr,
      location,
      dateStr === todayStr
    );

    // ==========================================================================
    // STEP 2: Calculate Positions at Sunrise
    // ==========================================================================
    // Flags: Sidereal (Lahiri), Moshier ephemeris (no files needed), Speed
    const flags = swisseph.SEFLG_SIDEREAL | swisseph.SEFLG_SWIEPH | swisseph.SEFLG_SPEED;
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

    const getNakshatraProgress = (mLon: number): number => norm360(mLon) / (360 / 27);
    const getYogaProgress = (sLon: number, mLon: number): number =>
      norm360(sLon + mLon) / (360 / 27);
    const getKaranaProgress = (tithiProg: number): number => tithiProg * 2;

    // Calculate progress values at sunrise
    const tithiProg = this.getTithiProgress(sunPos.longitude, moonPos.longitude);
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
        return this.getTithiProgress(s.longitude, m.longitude);
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
        const tp = this.getTithiProgress(s.longitude, m.longitude);
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
    const pada = (Math.floor((moonPos.longitude % (360 / 27)) / (360 / 108)) + 1) as
      | 1
      | 2
      | 3
      | 4;
    const yogaName = YOGA_NAMES[yogaIdx - 1] ?? "Unknown";

    const kName = resolveKaranaName(karanaIdx);

    // Time formatting helpers
    const formatTime = (dt: DateTime | null): string | undefined =>
      dt ? dt.toFormat("HH:mm:ss") : undefined;
    const formatIso = (dt: DateTime | null): string | undefined =>
      dt ? (dt.toUTC().toISO() ?? undefined) : undefined;

    const tEnd = tithiEndJD ? this.jdToLocal(tithiEndJD, location.tz) : null;
    const nEnd = nakEndJD ? this.jdToLocal(nakEndJD, location.tz) : null;
    const yEnd = yogaEndJD ? this.jdToLocal(yogaEndJD, location.tz) : null;
    const kEnd = karanaEndJD ? this.jdToLocal(karanaEndJD, location.tz) : null;

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

    const sunSignName = RASHI_NAMES[sunSignIdx] ?? "Unknown";
    const moonSignName = RASHI_NAMES[moonSignIdx] ?? "Unknown";

    // Find when Sun/Moon transition to next sign (next 30° boundary)
    // Use norm360 for wrap-safe boundary calculation (359° → 0°)
    const nextSunSignBoundary = norm360((sunSignIdx + 1) * 30);
    const nextMoonSignBoundary = norm360((moonSignIdx + 1) * 30);

    // Sun sign transition time (Sankranti) — sun stays in one sign ~30 days, scan 35
    const sunSignEndJD = await findEventEnd(
      astro.sunriseJD,
      async (jd) => {
        const s = await swe_calc_ut(jd, swisseph.SE_SUN, flags);
        return norm360(s.longitude);
      },
      nextSunSignBoundary,
      360,
      35
    );

    // Moon sign transition time — moon changes sign every ~2.5 days, scan 3
    const moonSignEndJD = await findEventEnd(
      astro.sunriseJD,
      async (jd) => {
        const m = await swe_calc_ut(jd, swisseph.SE_MOON, flags);
        return norm360(m.longitude);
      },
      nextMoonSignBoundary,
      360,
      3
    );

    const sunSignEnd = sunSignEndJD ? this.jdToLocal(sunSignEndJD, location.tz) : null;
    const moonSignEnd = moonSignEndJD ? this.jdToLocal(moonSignEndJD, location.tz) : null;

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

        while (high - low > 0.0001) {
          // ~8.64 seconds precision
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

    const lastSankrantiDate = this.jdToLocal(lastSankrantiJD, location.tz);
    // Pravishte counts inclusively (Sankranti day = day 1, not day 0)
    // Traditional Vedic counting: if Sankranti was today, we are in day 1
    const daysSinceSankranti =
      Math.floor(astro.sunriseTime.diff(lastSankrantiDate, "days").days) + 1;

    const sunriseDate = DateTime.fromISO(dateStr, { zone: location.tz });
    const gregorianYear = sunriseDate.year;

    // -------------------------------------------------------------------------
    // MAAS (Lunar Month) - Purnimanta System
    // -------------------------------------------------------------------------
    // In Purnimanta months start at Purnima (full moon). Month naming rule:
    //
    //   • Shukla paksha (tithiIdx 1-15) and Amavasya day (tithiIdx 30):
    //     use the PREVIOUS Amavasya's Sun rashi  (same as Amanta formula).
    //   • Krishna paksha, excluding Amavasya (tithiIdx 16-29):
    //     use the NEXT Amavasya's Sun rashi.
    //     This shifts the dark-half month name forward one cycle, so e.g.
    //     Jan 14 (Pratipada Krishna after Pausha Purnima Jan 13) uses the
    //     Jan 29 Amavasya (Sun in Makara) → maasIdx=10 = MAGHA ✓.
    //
    // Adhika month: same Sun rashi at both Amavasya boundaries = no
    // Sankranti in this lunar month.
    //
    // Example — 2026 Adhika Jyeshtha:
    //   May 16 Amavasya (Sun in Vrishabha idx=1) and Jun 14 Amavasya (Sun
    //   still in Vrishabha idx=1, Mithuna Sankranti arrives Jun 15) →
    //   same rashi → isAdhika=true for all days May 17–Jun 13.
    //   Nija Jyeshtha opens at Jun 14 Amavasya: maasIdx=(1+1)%12=2=Jyeshtha ✓.

    // Step 1: Find Amavasya boundaries of the current lunar month.
    const prevAmavasya = await this.findNearestAmavasya(astro.sunriseJD, "backward");
    const nextAmavasya = await this.findNearestAmavasya(astro.sunriseJD, "forward");

    const rashiAtPrevAmavasya = prevAmavasya
      ? await this.getSunRashi(prevAmavasya)
      : null;
    const rashiAtNextAmavasya = nextAmavasya
      ? await this.getSunRashi(nextAmavasya)
      : null;

    // Step 2: Determine maas name.
    // Krishna paksha (16-29) uses next Amavasya's Sun rashi.
    // Shukla paksha (1-15) uses previous Amavasya's Sun rashi.
    // Amavasya day (30) uses current day's Sun rashi directly — the Amavasya
    // closes the current Purnimanta month, so its maas = same as surrounding
    // Krishna paksha. Using prevAmavasya here gives the PREVIOUS month name.
    const useNextAmavasya = tithiIdx > 15 && tithiIdx < 30;
    const maasRashiIdx =
      tithiIdx === 30
        ? sunSignIdx
        : useNextAmavasya
          ? (rashiAtNextAmavasya ?? sunSignIdx)
          : (rashiAtPrevAmavasya ?? sunSignIdx);
    const maasIdx = (maasRashiIdx + 1) % 12;
    const lunarMaasName = LUNAR_MASA_NAMES[maasIdx] ?? "Unknown";

    // Calculate lunar day using Purnimanta system (tithi-based).
    // Formula: Shukla tithi + 15, or Krishna tithi - 15.
    const lunarDay = tithiIdx <= 15 ? tithiIdx + 15 : tithiIdx - 15;

    // Step 3: Detect Adhika (intercalary) month.
    // Same Sun rashi at both Amavasya boundaries = no Sankranti in this month.
    const prevRashi = rashiAtPrevAmavasya;
    const nextRashi = rashiAtNextAmavasya;
    const isAdhika = prevRashi !== null && nextRashi !== null && prevRashi === nextRashi;

    // -------------------------------------------------------------------------
    // SAMVAT YEARS & SAMVATSARA NAMES (60-year cycle)
    // -------------------------------------------------------------------------
    // Vikrama Samvat begins at Nija Chaitra Shukla Pratipada (Hindu New Year).
    // Phalguna (maasIdx 11) is the last lunar month; Adhika Chaitra does NOT
    // trigger the year change — only Nija Chaitra does.
    // This replaces the old month < 4 approximation which was wrong for late March.
    const isNewYearOpen = maasIdx !== 11 && !(maasIdx === 0 && isAdhika);
    const vikramaYear = gregorianYear + 57 - (isNewYearOpen ? 0 : 1);
    const shakaYear = gregorianYear - 78 - (isNewYearOpen ? 0 : 1);

    // Map to 60-year Samvatsara cycle using traditional offsets
    // Reference: Drik Panchang verification (2082 Vikrama = Kalayukta, 1947 Shaka = Vishvavasu)
    const VIKRAMA_SAMVATSARA_OFFSET = 9; // (year + 9) % 60 gives correct cycle position
    const SHAKA_SAMVATSARA_OFFSET = 11; // (year + 11) % 60 gives correct cycle position

    const vikramaSamvatsaraIdx = (vikramaYear + VIKRAMA_SAMVATSARA_OFFSET) % 60;
    const shakaSamvatsaraIdx = (shakaYear + SHAKA_SAMVATSARA_OFFSET) % 60;

    const vikramaSamvatsaraName = SAMVATSARA_NAMES[vikramaSamvatsaraIdx] ?? "Unknown";
    const shakaSamvatsaraName = SAMVATSARA_NAMES[shakaSamvatsaraIdx] ?? "Unknown";

    // Step 4: Detect Sankranti (solar transition) - reuse already-computed astro data
    const sankrantiData = await this.detectSankranti(astro.sunriseJD, location.tz);

    // Step 5: Detect exact moon phase event for this calendar day
    const moonPhaseEvent = await this.detectMoonPhaseEvent(dateStr, location);

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
          return this.getTithiProgress(s.longitude, m.longitude);
        },
        nextTithiIdx % 30,
        30
      );

      const nextTEnd = nextTithiEndJD
        ? this.jdToLocal(nextTithiEndJD, location.tz)
        : null;

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

      const nextNEnd = nextNakEndJD ? this.jdToLocal(nextNakEndJD, location.tz) : null;

      // Calculate pada for next nakshatra
      const nextMoonPos = await swe_calc_ut(nakEndJD + 0.01, swisseph.SE_MOON, flags);
      const nextPada = (Math.floor((nextMoonPos.longitude % (360 / 27)) / (360 / 108)) +
        1) as 1 | 2 | 3 | 4;

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

      const nextYEnd = nextYogaEndJD ? this.jdToLocal(nextYogaEndJD, location.tz) : null;

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

      const nextKaranaEndJD = await findEventEnd(
        karanaEndJD,
        async (jd) => {
          const s = await swe_calc_ut(jd, swisseph.SE_SUN, flags);
          const m = await swe_calc_ut(jd, swisseph.SE_MOON, flags);
          const tp = this.getTithiProgress(s.longitude, m.longitude);
          return getKaranaProgress(tp);
        },
        nextKaranaIdx % 60,
        60
      );

      const nextKEnd = nextKaranaEndJD
        ? this.jdToLocal(nextKaranaEndJD, location.tz)
        : null;

      nextKarana = {
        number: nextKaranaIdx,
        name: resolveKaranaName(nextKaranaIdx),
        type: (nextKaranaIdx >= 2 && nextKaranaIdx <= 57 ? "Movable" : "Fixed") as
          | "Movable"
          | "Fixed",
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

      sankranti: sankrantiData
        ? {
            name: sankrantiData.sankranti,
            time: sankrantiData.time,
          }
        : undefined,

      moonPhaseEvent: moonPhaseEvent ?? null,

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
        flags: ["SEFLG_SIDEREAL", "SEFLG_SWIEPH", "SE_SIDM_LAHIRI"],
        swissephVersion: swissephPkg.version,
      },
    };
  }

  private jdToLocal(jd: number, tz: string): DateTime {
    const dateUTC = swisseph.swe_revjul(jd, swisseph.SE_GREG_CAL as 0 | 1);
    const h = Math.floor(dateUTC.hour);
    const remainder = (dateUTC.hour - h) * 60;
    const m = Math.floor(remainder);
    const s = Math.floor((remainder - m) * 60);
    return DateTime.utc(dateUTC.year, dateUTC.month, dateUTC.day, h, m, s).setZone(tz);
  }

  /**
   * Get Sun's rashi (zodiac sign) at a given Julian Day
   *
   * @param jd - Julian Day
   * @returns Rashi index (0-11) or null if calculation fails
   */
  private async getSunRashi(jd: number): Promise<number | null> {
    const flags = swisseph.SEFLG_SIDEREAL | swisseph.SEFLG_SWIEPH;

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
   * Find nearest Amavasya (New Moon) from a given Julian Day
   *
   * @param fromJD - Julian Day to search from
   * @param direction - 'backward' for previous Amavasya, 'forward' for next Amavasya
   * @returns Julian Day of the nearest Amavasya, or null if not found
   */
  private async findNearestAmavasya(
    fromJD: number,
    direction: "backward" | "forward"
  ): Promise<number | null> {
    const flags = swisseph.SEFLG_SIDEREAL | swisseph.SEFLG_SWIEPH;
    const searchDirection = direction === "forward" ? 1 : -1;

    // Start search offset at 1 to ensure we skip the current day
    // This guarantees: backward < fromJD and forward > fromJD
    for (let dayOffset = 1; dayOffset < 60; dayOffset++) {
      const searchDayJD = fromJD + searchDirection * dayOffset;

      // Check if this day bracket contains Amavasya (tithi 29 → 30/0 transition)
      const sunAtDay = await swe_calc_ut(searchDayJD, swisseph.SE_SUN, flags);
      const moonAtDay = await swe_calc_ut(searchDayJD, swisseph.SE_MOON, flags);
      const tithiAtDay =
        Math.floor(this.getTithiProgress(sunAtDay.longitude, moonAtDay.longitude)) + 1;

      // If we're near Amavasya (tithi 28-30 or 1-2), find exact conjunction
      if (tithiAtDay >= 28 || tithiAtDay <= 2) {
        const getElongationProgress = async (jd: number) => {
          const s = await swe_calc_ut(jd, swisseph.SE_SUN, flags);
          const m = await swe_calc_ut(jd, swisseph.SE_MOON, flags);
          return this.getTithiProgress(s.longitude, m.longitude);
        };

        // Phase 1: find Amavasya start (348° elongation = tithi 29 ends)
        const amavasyaStart = await findEventEnd(
          searchDayJD - 1,
          getElongationProgress,
          29, // End of tithi 29 = Amavasya begins
          30
        );
        if (!amavasyaStart) continue;

        // Phase 2: find actual new moon conjunction (0°/360° elongation = Amavasya ends).
        // DP evaluates the Sun's rashi at the conjunction, not the Amavasya start.
        // The ~22h gap between 348° and 0° can shift the Sun across a rashi boundary.
        const conjunction = await findEventEnd(
          amavasyaStart,
          getElongationProgress,
          30, // End of Amavasya = actual new moon syzygy
          30,
          1.5
        );
        if (!conjunction) continue;

        const isCorrectDirection =
          direction === "forward" ? conjunction > fromJD : conjunction < fromJD;

        if (isCorrectDirection) {
          return conjunction;
        }
      }
    }

    return null; // Not found within search range
  }

  /**
   * Detect the exact moment of a major moon phase event within a calendar day.
   *
   * Checks whether any of the four phase targets (0°/90°/180°/270° elongation)
   * is crossed between local midnight and the next local midnight, then locates
   * the precise Julian Day via binary search (30 iterations ≈ millisecond precision).
   *
   * Uses midnight-to-midnight window (not sunrise-to-sunrise) so that the result
   * matches the Gregorian calendar day shown in the UI.
   *
   * @param dateStr - Calendar date in YYYY-MM-DD format (location's timezone)
   * @param loc - Location config with timezone
   * @returns Phase type + local/UTC times, or null if no phase occurs on this day
   */
  private async detectMoonPhaseEvent(
    dateStr: string,
    loc: LocationConfig
  ): Promise<{
    type: "new" | "first_quarter" | "full" | "last_quarter";
    timeLocal: string;
    timeUtcIso: string;
  } | null> {
    const flags = swisseph.SEFLG_SIDEREAL | swisseph.SEFLG_SWIEPH;

    const getElongation = async (jd: number): Promise<number> => {
      const s = await swe_calc_ut(jd, swisseph.SE_SUN, flags);
      const m = await swe_calc_ut(jd, swisseph.SE_MOON, flags);
      return (m.longitude - s.longitude + 360) % 360;
    };

    // Julian Day of local midnight (start of calendar day)
    const localMidnight = DateTime.fromISO(`${dateStr}T00:00:00`, {
      zone: loc.tz,
    }).toUTC();
    const dayStartJD = await swe_julday(
      localMidnight.year,
      localMidnight.month,
      localMidnight.day,
      localMidnight.hour + localMidnight.minute / 60 + localMidnight.second / 3600,
      swisseph.SE_GREG_CAL as 0 | 1
    );
    const dayEndJD = dayStartJD + 1; // exactly 24 Julian Day hours

    const e1 = await getElongation(dayStartJD);
    const e2 = await getElongation(dayEndJD);

    // The four phase targets in degrees of Moon-Sun elongation
    const phases: Array<{
      type: "new" | "first_quarter" | "full" | "last_quarter";
      target: number;
    }> = [
      { type: "first_quarter", target: 90 },
      { type: "full", target: 180 },
      { type: "last_quarter", target: 270 },
      { type: "new", target: 0 }, // wrap-around case — checked last
    ];

    for (const { type, target } of phases) {
      const crossed =
        target === 0
          ? e1 > 340 && e2 < 15 // elongation wraps 360° → 0°; margins cover full 12°/day motion
          : e1 < target && e2 >= target;

      if (!crossed) continue;

      // Binary search for the exact Julian Day of the crossing (30 iterations)
      let lo = dayStartJD;
      let hi = dayEndJD;

      for (let i = 0; i < 30; i++) {
        const mid = (lo + hi) / 2;
        const eMid = await getElongation(mid);
        if (target === 0) {
          // New moon: elongation descends through 360°→0°; > 180 = still before crossing
          if (eMid > 180) lo = mid;
          else hi = mid;
        } else {
          if (eMid < target) lo = mid;
          else hi = mid;
        }
      }

      const eventJD = (lo + hi) / 2;
      const eventDt = this.jdToLocal(eventJD, loc.tz);

      return {
        type,
        timeLocal: eventDt.toFormat("HH:mm"),
        timeUtcIso: eventDt.toUTC().toISO() ?? "",
      };
    }

    return null;
  }

  /**
   * Detect if a Sankranti (solar transition between rashis) occurs on a given date.
   *
   * Sankranti = Sun transitioning from one zodiac sign to the next.
   * Searches within a ~24-hour window starting at the provided sunrise Julian Day.
   *
   * NOTE: Unlike findEventEnd which is limited to 1.5 days for lunar events,
   * solar transitions are slower and can be safely detected within this window.
   *
   * @param sunriseJD - Julian Day of sunrise (already computed by caller)
   * @param tz - IANA timezone string for local time formatting
   * @returns Object with sankranti type and time, or null if no transition
   */
  private async detectSankranti(
    sunriseJD: number,
    tz: string
  ): Promise<{ sankranti: string; time: string } | null> {
    const dayStartJD = sunriseJD;
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
    const timeStr = this.jdToLocal(transitionJD, tz).toFormat("HH:mm");

    // Determine which sankranti this is (based on the NEW rashi we're entering)
    const sankrantiNames = [
      "MESHA_SANKRANTI", // Entering Aries
      "VRISHABHA_SANKRANTI", // Entering Taurus
      "MITHUNA_SANKRANTI", // Entering Gemini
      "KARKA_SANKRANTI", // Entering Cancer
      "SIMHA_SANKRANTI", // Entering Leo
      "KANYA_SANKRANTI", // Entering Virgo
      "TULA_SANKRANTI", // Entering Libra
      "VRISHCHIKA_SANKRANTI", // Entering Scorpio
      "DHANU_SANKRANTI", // Entering Sagittarius
      "MAKARA_SANKRANTI", // Entering Capricorn (famous Makar Sankranti)
      "KUMBHA_SANKRANTI", // Entering Aquarius
      "MEENA_SANKRANTI", // Entering Pisces
    ];

    const sankranti = sankrantiNames[rashiEnd] ?? "UNKNOWN_SANKRANTI";

    return { sankranti, time: timeStr };
  }
}
