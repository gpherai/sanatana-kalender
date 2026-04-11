"use client";

import { cn } from "@/lib/utils";
import type { BirthChart, GrahaKey } from "@/server/panchanga/types";

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * South Indian chart: rashis are fixed to grid positions.
 * Top row starts at Meena (12), moves clockwise.
 * [row, col] — 1-indexed, matching CSS grid-row / grid-column.
 */
const SOUTH_INDIAN_POS: Record<number, [number, number]> = {
  12: [1, 1],
  1: [1, 2],
  2: [1, 3],
  3: [1, 4],
  11: [2, 1],
  4: [2, 4],
  10: [3, 1],
  5: [3, 4],
  9: [4, 1],
  8: [4, 2],
  7: [4, 3],
  6: [4, 4],
};

const RASHI_NAMES: Record<number, string> = {
  1: "Mesha",
  2: "Vrishabha",
  3: "Mithuna",
  4: "Karka",
  5: "Simha",
  6: "Kanya",
  7: "Tula",
  8: "Vrishchika",
  9: "Dhanu",
  10: "Makara",
  11: "Kumbha",
  12: "Meena",
};

const GRAHA_SYMBOL: Record<GrahaKey, string> = {
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

const GRAHA_SHORT: Record<GrahaKey, string> = {
  surya: "Su",
  chandra: "Ch",
  mangala: "Ma",
  budha: "Bu",
  guru: "Gu",
  shukra: "Sk",
  shani: "Sh",
  rahu: "Ra",
  ketu: "Ke",
  uranus: "Ur",
  neptune: "Ne",
  pluto: "Pl",
};

const GRAHA_COLOR: Record<GrahaKey, string> = {
  surya: "var(--theme-almanac-planet-sun)",
  chandra: "var(--theme-almanac-planet-moon)",
  mangala: "var(--theme-almanac-planet-mars)",
  budha: "var(--theme-almanac-planet-mercury)",
  guru: "var(--theme-almanac-planet-jupiter)",
  shukra: "var(--theme-almanac-planet-venus)",
  shani: "var(--theme-almanac-planet-saturn)",
  rahu: "var(--theme-fg-muted)",
  ketu: "var(--theme-fg-muted)",
  uranus: "var(--theme-fg-subtle)",
  neptune: "var(--theme-fg-subtle)",
  pluto: "var(--theme-fg-subtle)",
};

/** Canonical display order within a cell (by tradition) */
const GRAHA_ORDER: GrahaKey[] = [
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

const TRADITIONAL = new Set<GrahaKey>([
  "surya",
  "chandra",
  "mangala",
  "budha",
  "guru",
  "shukra",
  "shani",
  "rahu",
  "ketu",
]);

// =============================================================================
// RASHI CELL
// =============================================================================

interface CellGraha {
  key: GrahaKey;
  retrograde: boolean;
  degreeInRashi: number;
}

interface RashiCellProps {
  rashiNum: number;
  grahas: CellGraha[];
  isLagna: boolean;
  style: React.CSSProperties;
}

function RashiCell({ rashiNum, grahas, isLagna, style }: RashiCellProps) {
  const sorted = [...grahas].sort((a, b) => a.degreeInRashi - b.degreeInRashi);

  return (
    <div
      className={cn(
        "border-theme-border relative flex flex-col overflow-hidden border p-1",
        "transition-colors duration-150"
      )}
      style={{
        ...style,
        ...(isLagna
          ? {
              background:
                "color-mix(in oklch, var(--theme-primary) 10%, var(--theme-surface))",
              boxShadow: "inset 0 0 0 1.5px var(--theme-primary)",
            }
          : { background: "var(--theme-surface)" }),
      }}
    >
      {/* Rashi number + Asc marker */}
      <div className="flex items-start justify-between">
        <span className="text-theme-fg-muted font-mono text-[9px] leading-tight">
          {rashiNum}
        </span>
        {isLagna && (
          <span
            className="text-[8px] leading-tight font-bold"
            style={{ color: "var(--theme-primary)" }}
          >
            Asc
          </span>
        )}
      </div>

      {/* Rashi name */}
      <span className="text-theme-fg-muted mb-0.5 truncate text-[8px] leading-tight">
        {RASHI_NAMES[rashiNum]}
      </span>

      {/* Grahas */}
      <div className="flex min-h-0 flex-1 flex-col gap-px">
        {sorted.map(({ key, retrograde }) => {
          const isTraditional = TRADITIONAL.has(key);
          return (
            <div
              key={key}
              className={cn(
                "flex items-baseline gap-px leading-tight",
                !isTraditional && "opacity-40"
              )}
              style={{ color: GRAHA_COLOR[key] }}
            >
              <span className={isTraditional ? "text-[11px]" : "text-[9px]"}>
                {GRAHA_SYMBOL[key]}
              </span>
              <span
                className={cn(
                  "font-medium",
                  isTraditional ? "text-[10px]" : "text-[9px]"
                )}
              >
                {GRAHA_SHORT[key]}
              </span>
              {retrograde && (
                <span
                  className="text-[8px] opacity-70"
                  style={{ color: "var(--theme-fg-muted)" }}
                  title="Retrograde"
                >
                  ᴿ
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// KUNDALI CHART
// =============================================================================

interface KundaliChartProps {
  chart: BirthChart;
}

export function KundaliChart({ chart }: KundaliChartProps) {
  // Build rashi → grahas map
  const rashiGrahas: Record<number, CellGraha[]> = {};
  for (let i = 1; i <= 12; i++) rashiGrahas[i] = [];

  for (const key of GRAHA_ORDER) {
    const g = chart.grahas[key];
    if (!g) continue;
    rashiGrahas[g.rashi.number]!.push({
      key,
      retrograde: g.retrograde,
      degreeInRashi: g.degreeInRashi,
    });
  }

  const lagnaRashi = chart.lagna.rashi.number;

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
      {/* 12 rashi cells — explicitly placed in the grid */}
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

      {/* Center 2×2 — lagna summary */}
      <div
        className="border-theme-border flex flex-col items-center justify-center border bg-[var(--theme-surface-raised)]"
        style={{ gridRow: "2/4", gridColumn: "2/4" }}
      >
        <span
          className="text-[9px] font-semibold tracking-widest uppercase"
          style={{ color: "var(--theme-fg-muted)" }}
        >
          Kundali
        </span>
        <span
          className="mt-1 text-center text-sm leading-tight font-bold"
          style={{ color: "var(--theme-fg)" }}
        >
          {chart.lagna.rashi.name}
        </span>
        <span className="text-[9px]" style={{ color: "var(--theme-fg-muted)" }}>
          Lagna
        </span>
        <span className="mt-1.5 text-[9px]" style={{ color: "var(--theme-fg-subtle)" }}>
          {chart.lagna.degreeInRashi.toFixed(1)}°
        </span>
      </div>
    </div>
  );
}
