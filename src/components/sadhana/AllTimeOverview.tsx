"use client";

import { Award } from "lucide-react";
import { type OverviewStats } from "./types";
import { PracticeDonut } from "./AnalyticsWidgets";

function formatHours(minutes: number): string {
  const hours = Math.round(minutes / 60);
  return hours.toLocaleString("nl-NL");
}

export function AllTimeOverview({ overview }: { overview: OverviewStats }) {
  const stats = [
    {
      label: "Sessies",
      value: overview.total_sessions.toLocaleString("nl-NL"),
      unit: "",
    },
    {
      label: "Malas",
      value: overview.total_malas_all_time.toLocaleString("nl-NL"),
      unit: "",
    },
    {
      label: "Uren",
      value: formatHours(overview.total_minutes_all_time),
      unit: "",
    },
    {
      label: "Gem. malas",
      value: overview.avg_malas_per_session.toFixed(1),
      unit: "/ sessie",
    },
    {
      label: "Gem. tijd",
      value: Math.round(overview.avg_minutes_per_session).toString(),
      unit: "min / sessie",
    },
  ];

  return (
    <div className="bg-theme-surface-raised rounded-2xl p-5 shadow-lg">
      <div className="mb-4 flex items-center gap-2">
        <div className="bg-theme-primary-10 text-theme-primary flex items-center justify-center rounded-lg p-1.5">
          <Award className="h-4 w-4" />
        </div>
        <h2 className="text-theme-fg text-sm font-semibold">All-time</h2>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-5">
        {stats.map(({ label, value, unit }) => (
          <div key={label}>
            <div className="text-theme-fg-muted text-xs">{label}</div>
            <div
              className="mt-0.5 text-2xl leading-tight font-bold tabular-nums"
              style={{ color: "var(--theme-stat-value)" }}
            >
              {value}
            </div>
            {unit && <div className="text-theme-fg-muted mt-0.5 text-[10px]">{unit}</div>}
          </div>
        ))}
      </div>

      <PracticeDonut practices={overview.practices} />
    </div>
  );
}
