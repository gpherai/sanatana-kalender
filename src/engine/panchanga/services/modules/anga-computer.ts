import * as swisseph from "swisseph";
import { swe_calc_ut, findEventEnd } from "../../utils/astro";
import {
  TITHI_NAMES,
  NAKSHATRA_NAMES,
  YOGA_NAMES,
  resolveKaranaName,
} from "../../constants";
import {
  norm360,
  getTithiProgress,
  jdToLocal,
  formatTime,
  formatIso,
} from "./panchanga-utils";

export async function computePositionsAtSunrise(sunriseJD: number, flags: number) {
  const sunPos = await swe_calc_ut(sunriseJD, swisseph.SE_SUN, flags);
  const moonPos = await swe_calc_ut(sunriseJD, swisseph.SE_MOON, flags);
  return { sunPos, moonPos };
}

export function computeAngaIndices(
  sunPos: { longitude: number },
  moonPos: { longitude: number }
) {
  const tithiProg = getTithiProgress(sunPos.longitude, moonPos.longitude);
  const nakProg = norm360(moonPos.longitude) / (360 / 27);
  const yogaProg = norm360(sunPos.longitude + moonPos.longitude) / (360 / 27);
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

export async function computeAngaEndTimes(
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
      return getTithiProgress(s.longitude, m.longitude);
    },
    tithiIdx % 30,
    30
  );

  const nakEndJD = await findEventEnd(
    sunriseJD,
    async (jd) => {
      const m = await swe_calc_ut(jd, swisseph.SE_MOON, flags);
      return norm360(m.longitude) / (360 / 27);
    },
    nakIdx % 27,
    27
  );

  const yogaEndJD = await findEventEnd(
    sunriseJD,
    async (jd) => {
      const s = await swe_calc_ut(jd, swisseph.SE_SUN, flags);
      const m = await swe_calc_ut(jd, swisseph.SE_MOON, flags);
      return norm360(s.longitude + m.longitude) / (360 / 27);
    },
    yogaIdx % 27,
    27
  );

  const karanaEndJD = await findEventEnd(
    sunriseJD,
    async (jd) => {
      const s = await swe_calc_ut(jd, swisseph.SE_SUN, flags);
      const m = await swe_calc_ut(jd, swisseph.SE_MOON, flags);
      return getTithiProgress(s.longitude, m.longitude) * 2;
    },
    karanaIdx % 60,
    60
  );

  return { tithiEndJD, nakEndJD, yogaEndJD, karanaEndJD };
}

export async function computeNextElements(
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
        return getTithiProgress(s.longitude, m.longitude);
      },
      nextTithiIdx % 30,
      30
    );
    const nextTEnd = nextTithiEndJD ? jdToLocal(nextTithiEndJD, tz) : null;
    nextTithi = {
      number: nextTithiIdx,
      name: TITHI_NAMES[nextTithiIdx - 1] ?? "Unknown",
      paksha: nextTithiIdx <= 15 ? ("Shukla" as const) : ("Krishna" as const),
      endLocal: formatTime(nextTEnd),
      endUtcIso: formatIso(nextTEnd),
    };
  }

  if (nakEndJD && nakEndJD < nextSunriseJD) {
    const nextNakIdx = (nakIdx % 27) + 1;
    const nextNakEndJD = await findEventEnd(
      nakEndJD,
      async (jd) => {
        const m = await swe_calc_ut(jd, swisseph.SE_MOON, flags);
        return norm360(m.longitude) / (360 / 27);
      },
      nextNakIdx % 27,
      27
    );
    const nextNEnd = nextNakEndJD ? jdToLocal(nextNakEndJD, tz) : null;
    const nextMoonPos = await swe_calc_ut(nakEndJD + 0.01, swisseph.SE_MOON, flags);
    const nextPada = (Math.floor(
      (norm360(nextMoonPos.longitude) % (360 / 27)) / (360 / 108)
    ) + 1) as 1 | 2 | 3 | 4;
    nextNakshatra = {
      number: nextNakIdx,
      name: NAKSHATRA_NAMES[nextNakIdx - 1] ?? "Unknown",
      pada: nextPada,
      endLocal: formatTime(nextNEnd),
      endUtcIso: formatIso(nextNEnd),
    };
  }

  if (yogaEndJD && yogaEndJD < nextSunriseJD) {
    const nextYogaIdx = (yogaIdx % 27) + 1;
    const nextYogaEndJD = await findEventEnd(
      yogaEndJD,
      async (jd) => {
        const s = await swe_calc_ut(jd, swisseph.SE_SUN, flags);
        const m = await swe_calc_ut(jd, swisseph.SE_MOON, flags);
        return norm360(s.longitude + m.longitude) / (360 / 27);
      },
      nextYogaIdx % 27,
      27
    );
    const nextYEnd = nextYogaEndJD ? jdToLocal(nextYogaEndJD, tz) : null;
    nextYoga = {
      number: nextYogaIdx,
      name: YOGA_NAMES[nextYogaIdx - 1] ?? "Unknown",
      endLocal: formatTime(nextYEnd),
      endUtcIso: formatIso(nextYEnd),
    };
  }

  if (karanaEndJD && karanaEndJD < nextSunriseJD) {
    const nextKaranaIdx = (karanaIdx % 60) + 1;
    const nextKaranaEndJD = await findEventEnd(
      karanaEndJD,
      async (jd) => {
        const s = await swe_calc_ut(jd, swisseph.SE_SUN, flags);
        const m = await swe_calc_ut(jd, swisseph.SE_MOON, flags);
        return getTithiProgress(s.longitude, m.longitude) * 2;
      },
      nextKaranaIdx % 60,
      60
    );
    const nextKEnd = nextKaranaEndJD ? jdToLocal(nextKaranaEndJD, tz) : null;
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

  return { nextTithi, nextNakshatra, nextYoga, nextKarana };
}
