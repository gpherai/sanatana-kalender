"use client";

import { Award } from "lucide-react";
import { type OverviewStats } from "@/types/sadhana";

function formatHours(minutes: number): string {
  return Math.round(minutes / 60).toLocaleString("nl-NL");
}

export function AllTimeOverview({ overview }: { overview: OverviewStats }) {
  return (
    <div className="bg-theme-surface-raised rounded-2xl p-5 shadow-lg">
      <div className="mb-4 flex items-center gap-2">
        <div className="bg-theme-primary/10 text-theme-primary flex items-center justify-center rounded-lg p-1.5">
          <Award className="h-4 w-4" />
        </div>
        <h2 className="text-theme-fg text-sm font-semibold">All-time</h2>
      </div>

      {/* Totalen */}
      <div className="grid grid-cols-3 gap-x-4 gap-y-5">
        {[
          { label: "Sessies", value: overview.totalSessions.toLocaleString("nl-NL") },
          {
            label: "Malas",
            value: overview.totalMalasAllTime.toLocaleString("nl-NL"),
          },
          { label: "Uren", value: formatHours(overview.totalMinutesAllTime) },
        ].map(({ label, value }) => (
          <div key={label}>
            <div className="text-theme-fg-muted text-xs">{label}</div>
            <div className="text-theme-stat-value mt-0.5 text-2xl leading-tight font-bold tabular-nums">
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Gemiddelden */}
      <div className="border-theme-border mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t pt-4">
        {[
          {
            label: "Gem. malas / sessie",
            value: overview.avgMalasPerSession.toFixed(1),
          },
          {
            label: "Gem. tijd / sessie",
            value: `${Math.round(overview.avgMinutesPerSession)} min`,
          },
        ].map(({ label, value }) => (
          <div key={label}>
            <div className="text-theme-fg-muted text-xs">{label}</div>
            <div className="text-theme-fg mt-0.5 text-lg font-semibold tabular-nums">
              {value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
