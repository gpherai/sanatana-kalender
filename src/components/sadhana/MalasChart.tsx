"use client";

import { useState } from "react";
import { type CalendarDay } from "./types";

// =============================================================================
// HELPERS
// =============================================================================

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

interface MonthData {
  key: string; // YYYY-MM
  label: string;
  fullLabel: string; // "januari 2026"
  malas: number;
  sessions: number;
  isCurrentMonth: boolean;
}

function buildMonthlyData(calDays: CalendarDay[]): MonthData[] {
  const today = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - 11 + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const days = calDays.filter((cd) => cd.date.startsWith(key));
    return {
      key,
      label: MONTH_LABELS[d.getMonth()] ?? "",
      fullLabel: d.toLocaleDateString("nl-NL", { month: "long", year: "numeric" }),
      malas: days.reduce((s, cd) => s + cd.total_malas, 0),
      sessions: days.reduce((s, cd) => s + cd.session_count, 0),
      isCurrentMonth:
        d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear(),
    };
  });
}

// =============================================================================
// COMPONENT
// =============================================================================

type Metric = "malas" | "sessions";

export function MalasChart({ calDays }: { calDays: CalendarDay[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [metric, setMetric] = useState<Metric>("malas");

  const data = buildMonthlyData(calDays);
  const values = data.map((m) => (metric === "malas" ? m.malas : m.sessions));
  const maxVal = Math.max(...values, 1);

  const BAR_H = 96; // px — max bar height

  return (
    <div>
      {/* Metric toggle */}
      <div className="mb-4 flex gap-1">
        {(["malas", "sessions"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMetric(m)}
            className={[
              "cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-colors",
              metric === m
                ? "bg-theme-primary text-white"
                : "text-theme-fg-muted hover:text-theme-fg bg-transparent",
            ].join(" ")}
          >
            {m === "malas" ? "Malas" : "Sessies"}
          </button>
        ))}
      </div>

      {/* Bar chart */}
      <div
        className="flex items-end gap-1"
        style={{ height: BAR_H + 28 }} /* bars + label row */
      >
        {data.map((m, i) => {
          const val = metric === "malas" ? m.malas : m.sessions;
          const barH = val > 0 ? Math.max(4, Math.round((val / maxVal) * BAR_H)) : 2;
          const isHovered = hovered === i;

          return (
            <div
              key={m.key}
              className="relative flex flex-1 flex-col items-center"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Tooltip */}
              {isHovered && (
                <div
                  className="border-theme-border text-theme-fg pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg border px-2.5 py-1.5 text-center shadow-lg backdrop-blur-sm"
                  style={{
                    bottom: BAR_H + 10,
                    left: "50%",
                    background: "var(--theme-glass-bg)",
                    borderColor: "var(--theme-glass-border)",
                  }}
                >
                  <div className="text-theme-fg-muted mb-0.5 text-[10px] whitespace-nowrap">
                    {m.fullLabel}
                  </div>
                  <div className="text-theme-fg text-sm font-semibold tabular-nums">
                    {val.toLocaleString("nl-NL")}
                    <span className="text-theme-fg-muted ml-1 text-xs font-normal">
                      {metric === "malas" ? "malas" : "sessies"}
                    </span>
                  </div>
                </div>
              )}

              {/* Bar area */}
              <div
                className="flex w-full items-end justify-center"
                style={{ height: BAR_H }}
              >
                <div
                  className={`w-full rounded-t-md motion-safe:transition-all motion-safe:duration-150 ${m.isCurrentMonth && val > 0 && !isHovered ? "bg-theme-gradient" : ""}`}
                  style={{
                    height: barH,
                    background:
                      val === 0
                        ? "color-mix(in oklch, var(--theme-fg) 8%, transparent)"
                        : isHovered
                          ? "color-mix(in oklch, var(--theme-primary) 75%, white)"
                          : m.isCurrentMonth
                            ? undefined
                            : "var(--theme-primary)",
                  }}
                />
              </div>

              {/* Month label */}
              <span className="text-theme-fg-muted mt-1.5 text-[9px] select-none sm:text-[10px]">
                {m.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Y-axis annotation */}
      <div className="text-theme-fg-muted mt-1 text-right text-xs tabular-nums">
        max {maxVal.toLocaleString("nl-NL")} {metric === "malas" ? "malas" : "sessies"}
      </div>
    </div>
  );
}
