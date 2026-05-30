import * as swisseph from "swisseph";
import { swe_calc_ut, findEventEnd } from "../../utils/astro";
import { RASHI_NAMES } from "../../constants";
import { norm360, jdToLocal } from "./panchanga-utils";

export async function getSunRashi(jd: number): Promise<number | null> {
  const flags = swisseph.SEFLG_SIDEREAL | swisseph.SEFLG_SWIEPH;
  try {
    const sunPos = await swe_calc_ut(jd, swisseph.SE_SUN, flags);
    // SEFLG_SIDEREAL already applies ayanamsa — do NOT subtract again
    const sidLongitude = (sunPos.longitude + 360) % 360;
    return Math.floor(sidLongitude / 30);
  } catch {
    return null;
  }
}

export async function computeRashiTransitions(
  sunriseJD: number,
  flags: number,
  sunPos: { longitude: number },
  moonPos: { longitude: number },
  tz: string
) {
  const sunSignIdx = Math.floor(sunPos.longitude / 30);
  const moonSignIdx = Math.floor(moonPos.longitude / 30);

  // Use norm360 for wrap-safe boundary calculation (359° → 0°)
  const nextSunSignBoundary = norm360((sunSignIdx + 1) * 30);
  const nextMoonSignBoundary = norm360((moonSignIdx + 1) * 30);

  // Sun stays in one sign ~30 days, scan 35
  const sunSignEndJD = await findEventEnd(
    sunriseJD,
    async (jd) => {
      const s = await swe_calc_ut(jd, swisseph.SE_SUN, flags);
      return norm360(s.longitude);
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
      return norm360(m.longitude);
    },
    nextMoonSignBoundary,
    360,
    3
  );

  const sunSignEnd = sunSignEndJD ? jdToLocal(sunSignEndJD, tz) : null;
  const moonSignEnd = moonSignEndJD ? jdToLocal(moonSignEndJD, tz) : null;

  return {
    sunSignIdx,
    moonSignIdx,
    sunSignName: RASHI_NAMES[sunSignIdx] ?? "Unknown",
    moonSignName: RASHI_NAMES[moonSignIdx] ?? "Unknown",
    sunSignEnd,
    moonSignEnd,
  };
}

export async function computePravishte(
  sunriseJD: number,
  flags: number,
  sunSignIdx: number,
  sunriseTime: import("luxon").DateTime,
  tz: string
) {
  let lastSankrantiJD = sunriseJD;

  // Search up to 35 days back (max time in one sign)
  for (let i = 0; i < 35; i++) {
    const testJD = sunriseJD - i;
    const testSunPos = await swe_calc_ut(testJD, swisseph.SE_SUN, flags);
    const testSignIdx = Math.floor(norm360(testSunPos.longitude) / 30);

    if (testSignIdx !== sunSignIdx) {
      // Found the boundary — refine with binary search (~8.64 seconds precision)
      let low = testJD;
      let high = testJD + 1;

      while (high - low > 0.0001) {
        const mid = (low + high) / 2;
        const midSunPos = await swe_calc_ut(mid, swisseph.SE_SUN, flags);
        const midLon = norm360(midSunPos.longitude);

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

  const lastSankrantiDate = jdToLocal(lastSankrantiJD, tz);
  // Pravishte counts inclusively (Sankranti day = day 1, not day 0)
  const daysSinceSankranti =
    Math.floor(sunriseTime.diff(lastSankrantiDate, "days").days) + 1;

  return { daysSinceSankranti, lastSankrantiDate };
}
