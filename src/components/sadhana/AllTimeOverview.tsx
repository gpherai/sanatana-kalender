"use client";

import { Award } from "lucide-react";
import { type OverviewStats } from "./types";
import { PracticeDonut } from "./AnalyticsWidgets";

export function AllTimeOverview({ overview }: { overview: OverviewStats }) {
  return (
    <div className="bg-theme-surface-raised rounded-2xl p-5 shadow-lg">
      <div className="mb-4 flex items-center gap-2">
        <div className="bg-theme-primary-10 text-theme-primary flex items-center justify-center rounded-lg p-1.5">
          <Award className="h-4 w-4" />
        </div>
        <h2 className="text-theme-fg text-sm font-semibold">All-time overzicht</h2>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { label: "Sessies", value: overview.total_sessions.toLocaleString("nl-NL") },
          {
            label: "Malas totaal",
            value: overview.total_malas_all_time.toLocaleString("nl-NL"),
          },
          {
            label: "Minuten totaal",
            value: overview.total_minutes_all_time.toLocaleString("nl-NL"),
          },
          {
            label: "Gem. malas/sessie",
            value: overview.avg_malas_per_session.toFixed(1),
          },
          {
            label: "Gem. min/sessie",
            value: overview.avg_minutes_per_session.toFixed(1),
          },
        ].map(({ label, value }) => (
          <div key={label}>
            <div className="text-theme-fg-muted text-xs">{label}</div>
            <div
              className="mt-0.5 text-2xl font-bold tabular-nums"
              style={{ color: "var(--theme-stat-value)" }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>
      <PracticeDonut practices={overview.practices} />
    </div>
  );
}
