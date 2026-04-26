"use client";

import { useState } from "react";
import { Layers } from "lucide-react";
import type { SessionData } from "./types";
import { CHART_COLORS } from "./AnalyticsWidgets";

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

interface PracticeSegment {
  practice_id: string;
  practice_name: string;
  amount: number;
}

interface MonthEntry {
  key: string;
  label: string;
  fullLabel: string;
  practices: PracticeSegment[];
  total: number;
}

function buildData(sessions: SessionData[], year: number) {
  const today = new Date();
  const isCurrentYear = year === today.getFullYear();
  const monthCount = isCurrentYear ? today.getMonth() + 1 : 12;
  const months: MonthEntry[] = Array.from({ length: monthCount }, (_, i) => {
    const d = new Date(year, i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const fullLabel = d.toLocaleDateString("nl-NL", { month: "long", year: "numeric" });

    const map = new Map<string, PracticeSegment>();
    for (const s of sessions) {
      if (!s.date.startsWith(key)) continue;
      for (const item of s.items) {
        const amount =
          item.unit === "malas"
            ? item.quantity
            : item.practice_type === "mantra_japa"
              ? item.quantity / 108
              : item.quantity;
        if (amount === 0) continue;
        const ex = map.get(item.practice_id);
        if (ex) {
          ex.amount += amount;
        } else {
          map.set(item.practice_id, {
            practice_id: item.practice_id,
            practice_name: item.practice_name,
            amount,
          });
        }
      }
    }

    const practices = Array.from(map.values()).sort((a, b) => b.amount - a.amount);
    return {
      key,
      label: MONTH_LABELS[d.getMonth()] ?? "",
      fullLabel,
      practices,
      total: practices.reduce((s, p) => s + p.amount, 0),
    };
  });

  // Stable color assignment — first appearance order
  const seen = new Map<string, { name: string; color: string }>();
  let colorIdx = 0;
  for (const m of months) {
    for (const p of m.practices) {
      if (!seen.has(p.practice_id)) {
        seen.set(p.practice_id, {
          name: p.practice_name,
          color: CHART_COLORS[colorIdx % CHART_COLORS.length]!,
        });
        colorIdx++;
      }
    }
  }

  return { months, colorMap: seen };
}

export function StackedPracticeChart({
  sessions,
  year,
}: {
  sessions: SessionData[];
  year?: number;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const { months, colorMap } = buildData(sessions, year ?? new Date().getFullYear());

  // Only render when there are 2+ distinct practices with data
  if (colorMap.size < 2) return null;

  const maxVal = Math.max(...months.map((m) => m.total), 1);
  const BAR_H = 120;

  if (months.every((m) => m.total === 0)) return null;

  return (
    <div className="bg-theme-surface-raised rounded-2xl p-5 shadow-lg">
      <div className="mb-4 flex items-center gap-2">
        <div className="bg-theme-primary-10 text-theme-primary flex items-center justify-center rounded-lg p-1.5">
          <Layers className="h-4 w-4" />
        </div>
        <h2 className="text-theme-fg text-sm font-semibold">
          Per beoefening — {year ?? new Date().getFullYear()}
        </h2>
      </div>

      {/* Bars */}
      <div className="flex items-end gap-1" style={{ height: BAR_H + 28 }}>
        {months.map((m, i) => {
          const barH =
            m.total > 0 ? Math.max(4, Math.round((m.total / maxVal) * BAR_H)) : 2;
          const isHovered = hovered === i;

          return (
            <div
              key={m.key}
              className="relative flex flex-1 flex-col items-center"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Tooltip */}
              {isHovered && m.total > 0 && (
                <div
                  className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg border px-2.5 py-1.5 shadow-lg backdrop-blur-sm"
                  style={{
                    bottom: BAR_H + 10,
                    left: "50%",
                    background: "var(--theme-glass-bg)",
                    borderColor: "var(--theme-glass-border)",
                  }}
                >
                  <div className="text-theme-fg-muted mb-1 text-[10px] whitespace-nowrap">
                    {m.fullLabel}
                  </div>
                  <div className="space-y-0.5">
                    {m.practices.map((p) => {
                      const info = colorMap.get(p.practice_id);
                      return (
                        <div
                          key={p.practice_id}
                          className="flex items-center justify-between gap-3 whitespace-nowrap"
                        >
                          <span className="flex items-center gap-1">
                            <span
                              className="h-1.5 w-1.5 shrink-0 rounded-full"
                              style={{ background: info?.color }}
                            />
                            <span className="text-theme-fg-muted max-w-[90px] truncate text-[10px]">
                              {p.practice_name}
                            </span>
                          </span>
                          <span className="text-theme-fg text-[10px] font-medium tabular-nums">
                            {p.amount % 1 === 0
                              ? p.amount.toLocaleString("nl-NL")
                              : p.amount.toLocaleString("nl-NL", {
                                  maximumFractionDigits: 1,
                                })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Bar */}
              <div
                className="flex w-full items-end justify-center"
                style={{ height: BAR_H }}
              >
                {m.total > 0 ? (
                  <div
                    className="flex w-full flex-col overflow-hidden rounded-t-md motion-safe:transition-opacity motion-safe:duration-150"
                    style={{ height: barH, opacity: isHovered ? 0.82 : 1 }}
                  >
                    {/* Smallest at top, largest at bottom — sort ascending for flex-col */}
                    {[...m.practices]
                      .sort((a, b) => a.amount - b.amount)
                      .map((p) => (
                        <div
                          key={p.practice_id}
                          style={{
                            flex: p.amount,
                            background: colorMap.get(p.practice_id)?.color,
                          }}
                        />
                      ))}
                  </div>
                ) : (
                  <div
                    className="bg-theme-fg-8 w-full rounded-t-md"
                    style={{ height: 2 }}
                  />
                )}
              </div>

              {/* Month label */}
              <span className="text-theme-fg-muted mt-1.5 text-[9px] select-none sm:text-[10px]">
                {m.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {Array.from(colorMap.entries()).map(([id, { name, color }]) => (
          <div key={id} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ background: color }}
            />
            <span className="text-theme-fg-secondary text-[11px]">{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
