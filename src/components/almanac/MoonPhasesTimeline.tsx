"use client";

import { Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { isSameDay } from "@/lib/date-utils";

interface MoonPhaseEvent {
  date: Date;
  type: "new" | "first_quarter" | "full" | "last_quarter";
  name: string;
  emoji: string;
}

interface MoonPhasesTimelineProps {
  moonPhases: MoonPhaseEvent[];
  month: number;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

const MONTHS_SHORT = [
  "Jan", "Feb", "Mrt", "Apr", "Mei", "Jun",
  "Jul", "Aug", "Sep", "Okt", "Nov", "Dec",
] as const;

export function MoonPhasesTimeline({
  moonPhases,
  month,
  selectedDate,
  onSelectDate,
}: MoonPhasesTimelineProps) {
  if (moonPhases.length === 0) return null;

  return (
    <div className="rounded-2xl bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 p-4 shadow-lg dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-theme-fg">
        <Moon className="h-4 w-4" />
        Maanfases in {MONTHS_SHORT[month]}
      </h3>
      <div className="flex flex-wrap items-center justify-center gap-6">
        {moonPhases.map((phase, index) => (
          <button
            key={`${phase.type}-${index}`}
            onClick={() => onSelectDate(phase.date)}
            className={cn(
              "flex flex-col items-center rounded-lg p-2 transition-colors hover:bg-theme-surface-hover focus:outline-none focus:ring-2 focus:ring-theme-primary focus:ring-offset-1",
              isSameDay(phase.date, selectedDate) && "bg-theme-surface-raised ring-2 ring-theme-primary"
            )}
          >
            <span className="text-3xl">{phase.emoji}</span>
            <span className="mt-1 text-xs font-medium text-theme-fg">
              {phase.name}
            </span>
            <span className="text-xs text-theme-fg-muted">
              {phase.date.getDate()} {MONTHS_SHORT[month]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
