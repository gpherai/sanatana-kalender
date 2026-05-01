"use client";

import { Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { isSameDay, MONTHS_SHORT, MONTHS_LONG } from "@/lib/date-utils";

export interface MoonPhaseEvent {
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

export function MoonPhasesTimeline({
  moonPhases,
  month,
  selectedDate,
  onSelectDate,
}: MoonPhasesTimelineProps) {
  if (moonPhases.length === 0) return null;

  return (
    <div className="almanac-moon-timeline rounded-2xl p-4 shadow-lg">
      <h3 className="text-theme-fg mb-3 flex items-center gap-2 text-sm font-semibold">
        <Moon className="h-4 w-4" />
        Maanfases in {MONTHS_LONG[month]}
      </h3>
      <div className="flex flex-wrap items-center justify-center gap-6">
        {moonPhases.map((phase, index) => (
          <button
            key={`${phase.type}-${index}`}
            onClick={() => onSelectDate(phase.date)}
            className={cn(
              "hover:bg-theme-surface-hover focus-visible:ring-theme-primary flex flex-col items-center rounded-lg p-2 transition-colors focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none",
              isSameDay(phase.date, selectedDate) &&
                "bg-theme-surface-raised ring-theme-primary ring-2"
            )}
          >
            <span className="text-3xl" aria-hidden="true">
              {phase.emoji}
            </span>
            <span className="text-theme-fg mt-1 text-xs font-medium">{phase.name}</span>
            <span className="text-theme-fg-muted text-xs">
              {phase.date.getDate()} {MONTHS_SHORT[month]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
