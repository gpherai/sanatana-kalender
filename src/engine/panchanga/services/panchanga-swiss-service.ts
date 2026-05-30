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
    const astro = await calculateSunriseSunset(dateStr, location);

    const todayStr = DateTime.now().setZone(location.tz).toISODate();
    const moonAstro = await calculateMoonriseMoonset(
      dateStr,
      location,
      dateStr === todayStr
    );

    const flags = swisseph.SEFLG_SIDEREAL | swisseph.SEFLG_SWIEPH | swisseph.SEFLG_SPEED;
    const { sunPos, moonPos } = await this.computePositionsAtSunrise(
      astro.sunriseJD,
      flags
    );

    const angas = this.computeAngaIndices(sunPos, moonPos);
    const { tithiIdx, nakIdx, yogaIdx, karanaIdx } = angas;

    const endJDs = await this.computeAngaEndTimes(astro.sunriseJD, flags, angas);
    const { tithiEndJD, nakEndJD, yogaEndJD, karanaEndJD } = endJDs;

    const varaIdx = astro.sunriseTime.weekday === 7 ? 0 : astro.sunriseTime.weekday;

    const moonPhase = await this.computeMoonIllumination(
      astro.sunriseJD,
      flags,
      sunPos,
      moonPos
    );

    const { rahuKalam, yamagandam } = this.computeInauspiciousTimes(
      astro.sunriseTime,
      astro.sunsetTime,
      varaIdx
    );

    const rashiData = await this.computeRashiTransitions(
      astro.sunriseJD,
      flags,
      sunPos,
      moonPos,
      location.tz
    );

    const pravishteData = await this.computePravishte(
      astro.sunriseJD,
      flags,
      rashiData.sunSignIdx,
      astro.sunriseTime,
      location.tz
    );

    const maasData = await this.computeMaasData(
      astro.sunriseJD,
      tithiIdx,
      rashiData.sunSignIdx
    );

    const gregorianYear = DateTime.fromISO(dateStr, { zone: location.tz }).year;
    const samvatData = this.computeSamvatData(
      gregorianYear,
      maasData.maasIdx,
      maasData.isAdhika
    );

    const sankrantiData = await this.detectSankranti(astro.sunriseJD, location.tz);
    const moonPhaseEvent = await this.detectMoonPhaseEvent(dateStr, location);

    const nextSunriseJD = astro.sunriseJD + 1;
    const { nextTithi, nextNakshatra, nextYoga, nextKarana } =
      await this.computeNextElements(endJDs, nextSunriseJD, angas, flags, location.tz);

    // Name resolution
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

    const tEnd = tithiEndJD ? this.jdToLocal(tithiEndJD, location.tz) : null;
    const nEnd = nakEndJD ? this.jdToLocal(nakEndJD, location.tz) : null;
    const yEnd = yogaEndJD ? this.jdToLocal(yogaEndJD, location.tz) : null;
    const kEnd = karanaEndJD ? this.jdToLocal(karanaEndJD, location.tz) : null;

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
        endLocal: this.formatTime(tEnd),
        endUtcIso: this.formatIso(tEnd),
      },

      nakshatra: {
        number: nakIdx,
        name: nakName,
        pada: pada,
        endLocal: this.formatTime(nEnd),
        endUtcIso: this.formatIso(nEnd),
      },

      yoga: {
        number: yogaIdx,
        name: yogaName,
        endLocal: this.formatTime(yEnd),
        endUtcIso: this.formatIso(yEnd),
      },

      karana: {
        number: karanaIdx,
        name: kName,
        type: karanaIdx >= 2 && karanaIdx <= 57 ? "Movable" : "Fixed",
        endLocal: this.formatTime(kEnd),
        endUtcIso: this.formatIso(kEnd),
      },

      moon: {
        illuminationPct: moonPhase.illumination,
        phaseAngleDeg: moonPhase.phaseAngle,
        waxing: moonPhase.waxing,
      },

      rahuKalam,
      yamagandam,

      maas: {
        name: maasData.lunarMaasName,
        type: "Purnimanta",
        lunarDay: maasData.lunarDay,
        paksha: paksha,
        isAdhika: maasData.isAdhika,
      },

      sankranti: sankrantiData
        ? {
            name: sankrantiData.sankranti,
            time: sankrantiData.time,
          }
        : undefined,

      moonPhaseEvent: moonPhaseEvent ?? null,

      vikramaSamvat: {
        year: samvatData.vikramaYear,
        name: samvatData.vikramaSamvatsaraName,
      },

      samvatsara: {
        name: samvatData.vikramaSamvatsaraName,
        number: samvatData.vikramaSamvatsaraIdx + 1, // 1-60
      },

      shakaSamvat: {
        year: samvatData.shakaYear,
        name: samvatData.shakaSamvatsaraName,
      },

      sunSign: {
        number: rashiData.sunSignIdx + 1, // 1-12
        name: rashiData.sunSignName,
        uptoLocal: this.formatTime(rashiData.sunSignEnd),
        uptoUtcIso: this.formatIso(rashiData.sunSignEnd),
      },

      moonSign: {
        number: rashiData.moonSignIdx + 1, // 1-12
        name: rashiData.moonSignName,
        uptoLocal: this.formatTime(rashiData.moonSignEnd),
        uptoUtcIso: this.formatIso(rashiData.moonSignEnd),
      },

      pravishte: {
        daysSinceSankranti: pravishteData.daysSinceSankranti,
        currentRashi: rashiData.sunSignName,
        lastSankrantiDate: pravishteData.lastSankrantiDate.toFormat("yyyy-MM-dd"),
      },

      nextTithi,
      nextNakshatra,
      nextYoga,
      nextKarana,

      meta: {
        engine: "swisseph-core",
        flags: ["SEFLG_SIDEREAL", "SEFLG_SWIEPH", "SE_SIDM_LAHIRI"],
        swissephVersion: swissephPkg.version,
      },
    };
  }

  // ==========================================================================
  // UTILITY HELPERS
  // ==========================================================================

  private norm360(x: number): number {
    return ((x % 360) + 360) % 360;
  }

  private formatTime(dt: DateTime | null): string | undefined {
    return dt ? dt.toFormat("HH:mm:ss") : undefined;
  }

  private formatIso(dt: DateTime | null): string | undefined {
    return dt ? (dt.toUTC().toISO() ?? undefined) : undefined;
  }

  // ==========================================================================
  // POSITION & INDEX CALCULATIONS
  // ==========================================================================

  private async computePositionsAtSunrise(sunriseJD: number, flags: number) {
    const sunPos = await swe_calc_ut(sunriseJD, swisseph.SE_SUN, flags);
    const moonPos = await swe_calc_ut(sunriseJD, swisseph.SE_MOON, flags);
    return { sunPos, moonPos };
  }

  private computeAngaIndices(
    sunPos: { longitude: number },
    moonPos: { longitude: number }
  ) {
    const tithiProg = this.getTithiProgress(sunPos.longitude, moonPos.longitude);
    const nakProg = this.norm360(moonPos.longitude) / (360 / 27);
    const yogaProg = this.norm360(sunPos.longitude + moonPos.longitude) / (360 / 27);
    const karanaProg = tithiProg * 2;
    return {
      tithiProg,
      nakProg,
      yogaProg,
      karanaProg,
      tithiIdx: Math.floor(tithiProg) + 1,
      nakIdx: Math.floor(nakProg) + 1,
      yogaIdx: Math.floor(yogaProg) + 1,
      karanaIdx: Math.floor(karanaProg) + 1,
    };
  }

  // ==========================================================================
  // END TIME CALCULATIONS
  // ==========================================================================

  private async computeAngaEndTimes(
    sunriseJD: number,
    flags: number,
    indices: { tithiIdx: number; nakIdx: number; yogaIdx: number; karanaIdx: number }
  ) {
    const { tithiIdx, nakIdx, yogaIdx, karanaIdx } = indices;

    const tithiEndJD = await findEventEnd(
      sunriseJD,
      async (jd) => {
        const s = await swe_calc_ut(jd, swisseph.SE_SUN, flags);
        const m = await swe_calc_ut(jd, swisseph.SE_MOON, flags);
        return this.getTithiProgress(s.longitude, m.longitude);
      },
      tithiIdx % 30,
      30
    );

    const nakEndJD = await findEventEnd(
      sunriseJD,
      async (jd) => {
        const m = await swe_calc_ut(jd, swisseph.SE_MOON, flags);
        return this.norm360(m.longitude) / (360 / 27);
      },
      nakIdx % 27,
      27
    );

    const yogaEndJD = await findEventEnd(
      sunriseJD,
      async (jd) => {
        const s = await swe_calc_ut(jd, swisseph.SE_SUN, flags);
        const m = await swe_calc_ut(jd, swisseph.SE_MOON, flags);
        return this.norm360(s.longitude + m.longitude) / (360 / 27);
      },
      yogaIdx % 27,
      27
    );

    const karanaEndJD = await findEventEnd(
      sunriseJD,
      async (jd) => {
        const s = await swe_calc_ut(jd, swisseph.SE_SUN, flags);
        const m = await swe_calc_ut(jd, swisseph.SE_MOON, flags);
        return this.getTithiProgress(s.longitude, m.longitude) * 2;
      },
      karanaIdx % 60,
      60
    );

    return { tithiEndJD, nakEndJD, yogaEndJD, karanaEndJD };
  }

  // ==========================================================================
  // MOON ILLUMINATION
  // ==========================================================================

  private async computeMoonIllumination(
    sunriseJD: number,
    flags: number,
    sunPos: { longitude: number },
    moonPos: { longitude: number }
  ) {
    const pheno = await swe_pheno_ut(sunriseJD, swisseph.SE_MOON, flags);
    const illumination = pheno.phaseIllum * 100;
    let elongation = moonPos.longitude - sunPos.longitude;
    if (elongation < 0) elongation += 360;
    const waxing = elongation < 180;
    return { illumination, waxing, phaseAngle: pheno.phaseAngle };
  }

  // ==========================================================================
  // INAUSPICIOUS TIMES
  // ==========================================================================

  private computeInauspiciousTimes(
    sunriseTime: DateTime,
    sunsetTime: DateTime,
    varaIdx: number
  ) {
    const dayDurationMin = sunsetTime.diff(sunriseTime, "minutes").minutes;
    const octet = dayDurationMin / 8;

    // Rahu Kalam octets (Sunday=0, Monday=1, ..., Saturday=6)
    const rahuOctets = [7, 1, 6, 4, 5, 3, 2];
    const yamaOctets = [4, 3, 2, 1, 0, 6, 5];

    const rStartMin = rahuOctets[varaIdx]! * octet;
    const yStartMin = yamaOctets[varaIdx]! * octet;

    const rahuStart = sunriseTime.plus({ minutes: rStartMin });
    const rahuEnd = sunriseTime.plus({ minutes: rStartMin + octet });
    const yamaStart = sunriseTime.plus({ minutes: yStartMin });
    const yamaEnd = sunriseTime.plus({ minutes: yStartMin + octet });

    return {
      rahuKalam: {
        startLocal: rahuStart.toFormat("HH:mm"),
        endLocal: rahuEnd.toFormat("HH:mm"),
      },
      yamagandam: {
        startLocal: yamaStart.toFormat("HH:mm"),
        endLocal: yamaEnd.toFormat("HH:mm"),
      },
    };
  }

  // ==========================================================================
  // RASHI TRANSITIONS
  // ==========================================================================

  private async computeRashiTransitions(
    sunriseJD: number,
    flags: number,
    sunPos: { longitude: number },
    moonPos: { longitude: number },
    tz: string
  ) {
    const sunSignIdx = Math.floor(sunPos.longitude / 30);
    const moonSignIdx = Math.floor(moonPos.longitude / 30);

    // Use norm360 for wrap-safe boundary calculation (359° → 0°)
    const nextSunSignBoundary = this.norm360((sunSignIdx + 1) * 30);
    const nextMoonSignBoundary = this.norm360((moonSignIdx + 1) * 30);

    // Sun stays in one sign ~30 days, scan 35
    const sunSignEndJD = await findEventEnd(
      sunriseJD,
      async (jd) => {
        const s = await swe_calc_ut(jd, swisseph.SE_SUN, flags);
        return this.norm360(s.longitude);
      },
      nextSunSignBoundary,
      360,
      35
    );

    // Moon changes sign every ~2.5 days, scan 3
    const moonSignEndJD = await findEventEnd(
      sunriseJD,
      async (jd) => {
        const m = await swe_calc_ut(jd, swisseph.SE_MOON, flags);
        return this.norm360(m.longitude);
      },
      nextMoonSignBoundary,
      360,
      3
    );

    const sunSignEnd = sunSignEndJD ? this.jdToLocal(sunSignEndJD, tz) : null;
    const moonSignEnd = moonSignEndJD ? this.jdToLocal(moonSignEndJD, tz) : null;

    return {
      sunSignIdx,
      moonSignIdx,
      sunSignName: RASHI_NAMES[sunSignIdx] ?? "Unknown",
      moonSignName: RASHI_NAMES[moonSignIdx] ?? "Unknown",
      sunSignEnd,
      moonSignEnd,
    };
  }

  // ==========================================================================
  // PRAVISHTE (days since Sankranti)
  // ==========================================================================

  private async computePravishte(
    sunriseJD: number,
    flags: number,
    sunSignIdx: number,
    sunriseTime: DateTime,
    tz: string
  ) {
    let lastSankrantiJD = sunriseJD;

    // Search up to 35 days back (max time in one sign)
    for (let i = 0; i < 35; i++) {
      const testJD = sunriseJD - i;
      const testSunPos = await swe_calc_ut(testJD, swisseph.SE_SUN, flags);
      const testSignIdx = Math.floor(this.norm360(testSunPos.longitude) / 30);

      if (testSignIdx !== sunSignIdx) {
        // Found the boundary — refine with binary search (~8.64 seconds precision)
        let low = testJD;
        let high = testJD + 1;

        while (high - low > 0.0001) {
          const mid = (low + high) / 2;
          const midSunPos = await swe_calc_ut(mid, swisseph.SE_SUN, flags);
          const midLon = this.norm360(midSunPos.longitude);

          if (Math.floor(midLon / 30) === sunSignIdx) {
            high = mid;
          } else {
            low = mid;
          }
        }

        lastSankrantiJD = high;
        break;
      }
    }

    const lastSankrantiDate = this.jdToLocal(lastSankrantiJD, tz);
    // Pravishte counts inclusively (Sankranti day = day 1, not day 0)
    const daysSinceSankranti =
      Math.floor(sunriseTime.diff(lastSankrantiDate, "days").days) + 1;

    return { daysSinceSankranti, lastSankrantiDate };
  }

  // ==========================================================================
  // MAAS (Lunar Month)
  // ==========================================================================

  private async computeMaasData(sunriseJD: number, tithiIdx: number, sunSignIdx: number) {
    // Purnimanta system — see inline comment in original computeDaily for full rule.
    const prevAmavasya = await this.findNearestAmavasya(sunriseJD, "backward");
    const nextAmavasya = await this.findNearestAmavasya(sunriseJD, "forward");

    const rashiAtPrevAmavasya = prevAmavasya
      ? await this.getSunRashi(prevAmavasya)
      : null;
    const rashiAtNextAmavasya = nextAmavasya
      ? await this.getSunRashi(nextAmavasya)
      : null;

    // Krishna paksha (16-29) uses next Amavasya's Sun rashi.
    // Shukla paksha (1-15) and Amavasya (30) use previous / current.
    const useNextAmavasya = tithiIdx > 15 && tithiIdx < 30;
    const maasRashiIdx =
      tithiIdx === 30
        ? sunSignIdx
        : useNextAmavasya
          ? (rashiAtNextAmavasya ?? sunSignIdx)
          : (rashiAtPrevAmavasya ?? sunSignIdx);

    const maasIdx = (maasRashiIdx + 1) % 12;
    const lunarMaasName = LUNAR_MASA_NAMES[maasIdx] ?? "Unknown";
    const lunarDay = tithiIdx <= 15 ? tithiIdx + 15 : tithiIdx - 15;
    const isAdhika =
      rashiAtPrevAmavasya !== null &&
      rashiAtNextAmavasya !== null &&
      rashiAtPrevAmavasya === rashiAtNextAmavasya;

    return { maasIdx, lunarMaasName, lunarDay, isAdhika };
  }

  // ==========================================================================
  // SAMVAT YEARS & SAMVATSARA
  // ==========================================================================

  private computeSamvatData(gregorianYear: number, maasIdx: number, isAdhika: boolean) {
    // Vikrama Samvat begins at Nija Chaitra Shukla Pratipada.
    // Adhika Chaitra does NOT trigger the year change — only Nija Chaitra does.
    const isNewYearOpen = maasIdx !== 11 && !(maasIdx === 0 && isAdhika);
    const vikramaYear = gregorianYear + 57 - (isNewYearOpen ? 0 : 1);
    const shakaYear = gregorianYear - 78 - (isNewYearOpen ? 0 : 1);

    // Reference: Drik Panchang verification (2082 Vikrama = Kalayukta, 1947 Shaka = Vishvavasu)
    const VIKRAMA_SAMVATSARA_OFFSET = 9;
    const SHAKA_SAMVATSARA_OFFSET = 11;

    const vikramaSamvatsaraIdx = (vikramaYear + VIKRAMA_SAMVATSARA_OFFSET) % 60;
    const shakaSamvatsaraIdx = (shakaYear + SHAKA_SAMVATSARA_OFFSET) % 60;

    return {
      vikramaYear,
      shakaYear,
      vikramaSamvatsaraIdx,
      shakaSamvatsaraIdx,
      vikramaSamvatsaraName: SAMVATSARA_NAMES[vikramaSamvatsaraIdx] ?? "Unknown",
      shakaSamvatsaraName: SAMVATSARA_NAMES[shakaSamvatsaraIdx] ?? "Unknown",
    };
  }

  // ==========================================================================
  // NEXT ELEMENT TRANSITIONS
  // ==========================================================================

  private async computeNextElements(
    endJDs: {
      tithiEndJD: number | null;
      nakEndJD: number | null;
      yogaEndJD: number | null;
      karanaEndJD: number | null;
    },
    nextSunriseJD: number,
    indices: { tithiIdx: number; nakIdx: number; yogaIdx: number; karanaIdx: number },
    flags: number,
    tz: string
  ) {
    const { tithiEndJD, nakEndJD, yogaEndJD, karanaEndJD } = endJDs;
    const { tithiIdx, nakIdx, yogaIdx, karanaIdx } = indices;

    let nextTithi = undefined;
    let nextNakshatra = undefined;
    let nextYoga = undefined;
    let nextKarana = undefined;

    if (tithiEndJD && tithiEndJD < nextSunriseJD) {
      const nextTithiIdx = (tithiIdx % 30) + 1;
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
      const nextTEnd = nextTithiEndJD ? this.jdToLocal(nextTithiEndJD, tz) : null;
      nextTithi = {
        number: nextTithiIdx,
        name: TITHI_NAMES[nextTithiIdx - 1] ?? "Unknown",
        paksha: nextTithiIdx <= 15 ? ("Shukla" as const) : ("Krishna" as const),
        endLocal: this.formatTime(nextTEnd),
        endUtcIso: this.formatIso(nextTEnd),
      };
    }

    if (nakEndJD && nakEndJD < nextSunriseJD) {
      const nextNakIdx = (nakIdx % 27) + 1;
      const nextNakEndJD = await findEventEnd(
        nakEndJD,
        async (jd) => {
          const m = await swe_calc_ut(jd, swisseph.SE_MOON, flags);
          return this.norm360(m.longitude) / (360 / 27);
        },
        nextNakIdx % 27,
        27
      );
      const nextNEnd = nextNakEndJD ? this.jdToLocal(nextNakEndJD, tz) : null;
      const nextMoonPos = await swe_calc_ut(nakEndJD + 0.01, swisseph.SE_MOON, flags);
      const nextPada = (Math.floor((nextMoonPos.longitude % (360 / 27)) / (360 / 108)) +
        1) as 1 | 2 | 3 | 4;
      nextNakshatra = {
        number: nextNakIdx,
        name: NAKSHATRA_NAMES[nextNakIdx - 1] ?? "Unknown",
        pada: nextPada,
        endLocal: this.formatTime(nextNEnd),
        endUtcIso: this.formatIso(nextNEnd),
      };
    }

    if (yogaEndJD && yogaEndJD < nextSunriseJD) {
      const nextYogaIdx = (yogaIdx % 27) + 1;
      const nextYogaEndJD = await findEventEnd(
        yogaEndJD,
        async (jd) => {
          const s = await swe_calc_ut(jd, swisseph.SE_SUN, flags);
          const m = await swe_calc_ut(jd, swisseph.SE_MOON, flags);
          return this.norm360(s.longitude + m.longitude) / (360 / 27);
        },
        nextYogaIdx % 27,
        27
      );
      const nextYEnd = nextYogaEndJD ? this.jdToLocal(nextYogaEndJD, tz) : null;
      nextYoga = {
        number: nextYogaIdx,
        name: YOGA_NAMES[nextYogaIdx - 1] ?? "Unknown",
        endLocal: this.formatTime(nextYEnd),
        endUtcIso: this.formatIso(nextYEnd),
      };
    }

    if (karanaEndJD && karanaEndJD < nextSunriseJD) {
      const nextKaranaIdx = (karanaIdx % 60) + 1;
      const nextKaranaEndJD = await findEventEnd(
        karanaEndJD,
        async (jd) => {
          const s = await swe_calc_ut(jd, swisseph.SE_SUN, flags);
          const m = await swe_calc_ut(jd, swisseph.SE_MOON, flags);
          return this.getTithiProgress(s.longitude, m.longitude) * 2;
        },
        nextKaranaIdx % 60,
        60
      );
      const nextKEnd = nextKaranaEndJD ? this.jdToLocal(nextKaranaEndJD, tz) : null;
      nextKarana = {
        number: nextKaranaIdx,
        name: resolveKaranaName(nextKaranaIdx),
        type: (nextKaranaIdx >= 2 && nextKaranaIdx <= 57 ? "Movable" : "Fixed") as
          | "Movable"
          | "Fixed",
        endLocal: this.formatTime(nextKEnd),
        endUtcIso: this.formatIso(nextKEnd),
      };
    }

    return { nextTithi, nextNakshatra, nextYoga, nextKarana };
  }

  // ==========================================================================
  // EXISTING PRIVATE METHODS (unchanged)
  // ==========================================================================

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
