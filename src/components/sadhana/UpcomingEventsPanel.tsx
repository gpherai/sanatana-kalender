"use client";

import { useState, useMemo } from "react";
import { CalendarDays, Sparkles, ChevronRight } from "lucide-react";
import { useFetch } from "@/hooks/useFetch";
import { EventDetailModal } from "@/components/calendar/EventDetailModal";
import type { CalendarEventResponse, CalendarEvent } from "@/types/calendar";
import { parseCalendarEvent } from "@/types/calendar";
import { resolveCategoryColor } from "@/lib/category-styles";
import { useTheme } from "@/components/theme/ThemeProvider";
import { todayString, localDateString } from "./types";

const DAYS_NL = ["zo", "ma", "di", "wo", "do", "vr", "za"];
const MONTHS_SHORT = [
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

function formatUpcomingDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (dateStr === localDateString(tomorrow)) return "Morgen";
  return `${DAYS_NL[d.getDay()]} ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

function isSeries(e: CalendarEventResponse) {
  return e.resource.seriesParentEventIds.length > 0;
}

export function UpcomingEventsPanel() {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const { resolvedColorMode } = useTheme();
  const isDark = resolvedColorMode === "dark";

  const today = todayString();
  const endDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return localDateString(d);
  }, []);

  const { data: rawEvents } = useFetch<CalendarEventResponse[]>(
    `/api/events?start=${today}&end=${endDate}&sortBy=date&order=asc`
  );

  const todayEvents = useMemo(
    () => rawEvents?.filter((e) => e.start === today) ?? [],
    [rawEvents, today]
  );

  const upcomingEvents = useMemo(
    () => (rawEvents ?? []).filter((e) => e.start > today && !isSeries(e)).slice(0, 8),
    [rawEvents, today]
  );

  if (!rawEvents || (todayEvents.length === 0 && upcomingEvents.length === 0))
    return null;

  return (
    <>
      <div className="bg-theme-surface-raised rounded-2xl p-5 shadow-lg">
        <div className="mb-4 flex items-center gap-2">
          <div className="bg-theme-primary-10 text-theme-primary flex items-center justify-center rounded-lg p-1.5">
            <CalendarDays className="h-4 w-4" />
          </div>
          <h2 className="text-theme-fg text-sm font-semibold">
            Aankomende Festiviteiten
          </h2>
        </div>

        {/* Today's events — prominent banner */}
        {todayEvents.length > 0 && (
          <div className="mb-4 space-y-2">
            {todayEvents.map((event) => {
              const category = event.resource.categories[0] ?? null;
              const color = category
                ? resolveCategoryColor(category.color, category.colorDark, isDark)
                : null;
              return (
                <button
                  key={event.id}
                  onClick={() => setSelectedEvent(parseCalendarEvent(event))}
                  className="w-full cursor-pointer rounded-xl p-4 text-left transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                  style={{
                    background: color
                      ? `linear-gradient(135deg, color-mix(in oklch, ${color} 22%, var(--theme-surface-raised)) 0%, color-mix(in oklch, ${color} 8%, var(--theme-surface-raised)) 100%)`
                      : "var(--theme-surface-hover)",
                    border: `1px solid ${color ? `color-mix(in oklch, ${color} 30%, transparent)` : "var(--theme-border)"}`,
                  }}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                        style={{
                          background:
                            "color-mix(in oklch, var(--theme-primary) 15%, transparent)",
                          color: "var(--theme-primary)",
                        }}
                      >
                        <Sparkles className="h-3 w-3" />
                        Vandaag
                      </div>
                      {category && <span className="text-base">{category.icon}</span>}
                    </div>
                    <ChevronRight
                      className="text-theme-fg-muted h-4 w-4 shrink-0"
                      style={{ color: color ?? undefined }}
                    />
                  </div>
                  <div className="text-theme-fg leading-snug font-semibold">
                    {event.title}
                  </div>
                  {event.resource.description && (
                    <p className="text-theme-fg-muted mt-1 line-clamp-2 text-xs leading-relaxed">
                      {event.resource.description}
                    </p>
                  )}
                  {event.resource.originalEndDate &&
                    event.resource.originalEndDate > event.start && (
                      <div
                        className="mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{
                          background: color
                            ? `color-mix(in oklch, ${color} 15%, transparent)`
                            : "var(--theme-surface-hover)",
                          color: color ?? "var(--theme-fg-muted)",
                        }}
                      >
                        tot{" "}
                        {new Date(
                          event.resource.originalEndDate.slice(0, 10) + "T00:00:00"
                        ).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}
                      </div>
                    )}
                </button>
              );
            })}
          </div>
        )}

        {/* Divider between today and upcoming */}
        {todayEvents.length > 0 && upcomingEvents.length > 0 && (
          <div className="border-theme-border mb-3 border-t" />
        )}

        {/* Upcoming events — compact list */}
        {upcomingEvents.length > 0 && (
          <div className="space-y-0.5">
            {upcomingEvents.map((event) => {
              const category = event.resource.categories[0] ?? null;
              const color = category
                ? resolveCategoryColor(category.color, category.colorDark, isDark)
                : null;
              return (
                <button
                  key={event.id}
                  onClick={() => setSelectedEvent(parseCalendarEvent(event))}
                  className="hover:bg-theme-hover flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-150"
                >
                  {/* Vertical accent bar */}
                  <div
                    className="h-8 w-0.5 shrink-0 rounded-full"
                    style={{
                      background: color ?? "var(--theme-fg-subtle)",
                      opacity: color ? 1 : 0.3,
                    }}
                  />
                  {/* Date label */}
                  <div className="w-14 shrink-0 text-right">
                    <span className="text-theme-fg-muted text-[11px] font-medium tabular-nums">
                      {formatUpcomingDate(event.start)}
                    </span>
                  </div>
                  {/* Event info */}
                  <div className="min-w-0 flex-1">
                    <div className="text-theme-fg truncate text-sm font-medium">
                      {event.title}
                    </div>
                    {category && (
                      <div className="text-theme-fg-muted flex items-center gap-1 text-xs">
                        <span>{category.icon}</span>
                        <span>{category.displayName}</span>
                      </div>
                    )}
                  </div>
                  <ChevronRight className="text-theme-fg-subtle h-4 w-4 shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          isOpen
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </>
  );
}
