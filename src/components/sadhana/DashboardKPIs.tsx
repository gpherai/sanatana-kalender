"use client";

import { Flame, Sparkles, Calendar, TrendingUp } from "lucide-react";
import type { CalendarDay, OverviewStats, StreakStats } from "./types";

function getMonthProgress(calDays: CalendarDay[]) {
  const now = new Date();
  const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const daysPassed = now.getDate();
  const active = calDays.filter(
    (d) => d.date.startsWith(key) && d.session_count > 0
  ).length;
  return { active, daysPassed };
}

function getLastMonthMalas(calDays: CalendarDay[]): number {
  const now = new Date();
  const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const key = `${lm.getFullYear()}-${String(lm.getMonth() + 1).padStart(2, "0")}`;
  return calDays
    .filter((d) => d.date.startsWith(key))
    .reduce((s, d) => s + d.total_malas, 0);
}

function DeltaBadge({ current, previous }: { current: number; previous: number }) {
  if (current === 0 && previous === 0) return null;
  if (previous === 0)
    return (
      <span className="text-[10px] font-medium" style={{ color: "var(--theme-success)" }}>
        Nieuw ↑
      </span>
    );
  const pct = Math.round(((current - previous) / previous) * 100);
  const up = pct >= 0;
  return (
    <span
      className="text-[10px] font-medium tabular-nums"
      style={{ color: up ? "var(--theme-success)" : "var(--theme-fg-muted)" }}
    >
      {up ? "↑" : "↓"} {Math.abs(pct)}% vs vorige maand
    </span>
  );
}

interface DashboardKPIsProps {
  streak: StreakStats | null;
  overview: OverviewStats | null;
  calDays: CalendarDay[];
}

export function DashboardKPIs({ streak, overview, calDays }: DashboardKPIsProps) {
  const { active, daysPassed } = getMonthProgress(calDays);
  const lastMonthMalas = getLastMonthMalas(calDays);
  const thisMonthMalas = overview?.total_malas_this_month ?? 0;
  const avgPerActiveDay = active > 0 ? Math.round(thisMonthMalas / active) : 0;
  const consistencyPct = daysPassed > 0 ? Math.round((active / daysPassed) * 100) : 0;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {/* Streak */}
      <div
        className="rounded-2xl p-4 shadow-lg"
        style={{
          background:
            "color-mix(in oklch, var(--theme-accent) 6%, var(--theme-surface-raised))",
        }}
      >
        <div className="mb-2 flex items-center gap-1.5">
          <span
            className="flex items-center justify-center rounded-lg p-1"
            style={{
              background: "color-mix(in oklch, var(--theme-accent) 15%, transparent)",
              color: "var(--theme-accent)",
            }}
          >
            <Flame className="h-3.5 w-3.5" />
          </span>
          <span className="text-theme-fg-muted text-xs font-medium">Huidige streak</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span
            className="text-2xl leading-none font-bold tabular-nums"
            style={{ color: "var(--theme-accent)" }}
          >
            {streak?.current_streak ?? 0}
          </span>
          <span className="text-theme-fg-muted text-xs">dagen</span>
        </div>
        <div className="text-theme-fg-muted mt-1.5 text-[10px]">
          Langste: {streak?.longest_streak ?? 0} d
        </div>
      </div>

      {/* Malas deze maand */}
      <div className="bg-theme-surface-raised rounded-2xl p-4 shadow-lg">
        <div className="mb-2 flex items-center gap-1.5">
          <span
            className="flex items-center justify-center rounded-lg p-1"
            style={{
              background: "color-mix(in oklch, var(--theme-primary) 12%, transparent)",
              color: "var(--theme-primary)",
            }}
          >
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <span className="text-theme-fg-muted text-xs font-medium">
            Malas deze maand
          </span>
        </div>
        <div
          className="text-2xl leading-none font-bold tabular-nums"
          style={{ color: "var(--theme-stat-value)" }}
        >
          {thisMonthMalas.toLocaleString("nl-NL")}
        </div>
        <div className="mt-1.5 text-[10px]">
          <DeltaBadge current={thisMonthMalas} previous={lastMonthMalas} />
        </div>
      </div>

      {/* Actieve dagen */}
      <div className="bg-theme-surface-raised rounded-2xl p-4 shadow-lg">
        <div className="mb-2 flex items-center gap-1.5">
          <span
            className="flex items-center justify-center rounded-lg p-1"
            style={{
              background: "color-mix(in oklch, var(--theme-primary) 12%, transparent)",
              color: "var(--theme-primary)",
            }}
          >
            <Calendar className="h-3.5 w-3.5" />
          </span>
          <span className="text-theme-fg-muted text-xs font-medium">Actieve dagen</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span
            className="text-2xl leading-none font-bold tabular-nums"
            style={{ color: "var(--theme-stat-value)" }}
          >
            {active}
          </span>
          <span className="text-theme-fg-muted text-xs">/ {daysPassed} d</span>
        </div>
        <div
          className="mt-2 h-1.5 overflow-hidden rounded-full"
          style={{ background: "color-mix(in oklch, var(--theme-fg) 10%, transparent)" }}
        >
          <div
            className="h-full rounded-full motion-safe:transition-all motion-safe:duration-500"
            style={{ width: `${consistencyPct}%`, background: "var(--theme-primary)" }}
          />
        </div>
      </div>

      {/* Gem. per actieve dag */}
      <div className="bg-theme-surface-raised rounded-2xl p-4 shadow-lg">
        <div className="mb-2 flex items-center gap-1.5">
          <span
            className="flex items-center justify-center rounded-lg p-1"
            style={{
              background: "color-mix(in oklch, var(--theme-primary) 12%, transparent)",
              color: "var(--theme-primary)",
            }}
          >
            <TrendingUp className="h-3.5 w-3.5" />
          </span>
          <span className="text-theme-fg-muted text-xs font-medium">Gem. per dag</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span
            className="text-2xl leading-none font-bold tabular-nums"
            style={{ color: "var(--theme-stat-value)" }}
          >
            {avgPerActiveDay.toLocaleString("nl-NL")}
          </span>
          <span className="text-theme-fg-muted text-xs">malas</span>
        </div>
        <div className="text-theme-fg-muted mt-1.5 text-[10px]">
          {overview?.total_sessions_this_month ?? 0} sessies deze maand
        </div>
      </div>
    </div>
  );
}
