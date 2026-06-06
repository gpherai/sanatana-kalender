import "server-only";
import { DateTime } from "luxon";
import * as swisseph from "swisseph";
import swissephPkg from "swisseph/package.json";
import type { DailyPanchangaFull, LocationConfig } from "../types";
import {
  calculateSunriseSunset,
  calculateMoonriseMoonset,
  getAyanamsa,
  EPHE_PATH,
} from "../utils/astro";
import {
  TITHI_NAMES,
  NAKSHATRA_NAMES,
  YOGA_NAMES,
  VARA_NAMES,
  resolveKaranaName,
} from "../constants";
import { norm360, jdToLocal, formatTime, formatIso } from "./modules/panchanga-utils";
import {
  computePositionsAtSunrise,
  computeAngaIndices,
  computeAngaEndTimes,
  computeNextElements,
} from "./modules/anga-computer";
import { computeMoonIllumination } from "./modules/moon-illumination";
import { computeInauspiciousTimes } from "./modules/inauspicious-times";
import { computeRashiTransitions, computePravishte } from "./modules/rashi-computer";
import { computeMaasData } from "./modules/maas-detector";
import { computeSamvatData } from "./modules/samvat-computer";
import { detectSankranti } from "./modules/sankranti-detector";
import { detectMoonPhaseEvent } from "./modules/moon-phase-detector";

export class PanchangaSwissService {
  constructor() {
    swisseph.swe_set_ephe_path(EPHE_PATH);
    swisseph.swe_set_sid_mode(swisseph.SE_SIDM_LAHIRI, 0, 0);
  }

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
    const { sunPos, moonPos } = await computePositionsAtSunrise(astro.sunriseJD, flags);

    const angas = computeAngaIndices(sunPos, moonPos);
    const { tithiIdx, nakIdx, yogaIdx, karanaIdx } = angas;

    const endJDs = await computeAngaEndTimes(astro.sunriseJD, flags, angas);
    const { tithiEndJD, nakEndJD, yogaEndJD, karanaEndJD } = endJDs;

    const varaIdx = astro.sunriseTime.weekday === 7 ? 0 : astro.sunriseTime.weekday;

    const moonPhase = await computeMoonIllumination(
      astro.sunriseJD,
      flags,
      sunPos,
      moonPos
    );
    const { rahuKalam, yamagandam, gulikaKalam, abhijitMuhurta, vijayMuhurta } =
      computeInauspiciousTimes(astro.sunriseTime, astro.sunsetTime, varaIdx);

    const rashiData = await computeRashiTransitions(
      astro.sunriseJD,
      flags,
      sunPos,
      moonPos,
      location.tz
    );

    const pravishteData = await computePravishte(
      astro.sunriseJD,
      flags,
      rashiData.sunSignIdx,
      astro.sunriseTime,
      location.tz
    );

    const maasData = await computeMaasData(
      astro.sunriseJD,
      tithiIdx,
      rashiData.sunSignIdx
    );

    const gregorianDt = DateTime.fromISO(dateStr, { zone: location.tz });
    const samvatData = computeSamvatData(
      gregorianDt.year,
      gregorianDt.month,
      maasData.maasIdx,
      maasData.isAdhika
    );

    const sankrantiData = await detectSankranti(astro.sunriseJD, location.tz);
    const moonPhaseEvent = await detectMoonPhaseEvent(dateStr, location);

    const nextSunriseJD = astro.sunriseJD + 1;
    const { nextTithi, nextNakshatra, nextYoga, nextKarana } = await computeNextElements(
      endJDs,
      nextSunriseJD,
      angas,
      flags,
      location.tz
    );

    // Name resolution
    const tithiName = TITHI_NAMES[tithiIdx - 1] ?? "Unknown";
    const paksha = tithiIdx <= 15 ? ("Shukla" as const) : ("Krishna" as const);
    const nakName = NAKSHATRA_NAMES[nakIdx - 1] ?? "Unknown";
    const pada = (Math.floor((norm360(moonPos.longitude) % (360 / 27)) / (360 / 108)) +
      1) as 1 | 2 | 3 | 4;
    const yogaName = YOGA_NAMES[yogaIdx - 1] ?? "Unknown";
    const kName = resolveKaranaName(karanaIdx);

    const tEnd = tithiEndJD ? jdToLocal(tithiEndJD, location.tz) : null;
    const nEnd = nakEndJD ? jdToLocal(nakEndJD, location.tz) : null;
    const yEnd = yogaEndJD ? jdToLocal(yogaEndJD, location.tz) : null;
    const kEnd = karanaEndJD ? jdToLocal(karanaEndJD, location.tz) : null;

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
        illuminationPct: moonPhase.illumination,
        phaseAngleDeg: moonPhase.phaseAngle,
        waxing: moonPhase.waxing,
      },

      rahuKalam,
      yamagandam,
      gulikaKalam,
      abhijitMuhurta,
      vijayMuhurta,

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
        uptoLocal: formatTime(rashiData.sunSignEnd),
        uptoUtcIso: formatIso(rashiData.sunSignEnd),
      },

      moonSign: {
        number: rashiData.moonSignIdx + 1, // 1-12
        name: rashiData.moonSignName,
        uptoLocal: formatTime(rashiData.moonSignEnd),
        uptoUtcIso: formatIso(rashiData.moonSignEnd),
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
}
