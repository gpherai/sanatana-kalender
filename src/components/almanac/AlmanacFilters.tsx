"use client";

import { ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlmanacFiltersProps {
  year: number;
  month: number;
  showMoonPhases: boolean;
  showSpecialDays: boolean;
  showEvents: boolean;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
  onToggleFilter: (filter: "moonPhases" | "specialDays" | "events") => void;
}

const MONTHS_SHORT = [
  "Jan", "Feb", "Mrt", "Apr", "Mei", "Jun",
  "Jul", "Aug", "Sep", "Okt", "Nov", "Dec",
] as const;

export function AlmanacFilters({
  year,
  month,
  showMoonPhases,
  showSpecialDays,
  showEvents,
  onYearChange,
  onMonthChange,
  onToggleFilter,
}: AlmanacFiltersProps) {
  const currentDate = new Date();

  return (
    <div className="mb-6 rounded-2xl bg-theme-surface-raised p-4 shadow-lg">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Year navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onYearChange(year - 1)}
            className="rounded-lg p-2 text-theme-fg-muted transition-colors hover:bg-theme-surface-hover focus:outline-none focus:ring-2 focus:ring-theme-primary focus:ring-offset-2"
            aria-label="Vorig jaar"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="min-w-[4rem] text-center text-xl font-bold text-theme-fg">
            {year}
          </span>
          <button
            onClick={() => onYearChange(year + 1)}
            className="rounded-lg p-2 text-theme-fg-muted transition-colors hover:bg-theme-surface-hover focus:outline-none focus:ring-2 focus:ring-theme-primary focus:ring-offset-2"
            aria-label="Volgend jaar"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Month strip */}
        <div className="flex flex-1 gap-1 overflow-x-auto">
          {MONTHS_SHORT.map((m, index) => {
            const isSelected = index === month;
            const isCurrent = index === currentDate.getMonth() && year === currentDate.getFullYear();

            return (
              <button
                key={m}
                onClick={() => onMonthChange(index)}
                className={cn(
                  "flex-shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-theme-primary focus:ring-offset-1",
                  isSelected
                    ? "bg-theme-primary text-white shadow-md"
                    : isCurrent
                      ? "bg-theme-primary-15 text-theme-primary"
                      : "text-theme-fg-muted hover:bg-theme-surface-hover"
                )}
              >
                {m}
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-theme-fg-muted" />
          <button
            onClick={() => onToggleFilter("moonPhases")}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[var(--theme-almanac-moon-focus)] focus:ring-offset-1",
              showMoonPhases
                ? "bg-[var(--theme-almanac-moon-bg)] text-[var(--theme-almanac-moon-fg)]"
                : "bg-theme-surface-hover text-theme-fg-muted"
            )}
          >
            🌙 Maanfases
          </button>
          <button
            onClick={() => onToggleFilter("specialDays")}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[var(--theme-almanac-special-focus)] focus:ring-offset-1",
              showSpecialDays
                ? "bg-[var(--theme-almanac-special-bg)] text-[var(--theme-almanac-special-fg)]"
                : "bg-theme-surface-hover text-theme-fg-muted"
            )}
          >
            🙏 Speciale dagen
          </button>
          <button
            onClick={() => onToggleFilter("events")}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[var(--theme-almanac-event-focus)] focus:ring-offset-1",
              showEvents
                ? "bg-[var(--theme-almanac-event-bg)] text-[var(--theme-almanac-event-fg)]"
                : "bg-theme-surface-hover text-theme-fg-muted"
            )}
          >
            ⭐ Events
          </button>
        </div>
      </div>
    </div>
  );
}
