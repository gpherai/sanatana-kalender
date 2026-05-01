"use client";

import { useState } from "react";
import { Clock, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BirthChart } from "@/engine/panchanga/types";
import {
  calcVimshottari,
  calcAntardasha,
  DASHA_NAMES,
  DASHA_SYMBOL,
  DASHA_COLOR,
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

  const [expanded, setExpanded] = useState<Set<number>>(
    () => new Set(currentIdx >= 0 ? [currentIdx] : [])
  );

  function toggle(idx: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

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
          const isOpen = expanded.has(idx);
          const antars = isOpen ? calcAntardasha(period) : [];
          const currentAntarIdx =
            isCurrent && isOpen
              ? antars.findIndex((a) => a.start <= today && today < a.end)
              : -1;

          const pct = isCurrent
            ? Math.min(
                100,
                Math.max(
                  0,
                  ((today.getTime() - period.start.getTime()) /
                    (period.end.getTime() - period.start.getTime())) *
                    100
                )
              )
            : 0;

          return (
            <div key={period.lord + String(idx)}>
              {/* Mahadasha row — clickable */}
              <button
                data-testid={`dasha-${period.lord}`}
                aria-expanded={isOpen}
                onClick={() => toggle(idx)}
                className={cn(
                  "focus-visible:ring-theme-primary relative flex w-full cursor-pointer items-center gap-2 overflow-hidden rounded-lg px-3 py-2 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none",
                  isCurrent && "bg-theme-primary-10",
                  !isCurrent && "hover:bg-theme-hover",
                  isPast && "opacity-50"
                )}
              >
                <ChevronRight
                  className={cn(
                    "text-theme-fg-muted h-3.5 w-3.5 shrink-0 transition-transform duration-150 motion-reduce:transition-none",
                    isOpen && "rotate-90"
                  )}
                />
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
                    "min-w-[4.5rem] text-left font-semibold",
                    isCurrent ? "text-theme-primary" : "text-theme-fg"
                  )}
                >
                  {DASHA_NAMES[period.lord]}
                </span>
                {isCurrent && (
                  <span className="text-theme-primary text-xs opacity-70">
                    ◀ nog{" "}
                    {(
                      (period.end.getTime() - today.getTime()) /
                      (365.25 * 24 * 3600 * 1000)
                    ).toFixed(1)}{" "}
                    jr
                  </span>
                )}
                <span className="text-theme-fg-muted ml-auto text-xs tabular-nums">
                  {fmt(period.start)} → {fmt(period.end)}
                </span>
                <span className="text-theme-fg-muted w-10 shrink-0 text-right text-xs tabular-nums">
                  {Math.round(
                    (period.end.getTime() - period.start.getTime()) /
                      (365.25 * 24 * 3600 * 1000)
                  )}{" "}
                  jr
                </span>
                {isCurrent && (
                  <span
                    aria-hidden="true"
                    className="bg-theme-primary absolute bottom-0 left-0 h-0.5 opacity-40"
                    style={{ width: `${pct}%` }}
                  />
                )}
              </button>

              {/* Antardashas */}
              {isOpen && antars.length > 0 && (
                <div className="mt-1 mb-2 ml-10 space-y-0.5">
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
