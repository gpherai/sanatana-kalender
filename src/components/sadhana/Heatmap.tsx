"use client";

import { useState } from "react";
import {
  type CalendarDay,
  type HeatmapCell,
  type DayInfoMap,
  localDateString,
  formatDate,
  MOON_PHASE_EMOJI,
} from "./types";

// =============================================================================
// HELPERS
// =============================================================================

export function buildHeatmap(calendarDays: CalendarDay[], days = 364): HeatmapCell[][] {
  const map = new Map(calendarDays.map((d) => [d.date, d.total_malas]));
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const start = new Date(todayDate);
  start.setDate(start.getDate() - days);
  const dow = start.getDay();
  start.setDate(start.getDate() - (dow === 0 ? 6 : dow - 1));
  const weeks: HeatmapCell[][] = [];
  const cur = new Date(start);
  while (cur <= todayDate) {
    const week: HeatmapCell[] = [];
    for (let d = 0; d < 7; d++) {
      if (cur > todayDate) {
        week.push(null);
      } else {
        const ds = localDateString(cur);
        week.push({ date: ds, malas: map.get(ds) ?? 0 });
      }
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

function heatColor(malas: number): string {
  if (malas < 4) return "color-mix(in oklch, var(--theme-primary) 28%, transparent)";
  if (malas < 8) return "color-mix(in oklch, var(--theme-primary) 52%, transparent)";
  if (malas < 12) return "color-mix(in oklch, var(--theme-primary) 75%, transparent)";
  return "var(--theme-primary)";
}

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mrt",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Okt",
  "Nov",
  "Dec",
];
const DAY_LABELS = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

// =============================================================================
// HELPERS
// =============================================================================

function dayLabel(info: DayInfoMap extends Map<string, infer V> ? V : never): string {
  const moonEmoji = info.moonPhaseEvent ? MOON_PHASE_EMOJI[info.moonPhaseEvent.type] : "";
  if (info.specialDay) {
    const tithi = info.tithi ? ` · ${info.tithi.paksha} ${info.tithi.name}` : "";
    return `${info.specialDay.emoji} ${info.specialDay.name}${tithi}`;
  }
  if (info.tithi)
    return `${moonEmoji ? moonEmoji + " " : ""}${info.tithi.paksha} ${info.tithi.name}`;
  if (moonEmoji) return moonEmoji;
  return "";
}

// =============================================================================
// COMPONENT
// =============================================================================

export function Heatmap({
  weeks,
  cellSize = 12,
  dayInfoMap,
}: {
  weeks: HeatmapCell[][];
  cellSize?: number;
  dayInfoMap?: DayInfoMap;
}) {
  const [tapped, setTapped] = useState<{ date: string; malas: number } | null>(null);
  const colWidth = cellSize + 2; // cell + gap-0.5 (2px)
  const labelWidth = cellSize === 10 ? 20 : 26;
  const labelFontSize = cellSize === 10 ? 9 : 10;
  const dotSize = cellSize <= 10 ? 2 : 3;

  const monthPositions: { month: number; col: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, i) => {
    const first = week.find((c) => c !== null);
    if (!first) return;
    const m = new Date(first.date + "T00:00:00").getMonth();
    if (m !== lastMonth) {
      monthPositions.push({ month: m, col: i });
      lastMonth = m;
    }
  });

  const tappedInfo = tapped ? dayInfoMap?.get(tapped.date) : undefined;
  const tappedLabel = tappedInfo ? dayLabel(tappedInfo) : null;

  return (
    <div className="overflow-x-auto">
      <div style={{ display: "inline-block" }}>
        <div className="mb-1 flex" style={{ paddingLeft: labelWidth + 4 }}>
          {weeks.map((_, i) => {
            const mp = monthPositions.find((p) => p.col === i);
            return (
              <div key={i} style={{ width: colWidth, flexShrink: 0 }}>
                {mp && (
                  <span
                    className="text-theme-fg-muted"
                    style={{ fontSize: labelFontSize, whiteSpace: "nowrap" }}
                  >
                    {MONTH_LABELS[mp.month]}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex gap-0.5">
          <div className="flex flex-col gap-0.5" style={{ marginRight: 4 }}>
            {DAY_LABELS.map((d) => (
              <div
                key={d}
                className="text-theme-fg-muted flex items-center justify-end"
                style={{ height: cellSize, width: labelWidth, fontSize: 9 }}
              >
                {d}
              </div>
            ))}
          </div>
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-0.5">
              {week.map((cell, di) => {
                if (cell === null) {
                  return <div key={di} style={{ width: cellSize, height: cellSize }} />;
                }
                const info = dayInfoMap?.get(cell.date);
                const isSpecial = !!(info?.specialDay || info?.moonPhaseEvent);
                const label = info ? dayLabel(info) : "";
                return (
                  <div
                    key={di}
                    className="relative cursor-pointer rounded-sm motion-safe:transition-colors"
                    style={{
                      width: cellSize,
                      height: cellSize,
                      background:
                        cell.malas === 0
                          ? "color-mix(in oklch, var(--theme-fg) 10%, transparent)"
                          : heatColor(cell.malas),
                    }}
                    title={`${formatDate(cell.date)}: ${cell.malas} malas${label ? ` · ${label}` : ""}`}
                    onClick={() =>
                      setTapped((prev) =>
                        prev?.date === cell.date
                          ? null
                          : { date: cell.date, malas: cell.malas }
                      )
                    }
                  >
                    {isSpecial && (
                      <span
                        className="absolute rounded-full bg-white/70"
                        style={{ width: dotSize, height: dotSize, bottom: 1, right: 1 }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        {tapped && (
          <div className="text-theme-fg-secondary mt-2 text-xs">
            {formatDate(tapped.date)}:{" "}
            <span className="text-theme-fg font-medium">{tapped.malas} malas</span>
            {tappedLabel && <span className="text-theme-fg-muted"> · {tappedLabel}</span>}
          </div>
        )}
        <div className="text-theme-fg-muted mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          {[
            { m: 0, label: "0" },
            { m: 2, label: "1–3" },
            { m: 5, label: "4–7" },
            { m: 9, label: "8–11" },
            { m: 14, label: "≥12" },
          ].map(({ m, label }) => (
            <div key={label} className="flex items-center gap-1">
              <div
                className="rounded-sm"
                style={{
                  width: cellSize,
                  height: cellSize,
                  background:
                    m === 0
                      ? "color-mix(in oklch, var(--theme-fg) 10%, transparent)"
                      : heatColor(m),
                }}
              />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
