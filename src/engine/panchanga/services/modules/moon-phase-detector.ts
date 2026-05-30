import { DateTime } from "luxon";
import * as swisseph from "swisseph";
import { swe_calc_ut, swe_julday } from "../../utils/astro";
import type { LocationConfig } from "../../types";
import { jdToLocal } from "./panchanga-utils";

const PHASES: Array<{
  type: "new" | "first_quarter" | "full" | "last_quarter";
  target: number;
}> = [
  { type: "first_quarter", target: 90 },
  { type: "full", target: 180 },
  { type: "last_quarter", target: 270 },
  { type: "new", target: 0 }, // wrap-around case — checked last
];

export async function detectMoonPhaseEvent(
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
  const dayEndJD = dayStartJD + 1;

  const e1 = await getElongation(dayStartJD);
  const e2 = await getElongation(dayEndJD);

  for (const { type, target } of PHASES) {
    const crossed =
      target === 0
        ? e1 > 340 && e2 < 15 // elongation wraps 360° → 0°; margins cover full 12°/day motion
        : e1 < target && e2 >= target;

    if (!crossed) continue;

    // Binary search for exact Julian Day (30 iterations ≈ millisecond precision)
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
    const eventDt = jdToLocal(eventJD, loc.tz);

    return {
      type,
      timeLocal: eventDt.toFormat("HH:mm"),
      timeUtcIso: eventDt.toUTC().toISO() ?? "",
    };
  }

  return null;
}
