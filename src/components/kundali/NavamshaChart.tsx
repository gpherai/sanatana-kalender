"use client";

import type { BirthChart, GrahaKey } from "@/engine/panchanga/types";
import {
  CellGraha,
  GRAHA_ORDER,
  SOUTH_INDIAN_POS,
  RASHI_NAMES,
  RashiCell,
} from "./KundaliChart";

const NAVAMSHA_SPAN = 30 / 9;
const norm360 = (x: number): number => ((x % 360) + 360) % 360;

export function navamshaRashi(longitude: number): number {
  const normalized = norm360(longitude);
  const rashi = Math.floor(normalized / 30) + 1; // 1-12
  const degInRashi = normalized % 30;
  const pada = Math.floor(degInRashi / NAVAMSHA_SPAN); // 0-8

  const startRashi = [1, 5, 9].includes(rashi)
    ? 1 // Fire → Mesha
    : [2, 6, 10].includes(rashi)
      ? 10 // Earth → Makara
      : [3, 7, 11].includes(rashi)
        ? 7 // Air → Tula
        : 4; // Water → Karka

  return ((startRashi - 1 + pada) % 12) + 1;
}

export function navamshaDegree(longitude: number): number {
  const degInRashi = norm360(longitude) % 30;
  return (degInRashi % NAVAMSHA_SPAN) * 9;
}

export function NavamshaChart({ chart }: { chart: BirthChart }) {
  const rashiGrahas: Record<number, CellGraha[]> = {};
  for (let i = 1; i <= 12; i++) rashiGrahas[i] = [];

  for (const key of GRAHA_ORDER) {
    const g = chart.grahas[key as GrahaKey];
    if (!g) continue;
    const nr = navamshaRashi(g.longitude);
    rashiGrahas[nr]!.push({
      key: key as GrahaKey,
      retrograde: g.retrograde,
      degreeInRashi: navamshaDegree(g.longitude),
    });
  }

  const lagnaRashi = navamshaRashi(chart.lagna.longitude);

  return (
    <div
      className="border-theme-border overflow-hidden rounded-xl border shadow"
      style={{
        aspectRatio: "1",
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gridTemplateRows: "repeat(4, 1fr)",
      }}
    >
      {(Object.entries(SOUTH_INDIAN_POS) as [string, [number, number]][]).map(
        ([rashiStr, [row, col]]) => {
          const rashiNum = Number(rashiStr);
          return (
            <RashiCell
              key={rashiNum}
              rashiNum={rashiNum}
              grahas={rashiGrahas[rashiNum] ?? []}
              isLagna={rashiNum === lagnaRashi}
              style={{ gridRow: row, gridColumn: col }}
            />
          );
        }
      )}

      {/* Center 2×2 — D9 label */}
      <div
        className="border-theme-border flex flex-col items-center justify-center border bg-[var(--theme-surface-raised)]"
        style={{ gridRow: "2/4", gridColumn: "2/4" }}
      >
        <span
          className="text-[10px] font-semibold tracking-widest uppercase"
          style={{ color: "var(--theme-fg-muted)" }}
        >
          D9
        </span>
        <span
          className="mt-1.5 text-center text-base leading-tight font-bold"
          style={{ color: "var(--theme-fg)" }}
        >
          {RASHI_NAMES[lagnaRashi]}
        </span>
        <span className="mt-0.5 text-xs" style={{ color: "var(--theme-fg-muted)" }}>
          Navamsha
        </span>
      </div>
    </div>
  );
}
