"use client";

import { Sunrise, Sunset, Moon, MoonStar } from "lucide-react";
import { cn } from "@/lib/utils";
import { isSameDay, isToday, formatDateISO } from "@/lib/date-utils";
import type { DailyInfoResponse } from "@/types";
import type { CalendarEventResponse } from "@/types/calendar";
import type { SpecialDay } from "@/lib/panchanga-helpers";

interface MoonPhaseEvent {
  date: Date;
  type: "new" | "first_quarter" | "full" | "last_quarter";
  name: string;
  emoji: string;
}

interface MonthGridProps {
  year: number;
  month: number;
  days: Date[];
  startPadding: number;
  dailyInfoMap: Map<string, DailyInfoResponse>;
  eventsMap: Map<string, CalendarEventResponse[]>;
  specialDaysMap: Map<string, SpecialDay[]>;
  moonPhasesMap: Map<string, MoonPhaseEvent>;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  showMoonPhases: boolean;
  showSpecialDays: boolean;
  showEvents: boolean;
}

const WEEKDAYS_SHORT = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"] as const;

const MONTHS = [
  "Januari", "Februari", "Maart", "April", "Mei", "Juni",
  "Juli", "Augustus", "September", "Oktober", "November", "December",
] as const;

export function MonthGrid({
  year,
  month,
  days,
  startPadding,
  dailyInfoMap,
  eventsMap,
  specialDaysMap,
  moonPhasesMap,
  selectedDate,
  onSelectDate,
  showMoonPhases,
  showSpecialDays,
  showEvents,
}: MonthGridProps) {
  return (
    <div className="rounded-2xl bg-theme-surface-raised p-4 shadow-lg">
      <h2 className="mb-4 text-xl font-bold text-theme-fg">
        {MONTHS[month]} {year}
      </h2>

      <div className="grid grid-cols-7 gap-1">
        {/* Weekday headers */}
        {WEEKDAYS_SHORT.map((day) => (
          <div
            key={day}
            className="p-2 text-center text-xs font-semibold text-theme-fg-muted"
          >
            {day}
          </div>
        ))}

        {/* Empty cells for padding */}
        {Array.from({ length: startPadding }).map((_, i) => (
          <div key={`pad-${i}`} className="p-1" />
        ))}

        {/* Day cells */}
        {days.map((date) => {
          const dateStr = formatDateISO(date);
          const info = dailyInfoMap.get(dateStr);
          const dayEvents = eventsMap.get(dateStr) || [];
          const daySpecial = specialDaysMap.get(dateStr) || [];
          const moonPhase = moonPhasesMap.get(dateStr);
          const hasMajorEvent = dayEvents.some(e => e.resource.importance === "MAJOR");
          const isSelected = isSameDay(date, selectedDate);
          const isTodayDate = isToday(date);

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(date)}
              className={cn(
                "group relative flex flex-col rounded-lg p-1.5 text-left transition-all focus:outline-none focus:ring-2 focus:ring-theme-primary focus:ring-offset-1",
                isSelected
                  ? "bg-theme-primary text-white shadow-lg ring-2 ring-theme-primary ring-offset-2 ring-offset-theme-surface"
                  : isTodayDate
                    ? "bg-theme-primary-15 ring-1 ring-theme-primary"
                    : hasMajorEvent && showEvents
                      ? "bg-[var(--theme-almanac-event-cell-bg)] hover:bg-[var(--theme-almanac-event-cell-bg-hover)]"
                      : moonPhase && showMoonPhases
                        ? "bg-[var(--theme-almanac-moon-cell-bg)] hover:bg-[var(--theme-almanac-moon-cell-bg-hover)]"
                        : daySpecial.length > 0 && showSpecialDays
                          ? "bg-[var(--theme-almanac-special-cell-bg)] hover:bg-[var(--theme-almanac-special-cell-bg-hover)]"
                          : "hover:bg-theme-surface-hover"
              )}
            >
              {/* Date & Moon emoji row */}
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "text-sm font-semibold",
                    isSelected
                      ? "text-white"
                      : isTodayDate
                        ? "text-theme-primary"
                        : "text-theme-fg"
                  )}
                >
                  {date.getDate()}
                </span>
                {info && (
                  <span className="text-sm">{info.moonPhaseEmoji}</span>
                )}
              </div>

              {/* Sun times */}
              {info && (
                <div className={cn(
                  "mt-0.5 text-[10px] leading-tight",
                  isSelected ? "text-white/80" : "text-theme-fg-muted"
                )}>
                  <div className="flex items-center gap-0.5">
                    <Sunrise className="h-2.5 w-2.5 flex-shrink-0 text-[var(--theme-almanac-sun-rise-icon)]" />
                    <span>{info.sunrise}</span>
                    <Sunset className="ml-1 h-2.5 w-2.5 flex-shrink-0 text-[var(--theme-almanac-sun-set-icon)]" />
                    <span>{info.sunset}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <MoonStar className="h-2.5 w-2.5 flex-shrink-0 text-[var(--theme-almanac-moon-rise-icon)]" />
                    <span>{info.moonrise || "—"}</span>
                    <Moon className="ml-1 h-2.5 w-2.5 flex-shrink-0 text-[var(--theme-almanac-moon-set-icon)]" />
                    <span>{info.moonset || "—"}</span>
                  </div>
                </div>
              )}

              {/* Indicators */}
              <div className="mt-1 flex flex-wrap gap-0.5">
                {moonPhase && showMoonPhases && (
                  <span className="text-[10px]" title={moonPhase.name}>
                    {moonPhase.emoji}
                  </span>
                )}
                {daySpecial.length > 0 && showSpecialDays && (
                  <span className="text-[10px]" title={daySpecial.map(s => s.name).join(", ")}>
                    🙏
                  </span>
                )}
                {dayEvents.length > 0 && showEvents && (
                  <span
                    className={cn(
                      "flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[10px] font-bold",
                      isSelected
                        ? "bg-white/30 text-white"
                        : "bg-theme-primary text-white"
                    )}
                  >
                    {dayEvents.length}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
