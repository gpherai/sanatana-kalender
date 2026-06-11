"use client";

import { useState } from "react";
import { type CalendarDay, type SessionData } from "@/types/sadhana";
import { MALA_BEAD_COUNT } from "@/lib/domain";

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

interface PracticeMonthTotal {
  practiceId: string;
  practiceName: string;
  amount: number;
}

interface MonthData {
  key: string; // YYYY-MM
  label: string;
  fullLabel: string; // "januari 2026"
  malas: number;
  sessions: number;
  isCurrentMonth: boolean;
  practices: PracticeMonthTotal[];
}

function buildMonthlyData(
  calDays: CalendarDay[],
  sessionData: SessionData[],
  year: number
): MonthData[] {
  const today = new Date();
  const isCurrentYear = year === today.getFullYear();
  const monthCount = isCurrentYear ? today.getMonth() + 1 : 12;
  return Array.from({ length: monthCount }, (_, i) => {
    const d = new Date(year, i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const days = calDays.filter((cd) => cd.date.startsWith(key));

    // Per-practice totals from session items
    const practiceMap = new Map<string, PracticeMonthTotal>();
    for (const s of sessionData) {
      if (!s.date.startsWith(key)) continue;
      for (const item of s.items) {
        const amount =
          item.unit === "malas"
            ? item.quantity
            : item.practiceType === "mantra_japa"
              ? item.quantity / MALA_BEAD_COUNT
              : item.quantity;
        if (amount === 0) continue;
        const existing = practiceMap.get(item.practiceId);
        if (existing) {
          existing.amount += amount;
        } else {
          practiceMap.set(item.practiceId, {
            practiceId: item.practiceId,
            practiceName: item.practiceName,
            amount,
          });
        }
      }
    }

    return {
      key,
      label: MONTH_LABELS[d.getMonth()] ?? "",
      fullLabel: d.toLocaleDateString("nl-NL", { month: "long", year: "numeric" }),
      malas: days.reduce((s, cd) => s + cd.totalMalas, 0),
      sessions: days.reduce((s, cd) => s + cd.sessionCount, 0),
      isCurrentMonth:
        isCurrentYear &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear(),
      practices: Array.from(practiceMap.values()).sort((a, b) => b.amount - a.amount),
    };
  });
}

// =============================================================================
// COMPONENT
// =============================================================================

type Metric = "malas" | "sessions";

export function MalasChart({
  calDays,
  sessions = [],
  year,
}: {
  calDays: CalendarDay[];
  sessions?: SessionData[];
  year?: number;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [metric, setMetric] = useState<Metric>("malas");

  const data = buildMonthlyData(calDays, sessions, year ?? new Date().getFullYear());
  const values = data.map((m) => (metric === "malas" ? m.malas : m.sessions));
  const maxVal = Math.max(...values, 1);

  const BAR_H = 120; // px — max bar height
  const isEmpty = values.every((v) => v === 0);

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
                ? "bg-theme-primary text-theme-primary-fg"
                : "text-theme-fg-muted hover:text-theme-fg hover:bg-theme-hover bg-transparent",
            ].join(" ")}
          >
            {m === "malas" ? "Malas" : "Sessies"}
          </button>
        ))}
      </div>

      {/* Lege staat */}
      {isEmpty && (
        <div
          className="bg-theme-fg-4 flex items-center justify-center rounded-xl text-center"
          style={{ height: BAR_H + 28 }}
        >
          <p className="text-theme-fg-muted text-sm">Nog geen sessies geregistreerd.</p>
        </div>
      )}

      {/* Bar chart */}
      {!isEmpty && (
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
                    {/* Per-practice breakdown — only for malas metric */}
                    {metric === "malas" && m.practices.length > 1 && (
                      <div className="border-theme-border mt-1.5 border-t pt-1.5 text-left">
                        {m.practices.map((p) => (
                          <div
                            key={p.practiceId}
                            className="flex items-center justify-between gap-3 whitespace-nowrap"
                          >
                            <span className="text-theme-fg-muted max-w-[100px] truncate text-[10px]">
                              {p.practiceName}
                            </span>
                            <span className="text-theme-fg text-[10px] font-medium tabular-nums">
                              {p.amount % 1 === 0
                                ? p.amount.toLocaleString("nl-NL")
                                : p.amount.toLocaleString("nl-NL", {
                                    maximumFractionDigits: 1,
                                  })}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Bar area */}
                <div
                  className="flex w-full items-end justify-center"
                  style={{ height: BAR_H }}
                >
                  <div
                    className={[
                      "w-full rounded-t-md motion-safe:transition-all motion-safe:duration-150",
                      val === 0 ? "bg-theme-fg-8" : "",
                      m.isCurrentMonth && val > 0 ? "bg-theme-accent" : "",
                      isHovered && val > 0 ? "opacity-80" : "",
                    ].join(" ")}
                    style={{
                      height: barH,
                      background:
                        val === 0 || m.isCurrentMonth
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
      )}

      {/* Y-axis annotation */}
      {!isEmpty && (
        <div className="text-theme-fg-muted mt-1 text-right text-xs tabular-nums">
          max {maxVal.toLocaleString("nl-NL")} {metric === "malas" ? "malas" : "sessies"}
        </div>
      )}
    </div>
  );
}
