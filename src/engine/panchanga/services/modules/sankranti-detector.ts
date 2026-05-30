import { getSunRashi } from "./rashi-computer";
import { jdToLocal } from "./panchanga-utils";

const SANKRANTI_NAMES = [
  "MESHA_SANKRANTI",
  "VRISHABHA_SANKRANTI",
  "MITHUNA_SANKRANTI",
  "KARKA_SANKRANTI",
  "SIMHA_SANKRANTI",
  "KANYA_SANKRANTI",
  "TULA_SANKRANTI",
  "VRISHCHIKA_SANKRANTI",
  "DHANU_SANKRANTI",
  "MAKARA_SANKRANTI",
  "KUMBHA_SANKRANTI",
  "MEENA_SANKRANTI",
];

export async function detectSankranti(
  sunriseJD: number,
  tz: string
): Promise<{ sankranti: string; time: string } | null> {
  const dayStartJD = sunriseJD;
  const dayEndJD = dayStartJD + 1;

  const rashiStart = await getSunRashi(dayStartJD);
  const rashiEnd = await getSunRashi(dayEndJD);

  if (rashiStart === null || rashiEnd === null) return null;
  if (rashiStart === rashiEnd) return null;

  // Transition detected — binary search for exact minute
  let low = dayStartJD;
  let high = dayEndJD;
  const PRECISION = 1 / (24 * 60); // 1 minute in Julian Days

  while (high - low > PRECISION) {
    const mid = (low + high) / 2;
    const rashiMid = await getSunRashi(mid);

    if (rashiMid === null) return null;

    if (rashiMid === rashiStart) {
      low = mid;
    } else {
      high = mid;
    }
  }

  const transitionJD = (low + high) / 2;
  const timeStr = jdToLocal(transitionJD, tz).toFormat("HH:mm");
  const sankranti = SANKRANTI_NAMES[rashiEnd] ?? "UNKNOWN_SANKRANTI";

  return { sankranti, time: timeStr };
}
