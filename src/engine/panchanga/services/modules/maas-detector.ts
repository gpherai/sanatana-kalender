import * as swisseph from "swisseph";
import { swe_calc_ut, findEventEnd } from "../../utils/astro";
import { LUNAR_MASA_NAMES } from "../../constants";
import { getTithiProgress } from "./panchanga-utils";
import { getSunRashi } from "./rashi-computer";

export async function findNearestAmavasya(
  fromJD: number,
  direction: "backward" | "forward"
): Promise<number | null> {
  const flags = swisseph.SEFLG_SIDEREAL | swisseph.SEFLG_SWIEPH;
  const searchDirection = direction === "forward" ? 1 : -1;

  // Start at offset 1 to skip current day and guarantee backward < fromJD, forward > fromJD
  for (let dayOffset = 1; dayOffset < 60; dayOffset++) {
    const searchDayJD = fromJD + searchDirection * dayOffset;

    const sunAtDay = await swe_calc_ut(searchDayJD, swisseph.SE_SUN, flags);
    const moonAtDay = await swe_calc_ut(searchDayJD, swisseph.SE_MOON, flags);
    const tithiAtDay =
      Math.floor(getTithiProgress(sunAtDay.longitude, moonAtDay.longitude)) + 1;

    // If near Amavasya (tithi 28-30 or 1-2), find exact conjunction
    if (tithiAtDay >= 28 || tithiAtDay <= 2) {
      const getElongationProgress = async (jd: number) => {
        const s = await swe_calc_ut(jd, swisseph.SE_SUN, flags);
        const m = await swe_calc_ut(jd, swisseph.SE_MOON, flags);
        return getTithiProgress(s.longitude, m.longitude);
      };

      // Phase 1: find Amavasya start (tithi 29 ends = 348° elongation)
      const amavasyaStart = await findEventEnd(
        searchDayJD - 1,
        getElongationProgress,
        29,
        30
      );
      if (!amavasyaStart) continue;

      // Phase 2: find actual new moon conjunction (0°/360° = Amavasya ends).
      // DP evaluates Sun rashi at conjunction, not Amavasya start.
      const conjunction = await findEventEnd(
        amavasyaStart,
        getElongationProgress,
        30,
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

  return null;
}

export async function computeMaasData(
  sunriseJD: number,
  tithiIdx: number,
  sunSignIdx: number
) {
  const prevAmavasya = await findNearestAmavasya(sunriseJD, "backward");
  const nextAmavasya = await findNearestAmavasya(sunriseJD, "forward");

  const rashiAtPrevAmavasya = prevAmavasya ? await getSunRashi(prevAmavasya) : null;
  const rashiAtNextAmavasya = nextAmavasya ? await getSunRashi(nextAmavasya) : null;

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
