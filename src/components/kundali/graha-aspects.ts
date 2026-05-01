import type { GrahaKey, GrahaPosition } from "@/engine/panchanga/types";

// 0-indexed offsets from planet's rashi (6 = 7th house)
const ASPECT_OFFSETS: Partial<Record<GrahaKey, number[]>> = {
  surya: [6],
  chandra: [6],
  mangala: [3, 6, 7], // 4th, 7th, 8th
  budha: [6],
  guru: [4, 6, 8], // 5th, 7th, 9th
  shukra: [6],
  shani: [2, 6, 9], // 3rd, 7th, 10th
  rahu: [6],
  ketu: [6],
};

const OFFSET_LABEL: Record<number, string> = {
  2: "3e",
  3: "4e",
  4: "5e",
  6: "7e",
  7: "8e",
  8: "9e",
  9: "10e",
};

const TRADITIONAL: GrahaKey[] = [
  "surya",
  "chandra",
  "mangala",
  "budha",
  "guru",
  "shukra",
  "shani",
  "rahu",
  "ketu",
];

export interface GrahaAspect {
  aspector: GrahaKey;
  aspected: GrahaKey;
  label: string; // "7e" etc.
  isSpecial: boolean; // non-7th aspect
  isMutual: boolean; // filled in after full calc
}

export interface GrahaConjunction {
  grahas: GrahaKey[];
  rashi: number;
}

export interface AspectResult {
  aspects: GrahaAspect[];
  conjunctions: GrahaConjunction[];
}

export function calcAspects(grahas: Record<string, GrahaPosition>): AspectResult {
  const raw: Omit<GrahaAspect, "isMutual">[] = [];

  for (const aspectorKey of TRADITIONAL) {
    const offsets = ASPECT_OFFSETS[aspectorKey];
    const aspector = grahas[aspectorKey];
    if (!offsets || !aspector) continue;

    for (const offset of offsets) {
      const targetRashi = ((aspector.rashi.number - 1 + offset) % 12) + 1;

      for (const targetKey of TRADITIONAL) {
        if (targetKey === aspectorKey) continue;
        const target = grahas[targetKey];
        if (!target) continue;
        if (target.rashi.number === targetRashi) {
          raw.push({
            aspector: aspectorKey,
            aspected: targetKey,
            label: OFFSET_LABEL[offset] ?? `${offset + 1}e`,
            isSpecial: offset !== 6,
          });
        }
      }
    }
  }

  // Mark mutual aspects
  const aspects: GrahaAspect[] = raw.map((asp) => ({
    ...asp,
    isMutual: raw.some((r) => r.aspector === asp.aspected && r.aspected === asp.aspector),
  }));

  // Conjunctions: traditional planets sharing a rashi
  const rashiMap = new Map<number, GrahaKey[]>();
  for (const key of TRADITIONAL) {
    const g = grahas[key];
    if (!g) continue;
    const list = rashiMap.get(g.rashi.number) ?? [];
    list.push(key);
    rashiMap.set(g.rashi.number, list);
  }
  const conjunctions: GrahaConjunction[] = [];
  for (const [rashi, list] of rashiMap) {
    if (list.length >= 2) conjunctions.push({ grahas: list, rashi });
  }

  return { aspects, conjunctions };
}
