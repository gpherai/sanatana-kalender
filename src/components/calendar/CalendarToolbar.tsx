"use client";

import { ToolbarProps, View } from "react-big-calendar";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { CalendarEvent } from "@/types/calendar";
import { cn } from "@/lib/utils";

export function CalendarToolbar({
  date,
  view,
  onNavigate,
  onView,
}: ToolbarProps<CalendarEvent>) {
  const goToBack = () => onNavigate("PREV");
  const goToNext = () => onNavigate("NEXT");
  const goToToday = () => onNavigate("TODAY");

  const viewButtons: { key: View; label: string }[] = [
    { key: "month", label: "Maand" },
    { key: "week", label: "Week" },
    { key: "agenda", label: "Agenda" },
  ];

  return (
    <div className="mb-4 flex flex-col gap-4 p-2 sm:flex-row sm:items-center sm:justify-between">
      {/* Navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={goToToday}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium",
            "bg-theme-primary-15 text-theme-primary hover:bg-theme-primary-25",
            "transition-colors"
          )}
        >
          <Calendar className="h-4 w-4" />
          Vandaag
        </button>

        <div className="flex items-center">
          <button
            onClick={goToBack}
            className={cn(
              "rounded-lg p-1.5",
              "hover:bg-theme-hover",
              "transition-colors"
            )}
            aria-label="Vorige"
          >
            <ChevronLeft className="h-5 w-5 text-theme-fg-secondary" />
          </button>
          <button
            onClick={goToNext}
            className={cn(
              "rounded-lg p-1.5",
              "hover:bg-theme-hover",
              "transition-colors"
            )}
            aria-label="Volgende"
          >
            <ChevronRight className="h-5 w-5 text-theme-fg-secondary" />
          </button>
        </div>
      </div>

      {/* Current Date */}
      <h2 className="text-xl font-semibold text-theme-fg capitalize">
        {format(date, "MMMM yyyy", { locale: nl })}
      </h2>

      {/* View Buttons */}
      <div className="flex items-center gap-1 rounded-lg bg-theme-surface-raised p-1">
        {viewButtons.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onView(key)}
            className={cn(
              "rounded-md px-3 py-1 text-sm font-medium transition-colors",
              view === key
                ? "text-theme-primary bg-theme-surface shadow-sm"
                : "text-theme-fg-secondary hover:text-theme-fg"
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
