"use client";

import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BirthChart } from "@/server/panchanga/types";
import {
  calcVimshottari,
  calcAntardasha,
  DASHA_NAMES,
  DASHA_SYMBOL,
  DASHA_COLOR,
  DASHA_YEARS,
} from "./dasha-utils";

const NL_MONTHS = [
  "jan",
  "feb",
  "mrt",
  "apr",
  "mei",
  "jun",
  "jul",
  "aug",
  "sep",
  "okt",
  "nov",
  "dec",
];

function fmt(d: Date): string {
  return `${NL_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function VimshottariDasha({ chart }: { chart: BirthChart }) {
  const today = new Date();
  const birthDate = new Date((chart.julianDay - 2440587.5) * 86400000);
  const moon = chart.grahas.chandra;
  const periods = calcVimshottari(moon, birthDate);
  const currentIdx = periods.findIndex((p) => p.start <= today && today < p.end);

  return (
    <div className="bg-theme-surface-raised rounded-2xl p-5 shadow-lg">
      <div className="mb-4 flex items-center gap-2">
        <div className="bg-theme-primary-10 text-theme-primary flex items-center justify-center rounded-lg p-1.5">
          <Clock className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-theme-fg text-sm font-semibold">Vimshottari Dasha</h2>
          <p className="text-theme-fg-muted text-xs">
            Chandra in {moon.nakshatra.name} · pada {moon.nakshatra.pada}
          </p>
        </div>
      </div>

      <div className="space-y-0.5">
        {periods.map((period, idx) => {
          const isPast = period.end <= today;
          const isCurrent = idx === currentIdx;
          const antars = isCurrent ? calcAntardasha(period) : [];
          const currentAntarIdx = isCurrent
            ? antars.findIndex((a) => a.start <= today && today < a.end)
            : -1;

          return (
            <div key={period.lord + String(idx)}>
              {/* Mahadasha row */}
              <div
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                  isCurrent && "bg-theme-primary-10",
                  isPast && "opacity-50"
                )}
              >
                <span
                  className="w-4 shrink-0 text-center text-base leading-none"
                  style={{
                    color: isCurrent ? "var(--theme-primary)" : DASHA_COLOR[period.lord],
                  }}
                >
                  {DASHA_SYMBOL[period.lord]}
                </span>
                <span
                  className={cn(
                    "min-w-[4.5rem] font-semibold",
                    isCurrent ? "text-theme-primary" : "text-theme-fg"
                  )}
                >
                  {DASHA_NAMES[period.lord]}
                </span>
                {isCurrent && (
                  <span className="text-theme-primary text-xs opacity-70">◀ huidig</span>
                )}
                <span className="text-theme-fg-muted ml-auto text-xs tabular-nums">
                  {fmt(period.start)} → {fmt(period.end)}
                </span>
                <span className="text-theme-fg-muted w-10 shrink-0 text-right text-xs tabular-nums">
                  {DASHA_YEARS[period.lord]} jr
                </span>
              </div>

              {/* Antardashas (current dasha only) */}
              {isCurrent && antars.length > 0 && (
                <div className="mt-1 mb-2 ml-9 space-y-0.5">
                  {antars.map((antar, ai) => {
                    const isCurrentAntar = ai === currentAntarIdx;
                    const isAntarPast = antar.end <= today;
                    return (
                      <div
                        key={antar.lord + String(ai)}
                        className={cn(
                          "flex items-center gap-2 rounded px-2 py-1 text-xs",
                          isCurrentAntar && "bg-theme-primary-10",
                          isAntarPast && "opacity-40"
                        )}
                      >
                        <span
                          className="w-3.5 shrink-0 text-center leading-none"
                          style={{
                            color: isCurrentAntar
                              ? "var(--theme-primary)"
                              : DASHA_COLOR[antar.lord],
                          }}
                        >
                          {DASHA_SYMBOL[antar.lord]}
                        </span>
                        <span
                          className={cn(
                            "font-medium",
                            isCurrentAntar
                              ? "text-theme-primary"
                              : "text-theme-fg-secondary"
                          )}
                        >
                          {DASHA_NAMES[period.lord]}/{DASHA_NAMES[antar.lord]}
                          {isCurrentAntar && (
                            <span className="text-theme-primary ml-1.5 opacity-70">
                              ◀
                            </span>
                          )}
                        </span>
                        <span className="text-theme-fg-muted ml-auto tabular-nums">
                          {fmt(antar.start)} → {fmt(antar.end)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
