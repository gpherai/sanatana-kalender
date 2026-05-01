"use client";

import type { BirthChart, GrahaKey } from "@/engine/panchanga/types";
import {
  type CellGraha,
  GRAHA_ORDER,
  SOUTH_INDIAN_POS,
  RASHI_NAMES,
  RashiCell,
} from "./KundaliChart";

const DASHAMSHA_SPAN = 3; // 30° / 10 padas
const norm360 = (x: number): number => ((x % 360) + 360) % 360;

/**
 * D10 rashi (1-12) for a given sidereal longitude.
 * Odd rashis: count padas from the same rashi.
 * Even rashis: count padas from the 9th rashi (= rashi + 8).
 */
export function dashamshaRashi(longitude: number): number {
  const normalized = norm360(longitude);
  const rashi = Math.floor(normalized / 30) + 1; // 1-12
  const degInRashi = normalized % 30;
  const pada = Math.floor(degInRashi / DASHAMSHA_SPAN); // 0-9
  const isOdd = rashi % 2 === 1;
  const startOffset = isOdd ? rashi - 1 : rashi + 7;
  return ((startOffset + pada) % 12) + 1;
}

/** Degree within the D10 rashi (0-30) */
export function dashamshaDegree(longitude: number): number {
  const degInRashi = norm360(longitude) % 30;
  return (degInRashi % DASHAMSHA_SPAN) * 10;
}

export function DashamshaChart({ chart }: { chart: BirthChart }) {
  const rashiGrahas: Record<number, CellGraha[]> = {};
  for (let i = 1; i <= 12; i++) rashiGrahas[i] = [];

  for (const key of GRAHA_ORDER) {
    const g = chart.grahas[key as GrahaKey];
    if (!g) continue;
    const nr = dashamshaRashi(g.longitude);
    rashiGrahas[nr]!.push({
      key: key as GrahaKey,
      retrograde: g.retrograde,
      degreeInRashi: dashamshaDegree(g.longitude),
    });
  }

  const lagnaRashi = dashamshaRashi(chart.lagna.longitude);

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

      {/* Center 2×2 — D10 label */}
      <div
        className="border-theme-border flex flex-col items-center justify-center border bg-[var(--theme-surface-raised)]"
        style={{ gridRow: "2/4", gridColumn: "2/4" }}
      >
        <span
          className="text-[10px] font-semibold tracking-widest uppercase"
          style={{ color: "var(--theme-fg-muted)" }}
        >
          D10
        </span>
        <span
          className="mt-1.5 text-center text-base leading-tight font-bold"
          style={{ color: "var(--theme-fg)" }}
        >
          {RASHI_NAMES[lagnaRashi]}
        </span>
        <span className="mt-0.5 text-xs" style={{ color: "var(--theme-fg-muted)" }}>
          Dashamsha
        </span>
      </div>
    </div>
  );
}
