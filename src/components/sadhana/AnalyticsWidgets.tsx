"use client";

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

export function WeekdayPattern({ sessions }: { sessions: SessionData[] }) {
  const counts = Array(7).fill(0) as number[];
  for (const s of sessions) {
    const dow = new Date(s.date + "T00:00:00").getDay();
    const idx = dow === 0 ? 6 : dow - 1;
    counts[idx] = (counts[idx] ?? 0) + 1;
  }
  const max = Math.max(...counts, 1);
  const bestIdx = counts.indexOf(Math.max(...counts));

  return (
    <div className="bg-theme-surface-raised rounded-2xl p-5 shadow-lg">
      <div className="mb-4 flex items-center gap-2">
        <div className="bg-theme-primary-10 text-theme-primary flex items-center justify-center rounded-lg p-1.5">
          <Calendar className="h-4 w-4" />
        </div>
        <h2 className="text-theme-fg text-sm font-semibold">Weekpatroon</h2>
      </div>
      <div className="flex items-end gap-1">
        {WEEK_DAYS.map((day, i) => {
          const count = counts[i] ?? 0;
          const barH = count > 0 ? Math.max(8, Math.round((count / max) * 64)) : 3;
          const isBest = i === bestIdx && count > 0;
          return (
            <div key={day} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex h-16 w-full items-end justify-center">
                <div
                  className="w-full rounded-t-md transition-all duration-300"
                  style={{
                    height: barH,
                    background: isBest
                      ? "var(--theme-primary)"
                      : "color-mix(in oklch, var(--theme-primary) 35%, transparent)",
                  }}
                />
              </div>
              <span
                className={`text-[10px] font-medium ${isBest ? "text-theme-primary" : "text-theme-fg-muted"}`}
              >
                {day}
              </span>
              <span className="text-theme-fg text-[10px] tabular-nums">{count}</span>
            </div>
          );
        })}
      </div>
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

  const pct = activeDays / WINDOW;
  const R = 42;
  const SW = 11;
  const C = 2 * Math.PI * R;
  const dash = pct * C;

  return (
    <div className="bg-theme-surface-raised rounded-2xl p-5 shadow-lg">
      <div className="mb-4 flex items-center gap-2">
        <div className="bg-theme-primary-10 text-theme-primary flex items-center justify-center rounded-lg p-1.5">
          <Flame className="h-4 w-4" />
        </div>
        <h2 className="text-theme-fg text-sm font-semibold">Consistentie</h2>
        <span className="text-theme-fg-muted ml-auto text-xs">laatste 30 dagen</span>
      </div>
      <div className="flex items-center gap-5">
        <div className="relative shrink-0">
          <svg width={104} height={104} viewBox="0 0 104 104">
            <circle
              cx={52}
              cy={52}
              r={R}
              fill="none"
              stroke="color-mix(in oklch, var(--theme-primary) 15%, transparent)"
              strokeWidth={SW}
            />
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
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-theme-fg text-2xl leading-none font-bold tabular-nums">
              {activeDays}
            </span>
            <span className="text-theme-fg-muted text-[10px]">/ {WINDOW}</span>
          </div>
        </div>
        <div className="space-y-1">
          <div>
            <span className="text-theme-fg text-2xl font-bold tabular-nums">
              {Math.round(pct * 100)}%
            </span>
            <span className="text-theme-fg-muted ml-1.5 text-sm">actief</span>
          </div>
          <p className="text-theme-fg-muted text-xs leading-relaxed">
            {activeDays} van de {WINDOW} dagen een sessie gelogd.
          </p>
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
  const R = 38;
  const SW = 13;
  const C = 2 * Math.PI * R;
  const GAP = 2;

  const fracs = data.map((d) => d.value / total);
  const offsets = fracs.map((_, i) => fracs.slice(0, i).reduce((s, f) => s + f * C, 0));
  const segments = data.map((d, i) => ({
    practice_id: d.practice_id,
    practice_name: d.practice_name,
    color: d.color,
    frac: fracs[i]!,
    dash: Math.max(0, fracs[i]! * C - GAP),
    offset: offsets[i]!,
  }));

  return (
    <div className="border-theme-border mt-5 border-t pt-4">
      <div className="text-theme-fg-secondary mb-3 text-xs font-medium">
        Per beoefening
      </div>
      <div className="flex items-center gap-5">
        <div className="relative shrink-0">
          <svg width={96} height={96} viewBox="0 0 96 96">
            <circle
              cx={48}
              cy={48}
              r={R}
              fill="none"
              stroke="color-mix(in oklch, var(--theme-fg) 8%, transparent)"
              strokeWidth={SW}
            />
            {segments.map((seg, i) => (
              <circle
                key={i}
                cx={48}
                cy={48}
                r={R}
                fill="none"
                stroke={seg.color}
                strokeWidth={SW}
                strokeLinecap="butt"
                strokeDasharray={`${seg.dash} ${C}`}
                strokeDashoffset={-seg.offset}
                transform="rotate(-90 48 48)"
              />
            ))}
          </svg>
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          {segments.map((seg) => (
            <div key={seg.practice_id} className="flex items-center gap-2">
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
          ))}
        </div>
      </div>
    </div>
  );
}
