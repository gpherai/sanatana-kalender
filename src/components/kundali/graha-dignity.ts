export type Dignity = "uchcha" | "neecha" | "moolatrikona" | "swarashi" | null;

interface DignityData {
  uchcha: number;
  uchchaDeg: number;
  neecha: number;
  swarashi: number[];
  moolatrikona?: { rashi: number; from: number; to: number };
}

const DIGNITY: Record<string, DignityData> = {
  surya: {
    uchcha: 1,
    uchchaDeg: 10,
    neecha: 7,
    swarashi: [5],
    moolatrikona: { rashi: 5, from: 0, to: 20 },
  },
  chandra: {
    uchcha: 2,
    uchchaDeg: 3,
    neecha: 8,
    swarashi: [4],
    moolatrikona: { rashi: 2, from: 4, to: 30 },
  },
  mangala: {
    uchcha: 10,
    uchchaDeg: 28,
    neecha: 4,
    swarashi: [1, 8],
    moolatrikona: { rashi: 1, from: 0, to: 12 },
  },
  budha: {
    uchcha: 6,
    uchchaDeg: 15,
    neecha: 12,
    swarashi: [3, 6],
    moolatrikona: { rashi: 6, from: 15, to: 20 },
  },
  guru: {
    uchcha: 4,
    uchchaDeg: 5,
    neecha: 10,
    swarashi: [9, 12],
    moolatrikona: { rashi: 9, from: 0, to: 10 },
  },
  shukra: {
    uchcha: 12,
    uchchaDeg: 27,
    neecha: 6,
    swarashi: [2, 7],
    moolatrikona: { rashi: 7, from: 0, to: 15 },
  },
  shani: {
    uchcha: 7,
    uchchaDeg: 20,
    neecha: 1,
    swarashi: [10, 11],
    moolatrikona: { rashi: 11, from: 0, to: 20 },
  },
};

export function getGrahaDignity(
  grahaKey: string,
  rashiNum: number,
  degreeInRashi: number
): Dignity {
  const d = DIGNITY[grahaKey];
  if (!d) return null;

  if (rashiNum === d.neecha) return "neecha";
  if (
    d.moolatrikona &&
    rashiNum === d.moolatrikona.rashi &&
    degreeInRashi >= d.moolatrikona.from &&
    degreeInRashi < d.moolatrikona.to
  )
    return "moolatrikona";
  if (rashiNum === d.uchcha) return "uchcha";
  if (d.swarashi.includes(rashiNum)) return "swarashi";
  return null;
}

export const DIGNITY_LABEL: Record<NonNullable<Dignity>, string> = {
  uchcha: "Uchcha",
  neecha: "Neecha",
  moolatrikona: "Mūlatrik.",
  swarashi: "Swarashi",
};

// =============================================================================
// GRAHA DISPLAY CONFIG
// =============================================================================

import type { GrahaKey } from "@/engine/panchanga/types";

export const GRAHA_ORDER: GrahaKey[] = [
  "surya",
  "chandra",
  "mangala",
  "budha",
  "guru",
  "shukra",
  "shani",
  "rahu",
  "ketu",
  "uranus",
  "neptune",
  "pluto",
];

export const GRAHA_SYMBOL: Record<GrahaKey, string> = {
  surya: "☉",
  chandra: "☽",
  mangala: "♂",
  budha: "☿",
  guru: "♃",
  shukra: "♀",
  shani: "♄",
  rahu: "☊",
  ketu: "☋",
  uranus: "♅",
  neptune: "♆",
  pluto: "♇",
};

export const DIGNITY_STYLE: Record<NonNullable<Dignity>, string> = {
  uchcha: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  neecha: "bg-red-500/15 text-red-600 dark:text-red-400",
  moolatrikona: "bg-theme-primary-10 text-theme-primary",
  swarashi: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
};
