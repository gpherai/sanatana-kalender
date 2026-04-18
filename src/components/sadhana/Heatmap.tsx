"use client";

import { useState } from "react";
import {
  type CalendarDay,
  type HeatmapCell,
  type DayInfoMap,
  localDateString,
  formatDate,
  dayContextLabel,
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
  if (malas < 4) return "var(--theme-heatmap-1)";
  if (malas < 8) return "var(--theme-heatmap-2)";
  if (malas < 12) return "var(--theme-heatmap-3)";
  return "var(--theme-heatmap-4)";
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
// COMPONENT
// =============================================================================

type HeatmapEvent = { id: string; title: string };

export function Heatmap({
  weeks,
  cellSize,
  dayInfoMap,
  eventsByDate,
  onEventClick,
}: {
  weeks: HeatmapCell[][];
  cellSize?: number; // if omitted → fill container width
  dayInfoMap?: DayInfoMap;
  eventsByDate?: Map<string, HeatmapEvent[]>;
  onEventClick?: (id: string) => void;
}) {
  const [tapped, setTapped] = useState<{ date: string; malas: number } | null>(null);

  const fill = cellSize === undefined;
  const cs = cellSize ?? 12; // used only for legend + dot sizing when fill=false
  const dotSize = cs <= 10 ? 2 : 3;
  const labelW = cs === 10 ? 20 : 26;

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
  const tappedLabel = tappedInfo ? dayContextLabel(tappedInfo) : null;
  const tappedEvents: HeatmapEvent[] = tapped
    ? (eventsByDate?.get(tapped.date) ?? [])
    : [];

  if (fill) {
    // Responsive fill mode — cells grow to fill available width
    const LABEL_W = 28; // px, fixed column for day labels
    return (
      <div className="w-full">
        {/* Month labels row */}
        <div className="mb-1 flex" style={{ paddingLeft: LABEL_W + 4 }}>
          {weeks.map((_, i) => {
            const mp = monthPositions.find((p) => p.col === i);
            return (
              <div key={i} className="min-w-0 flex-1">
                {mp && (
                  <span className="text-theme-fg-muted text-[10px] whitespace-nowrap">
                    {MONTH_LABELS[mp.month]}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Grid: day labels + week columns */}
        <div className="flex gap-0.5">
          {/* Day labels */}
          <div
            className="flex shrink-0 flex-col gap-0.5"
            style={{ width: LABEL_W, marginRight: 4 }}
          >
            {DAY_LABELS.map((d) => (
              <div
                key={d}
                className="text-theme-fg-muted flex items-center justify-end text-[9px]"
                style={{ aspectRatio: "1 / 1" }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Week columns */}
          {weeks.map((week, wi) => (
            <div key={wi} className="flex min-w-0 flex-1 flex-col gap-0.5">
              {week.map((cell, di) => {
                if (cell === null) {
                  return (
                    <div key={di} className="w-full" style={{ aspectRatio: "1 / 1" }} />
                  );
                }
                const info = dayInfoMap?.get(cell.date);
                const isSpecial = !!(info?.specialDay || info?.moonPhaseEvent);
                const label = info ? dayContextLabel(info) : "";
                const cellEvents = eventsByDate?.get(cell.date) ?? [];
                const hasEvents = cellEvents.length > 0;
                const eventsTip = cellEvents.length
                  ? ` · ${cellEvents.map((e) => e.title).join(", ")}`
                  : "";
                return (
                  <div
                    key={di}
                    className="relative w-full cursor-pointer rounded motion-safe:transition-colors"
                    style={{
                      aspectRatio: "1 / 1",
                      background:
                        cell.malas === 0
                          ? "var(--theme-heatmap-empty)"
                          : heatColor(cell.malas),
                    }}
                    title={`${formatDate(cell.date)}: ${cell.malas} malas${label ? ` · ${label}` : ""}${eventsTip}`}
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
                        style={{ width: 3, height: 3, bottom: 1, right: 1 }}
                      />
                    )}
                    {hasEvents && (
                      <span
                        className="absolute rounded-full"
                        style={{
                          width: 3,
                          height: 3,
                          top: 1,
                          left: 1,
                          background: "var(--theme-primary)",
                          opacity: 0.9,
                        }}
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
            {tappedEvents.length > 0 && (
              <span>
                {tappedEvents.map((ev, i) => (
                  <span key={ev.id}>
                    {i === 0 ? " · " : ", "}
                    {onEventClick ? (
                      <button
                        onClick={() => onEventClick(ev.id)}
                        className="text-theme-primary cursor-pointer underline-offset-2 hover:underline"
                      >
                        {ev.title}
                      </button>
                    ) : (
                      <span className="text-theme-primary">{ev.title}</span>
                    )}
                  </span>
                ))}
              </span>
            )}
          </div>
        )}

        {/* Legend */}
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
                className="rounded"
                style={{
                  width: 12,
                  height: 12,
                  background: m === 0 ? "var(--theme-heatmap-empty)" : heatColor(m),
                }}
              />
              <span>{label}</span>
            </div>
          ))}
          {eventsByDate && eventsByDate.size > 0 && (
            <div className="flex items-center gap-1">
              <div
                className="relative rounded"
                style={{
                  width: 12,
                  height: 12,
                  background: "var(--theme-heatmap-empty)",
                }}
              >
                <span
                  className="absolute rounded-full"
                  style={{
                    width: 3,
                    height: 3,
                    top: 1,
                    left: 1,
                    background: "var(--theme-primary)",
                  }}
                />
              </div>
              <span>festival</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Fixed cell-size mode (legacy / mobile explicit size)
  const colWidth = cs + 2;
  return (
    <div className="overflow-x-auto">
      <div style={{ display: "inline-block" }}>
        <div className="mb-1 flex" style={{ paddingLeft: labelW + 4 }}>
          {weeks.map((_, i) => {
            const mp = monthPositions.find((p) => p.col === i);
            return (
              <div key={i} style={{ width: colWidth, flexShrink: 0 }}>
                {mp && (
                  <span
                    className="text-theme-fg-muted"
                    style={{ fontSize: 10, whiteSpace: "nowrap" }}
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
                style={{ height: cs, width: labelW, fontSize: 9 }}
              >
                {d}
              </div>
            ))}
          </div>
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-0.5">
              {week.map((cell, di) => {
                if (cell === null) {
                  return <div key={di} style={{ width: cs, height: cs }} />;
                }
                const info = dayInfoMap?.get(cell.date);
                const isSpecial = !!(info?.specialDay || info?.moonPhaseEvent);
                const label = info ? dayContextLabel(info) : "";
                const cellEvents = eventsByDate?.get(cell.date) ?? [];
                const hasEvents = cellEvents.length > 0;
                const eventsTip = cellEvents.length
                  ? ` · ${cellEvents.map((e) => e.title).join(", ")}`
                  : "";
                return (
                  <div
                    key={di}
                    className="relative cursor-pointer rounded motion-safe:transition-colors"
                    style={{
                      width: cs,
                      height: cs,
                      background:
                        cell.malas === 0
                          ? "var(--theme-heatmap-empty)"
                          : heatColor(cell.malas),
                    }}
                    title={`${formatDate(cell.date)}: ${cell.malas} malas${label ? ` · ${label}` : ""}${eventsTip}`}
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
                    {hasEvents && (
                      <span
                        className="absolute rounded-full"
                        style={{
                          width: dotSize,
                          height: dotSize,
                          top: 1,
                          left: 1,
                          background: "var(--theme-primary)",
                          opacity: 0.9,
                        }}
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
            {tappedEvents.length > 0 && (
              <span>
                {tappedEvents.map((ev, i) => (
                  <span key={ev.id}>
                    {i === 0 ? " · " : ", "}
                    {onEventClick ? (
                      <button
                        onClick={() => onEventClick(ev.id)}
                        className="text-theme-primary cursor-pointer underline-offset-2 hover:underline"
                      >
                        {ev.title}
                      </button>
                    ) : (
                      <span className="text-theme-primary">{ev.title}</span>
                    )}
                  </span>
                ))}
              </span>
            )}
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
                className="rounded"
                style={{
                  width: cs,
                  height: cs,
                  background: m === 0 ? "var(--theme-heatmap-empty)" : heatColor(m),
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
