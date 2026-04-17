import type { GrahaPosition } from "@/server/panchanga/types";

export type DashaLord =
  | "ketu"
  | "venus"
  | "sun"
  | "moon"
  | "mars"
  | "rahu"
  | "jupiter"
  | "saturn"
  | "mercury";

export interface DashaPeriod {
  lord: DashaLord;
  years: number; // full dasha duration (for proportional antardasha)
  start: Date;
  end: Date;
}

export interface AntarDasha {
  lord: DashaLord;
  start: Date;
  end: Date;
}

export const DASHA_SEQUENCE: DashaLord[] = [
  "ketu",
  "venus",
  "sun",
  "moon",
  "mars",
  "rahu",
  "jupiter",
  "saturn",
  "mercury",
];

export const DASHA_YEARS: Record<DashaLord, number> = {
  ketu: 7,
  venus: 20,
  sun: 6,
  moon: 10,
  mars: 7,
  rahu: 18,
  jupiter: 16,
  saturn: 19,
  mercury: 17,
};

export const DASHA_NAMES: Record<DashaLord, string> = {
  ketu: "Ketu",
  venus: "Shukra",
  sun: "Surya",
  moon: "Chandra",
  mars: "Mangala",
  rahu: "Rahu",
  jupiter: "Guru",
  saturn: "Shani",
  mercury: "Budha",
};

export const DASHA_SYMBOL: Record<DashaLord, string> = {
  ketu: "☋",
  venus: "♀",
  sun: "☉",
  moon: "☽",
  mars: "♂",
  rahu: "☊",
  jupiter: "♃",
  saturn: "♄",
  mercury: "☿",
};

export const DASHA_COLOR: Record<DashaLord, string> = {
  sun: "var(--theme-almanac-planet-sun)",
  moon: "var(--theme-almanac-planet-moon)",
  mars: "var(--theme-almanac-planet-mars)",
  mercury: "var(--theme-almanac-planet-mercury)",
  jupiter: "var(--theme-almanac-planet-jupiter)",
  venus: "var(--theme-almanac-planet-venus)",
  saturn: "var(--theme-almanac-planet-saturn)",
  rahu: "var(--theme-fg-muted)",
  ketu: "var(--theme-fg-muted)",
};

const NAKSHATRA_SPAN = 360 / 27;
const TOTAL_YEARS = 120;

function addMs(date: Date, ms: number): Date {
  return new Date(date.getTime() + ms);
}

function yearsToMs(years: number): number {
  return years * 365.25 * 24 * 3600 * 1000;
}

export function calcVimshottari(moon: GrahaPosition, birthDate: Date): DashaPeriod[] {
  const nakshatraNum = moon.nakshatra.number; // 1-27
  const lordIdx = (nakshatraNum - 1) % 9;

  const nakshatraStart = (nakshatraNum - 1) * NAKSHATRA_SPAN;
  const posInNakshatra = moon.longitude - nakshatraStart;
  const elapsedFraction = Math.min(1, Math.max(0, posInNakshatra / NAKSHATRA_SPAN));
  const remainingFraction = 1 - elapsedFraction;

  const periods: DashaPeriod[] = [];
  let cursor = new Date(birthDate);

  // First dasha: only the remaining portion (from birth)
  const firstLord = DASHA_SEQUENCE[lordIdx]!;
  const firstFullYears = DASHA_YEARS[firstLord]!;
  const firstMs = yearsToMs(firstFullYears * remainingFraction);
  const firstEnd = addMs(cursor, firstMs);
  periods.push({
    lord: firstLord,
    years: firstFullYears,
    start: new Date(cursor),
    end: firstEnd,
  });
  cursor = firstEnd;

  // Remaining 8 dashas (full periods)
  for (let i = 1; i <= 8; i++) {
    const lord = DASHA_SEQUENCE[(lordIdx + i) % 9]!;
    const years = DASHA_YEARS[lord]!;
    const end = addMs(cursor, yearsToMs(years));
    periods.push({ lord, years, start: new Date(cursor), end });
    cursor = end;
  }

  return periods;
}

export function calcAntardasha(period: DashaPeriod): AntarDasha[] {
  const lordIdx = DASHA_SEQUENCE.indexOf(period.lord);
  const totalMs = period.end.getTime() - period.start.getTime();
  const antars: AntarDasha[] = [];
  let cursor = new Date(period.start);

  for (let i = 0; i < 9; i++) {
    const antarLord = DASHA_SEQUENCE[(lordIdx + i) % 9]!;
    const ms = totalMs * (DASHA_YEARS[antarLord]! / TOTAL_YEARS);
    const end = addMs(cursor, ms);
    antars.push({ lord: antarLord, start: new Date(cursor), end });
    cursor = end;
  }

  return antars;
}
