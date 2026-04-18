"use client";

import { useState } from "react";
import { Calendar, Flame } from "lucide-react";
import { type CalendarDay, type SessionData, type PracticeStat } from "./types";

export const CHART_COLORS = [
  "oklch(0.60 0.20 264)",
  "oklch(0.65 0.18 145)",
  "oklch(0.72 0.18 55)",
  "oklch(0.62 0.22 330)",
  "oklch(0.65 0.16 190)",
  "oklch(0.65 0.18 35)",
];

const WEEK_DAYS = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

type WDMetric = "sessions" | "malas";

export function WeekdayPattern({ sessions }: { sessions: SessionData[] }) {
  const [metric, setMetric] = useState<WDMetric>("malas");
  const [hovered, setHovered] = useState<number | null>(null);

  const sessionCounts = Array(7).fill(0) as number[];
  const malasCounts = Array(7).fill(0) as number[];

  for (const s of sessions) {
    const dow = new Date(s.date + "T00:00:00").getDay();
    const idx = dow === 0 ? 6 : dow - 1;
    sessionCounts[idx] = (sessionCounts[idx] ?? 0) + 1;
    for (const item of s.items) {
      const malas =
        item.unit === "malas"
          ? item.quantity
          : item.practice_type === "mantra_japa"
            ? item.quantity / 108
            : 0;
      malasCounts[idx] = (malasCounts[idx] ?? 0) + malas;
    }
  }

  const counts = metric === "sessions" ? sessionCounts : malasCounts;
  const max = Math.max(...counts, 1);
  const bestIdx = counts.indexOf(Math.max(...counts));
  const BAR_H = 96;

  return (
    <div className="bg-theme-surface-raised rounded-2xl p-5 shadow-lg">
      <div className="mb-4 flex items-center gap-2">
        <div className="bg-theme-primary-10 text-theme-primary flex items-center justify-center rounded-lg p-1.5">
          <Calendar className="h-4 w-4" />
        </div>
        <h2 className="text-theme-fg text-sm font-semibold">Weekpatroon</h2>
        <div className="ml-auto flex gap-1">
          {(["sessions", "malas"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={[
                "cursor-pointer rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-colors",
                metric === m
                  ? "bg-theme-primary text-white"
                  : "text-theme-fg-muted hover:text-theme-fg hover:bg-theme-hover bg-transparent",
              ].join(" ")}
            >
              {m === "sessions" ? "Sessies" : "Malas"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-end gap-1" style={{ height: BAR_H + 36 }}>
        {WEEK_DAYS.map((day, i) => {
          const count = counts[i] ?? 0;
          const barH = count > 0 ? Math.max(8, Math.round((count / max) * BAR_H)) : 3;
          const isBest = i === bestIdx && count > 0;
          const isHovered = hovered === i;

          return (
            <div
              key={day}
              className="relative flex flex-1 flex-col items-center"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Tooltip */}
              {isHovered && count > 0 && (
                <div
                  className="border-theme-border text-theme-fg pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg border px-2.5 py-1.5 text-center shadow-lg backdrop-blur-sm"
                  style={{
                    bottom: BAR_H + 8,
                    left: "50%",
                    background: "var(--theme-glass-bg)",
                    borderColor: "var(--theme-glass-border)",
                  }}
                >
                  <div className="text-theme-fg-muted mb-1 text-[9px] whitespace-nowrap">
                    {day}
                  </div>
                  {metric === "malas" ? (
                    <>
                      <div className="text-theme-fg-muted text-[10px] whitespace-nowrap">
                        {sessionCounts[i] ?? 0} sessie
                        {(sessionCounts[i] ?? 0) !== 1 ? "s" : ""}
                      </div>
                      <div className="text-theme-fg-muted text-[10px] whitespace-nowrap">
                        gem.{" "}
                        <span className="text-theme-fg font-medium">
                          {(sessionCounts[i] ?? 0) > 0
                            ? (count / (sessionCounts[i] ?? 1)).toLocaleString("nl-NL", {
                                maximumFractionDigits: 1,
                              })
                            : "—"}
                        </span>{" "}
                        malas/sessie
                      </div>
                    </>
                  ) : (
                    <div className="text-theme-fg-muted text-[10px] whitespace-nowrap">
                      totaal{" "}
                      <span className="text-theme-fg font-medium">
                        {(malasCounts[i] ?? 0) % 1 === 0
                          ? (malasCounts[i] ?? 0).toLocaleString("nl-NL")
                          : (malasCounts[i] ?? 0).toLocaleString("nl-NL", {
                              maximumFractionDigits: 1,
                            })}
                      </span>{" "}
                      malas
                    </div>
                  )}
                </div>
              )}

              {/* Bar */}
              <div
                className="flex w-full items-end justify-center"
                style={{ height: BAR_H }}
              >
                <div
                  className={[
                    "w-full rounded-t-md motion-safe:transition-all motion-safe:duration-150",
                    count === 0
                      ? "bg-theme-fg-8"
                      : isBest
                        ? "bg-theme-primary"
                        : isHovered
                          ? "bg-theme-primary-50"
                          : "bg-theme-primary-30",
                  ].join(" ")}
                  style={{ height: barH }}
                />
              </div>

              <span
                className={`mt-1 text-[10px] font-medium select-none ${isBest ? "text-theme-primary" : "text-theme-fg-muted"}`}
              >
                {day}
              </span>
              <span className="text-theme-fg-muted text-[9px] tabular-nums">
                {metric === "sessions"
                  ? count
                  : count > 0
                    ? count % 1 === 0
                      ? count.toLocaleString("nl-NL")
                      : count.toLocaleString("nl-NL", { maximumFractionDigits: 0 })
                    : "—"}
              </span>
            </div>
          );
        })}
      </div>

      {/* Best day callout */}
      {Math.max(...counts) > 0 && (
        <p className="text-theme-fg-muted mt-3 text-[11px]">
          Meest actief op{" "}
          <span className="text-theme-primary font-medium">{WEEK_DAYS[bestIdx]}</span>
        </p>
      )}
    </div>
  );
}

export function ConsistencyRing({ calDays }: { calDays: CalendarDay[] }) {
  const WINDOW = 30;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeDays = calDays.filter((d) => {
    const diff = Math.floor(
      (today.getTime() - new Date(d.date + "T00:00:00").getTime()) / 86400000
    );
    return diff >= 0 && diff < WINDOW && d.session_count > 0;
  }).length;

  // Previous 30-day window for comparison
  const prevActiveDays = calDays.filter((d) => {
    const diff = Math.floor(
      (today.getTime() - new Date(d.date + "T00:00:00").getTime()) / 86400000
    );
    return diff >= WINDOW && diff < WINDOW * 2 && d.session_count > 0;
  }).length;

  const pct = activeDays / WINDOW;
  const R = 42;
  const SW = 11;
  const C = 2 * Math.PI * R;
  const dash = pct * C;

  const delta = activeDays - prevActiveDays;

  return (
    <div className="bg-theme-surface-raised rounded-2xl p-5 shadow-lg">
      <div className="mb-4 flex items-center gap-2">
        <div className="bg-theme-primary-10 text-theme-primary flex items-center justify-center rounded-lg p-1.5">
          <Flame className="h-4 w-4" />
        </div>
        <h2 className="text-theme-fg text-sm font-semibold">Consistentie</h2>
        <span className="text-theme-fg-muted ml-auto text-xs">laatste 30 d</span>
      </div>

      <div className="flex items-center gap-5">
        <div className="relative shrink-0">
          <svg width={104} height={104} viewBox="0 0 104 104">
            {/* Track */}
            <circle
              cx={52}
              cy={52}
              r={R}
              fill="none"
              stroke="color-mix(in oklch, var(--theme-primary) 15%, transparent)"
              strokeWidth={SW}
            />
            {/* Fill */}
            <circle
              cx={52}
              cy={52}
              r={R}
              fill="none"
              stroke="var(--theme-primary)"
              strokeWidth={SW}
              strokeLinecap="round"
              strokeDasharray={`${dash} ${C}`}
              strokeDashoffset={0}
              transform="rotate(-90 52 52)"
              className="motion-safe:transition-all motion-safe:duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-theme-fg text-2xl leading-none font-bold tabular-nums">
              {activeDays}
            </span>
            <span className="text-theme-fg-muted text-[10px]">/ {WINDOW}</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <div>
            <span className="text-theme-fg text-2xl font-bold tabular-nums">
              {Math.round(pct * 100)}%
            </span>
            <span className="text-theme-fg-muted ml-1.5 text-sm">actief</span>
          </div>
          <p className="text-theme-fg-muted text-xs leading-relaxed">
            {activeDays} van {WINDOW} dagen gelogd.
          </p>
          {prevActiveDays > 0 && (
            <p
              className={`text-[11px] font-medium ${delta >= 0 ? "text-theme-success" : "text-theme-fg-muted"}`}
            >
              {delta >= 0 ? "↑" : "↓"} {Math.abs(delta)} dag
              {Math.abs(delta) !== 1 ? "en" : ""} {delta >= 0 ? "meer" : "minder"} dan
              vorige periode
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function PracticeDonut({ practices }: { practices: PracticeStat[] }) {
  const data = practices
    .map((p, i) => ({
      ...p,
      value: p.total_quantity,
      color: CHART_COLORS[i % CHART_COLORS.length]!,
    }))
    .filter((p) => p.value > 0);
  if (data.length === 0) return null;

  const total = data.reduce((s, d) => s + d.value, 0);
  const R = 44;
  const SW = 14;
  const C = 2 * Math.PI * R;
  const GAP = 2;

  const fracs = data.map((d) => d.value / total);
  const offsets = fracs.map((_, i) => fracs.slice(0, i).reduce((s, f) => s + f * C, 0));
  const segments = data.map((d, i) => ({
    practice_id: d.practice_id,
    practice_name: d.practice_name,
    color: d.color,
    frac: fracs[i]!,
    value: d.value,
    dash: Math.max(0, fracs[i]! * C - GAP),
    offset: offsets[i]!,
  }));

  return (
    <div className="bg-theme-surface-raised rounded-2xl p-5 shadow-lg">
      <div className="mb-4 flex items-center gap-2">
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
          style={{ background: CHART_COLORS[0], opacity: 0.85 }}
        >
          <span className="text-xs font-bold text-white">%</span>
        </div>
        <h2 className="text-theme-fg text-sm font-semibold">Per beoefening</h2>
        <span className="text-theme-fg-muted ml-auto text-xs">all-time</span>
      </div>

      <div className="flex items-center gap-6">
        {/* Donut */}
        <div className="relative shrink-0">
          <svg width={108} height={108} viewBox="0 0 108 108">
            <circle
              cx={54}
              cy={54}
              r={R}
              fill="none"
              stroke="color-mix(in oklch, var(--theme-fg) 8%, transparent)"
              strokeWidth={SW}
            />
            {segments.map((seg, i) => (
              <circle
                key={i}
                cx={54}
                cy={54}
                r={R}
                fill="none"
                stroke={seg.color}
                strokeWidth={SW}
                strokeLinecap="butt"
                strokeDasharray={`${seg.dash} ${C}`}
                strokeDashoffset={-seg.offset}
                transform="rotate(-90 54 54)"
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-theme-fg-muted text-[9px]">totaal</span>
            <span className="text-theme-fg text-lg leading-tight font-bold tabular-nums">
              {total % 1 === 0
                ? total.toLocaleString("nl-NL")
                : total.toLocaleString("nl-NL", { maximumFractionDigits: 1 })}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="min-w-0 flex-1 space-y-2.5">
          {segments.map((seg) => (
            <div key={seg.practice_id}>
              <div className="mb-0.5 flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: seg.color }}
                />
                <span className="text-theme-fg-secondary min-w-0 flex-1 truncate text-xs">
                  {seg.practice_name}
                </span>
                <span className="text-theme-fg-muted shrink-0 text-xs tabular-nums">
                  {Math.round(seg.frac * 100)}%
                </span>
              </div>
              <div className="bg-theme-hover ml-4 h-1 overflow-hidden rounded-full">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.round(seg.frac * 100)}%`,
                    background: seg.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
