"use client";

import type { BirthChart, GrahaKey } from "@/server/panchanga/types";
import {
  CellGraha,
  GRAHA_ORDER,
  SOUTH_INDIAN_POS,
  RASHI_NAMES,
  RashiCell,
} from "./KundaliChart";

function navamshaRashi(longitude: number): number {
  const rashi = Math.floor(longitude / 30) + 1; // 1-12
  const degInRashi = longitude % 30;
  const pada = Math.floor(degInRashi / (30 / 9)); // 0-8

  const startRashi = [1, 5, 9].includes(rashi)
    ? 1 // Fire → Mesha
    : [2, 6, 10].includes(rashi)
      ? 10 // Earth → Makara
      : [3, 7, 11].includes(rashi)
        ? 7 // Air → Tula
        : 4; // Water → Karka

  return ((startRashi - 1 + pada) % 12) + 1;
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
      degreeInRashi: g.degreeInRashi,
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
