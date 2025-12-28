"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Calendar, dateFnsLocalizer, View, DateHeaderProps } from "react-big-calendar";
import {
  format,
  parse,
  startOfWeek,
  getDay,
  startOfMonth,
  endOfMonth,
  addMonths,
} from "date-fns";
import { nl } from "date-fns/locale";
import {
  CalendarEvent,
  CalendarEventResponse,
  parseCalendarEvent,
} from "@/types/calendar";
import { getEventType } from "@/lib/constants";
import { logError, formatDateLocal } from "@/lib/utils";
import { getMoonPhaseEmoji } from "@/lib/date-utils";
import { EventDetailModal } from "./EventDetailModal";
import { CalendarToolbar } from "./CalendarToolbar";

import "react-big-calendar/lib/css/react-big-calendar.css";
import "./calendar.css";

// date-fns localizer setup
const locales = { nl };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }), // Monday
  getDay,
  locales,
});

/**
 * Custom date header component showing moon phase
 */
function DateHeader({ date }: DateHeaderProps) {
  const { emoji: moonEmoji, isSpecial: specialDay } = getMoonPhaseEmoji(date);
  const isToday = new Date().toDateString() === date.toDateString();

  return (
    <div className="flex w-full items-center justify-between px-1">
      <span
        className={`text-sm font-medium ${isToday ? "rounded-full bg-orange-500 px-2 py-0.5 text-white" : ""} `}
      >
        {date.getDate()}
      </span>
      <span
        className={`text-xs transition-transform hover:scale-125 ${specialDay === "full" ? "animate-pulse text-lg" : ""} ${specialDay === "new" ? "opacity-50" : ""} `}
        title={`Maanfase: ${moonEmoji}`}
      >
        {moonEmoji}
      </span>
    </div>
  );
}

export function DharmaCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<View>("month");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Fetch events for the current month range
  const fetchEvents = useCallback(async (date: Date) => {
    setLoading(true);
    try {
      // Get range with buffer for multi-day events
      const start = startOfMonth(addMonths(date, -1));
      const end = endOfMonth(addMonths(date, 1));

      // ← FIX: Use formatDateLocal to prevent UTC timezone shifts
      const startStr = formatDateLocal(start);
      const endStr = formatDateLocal(end);

      const response = await fetch(
        `/api/events?start=${startStr}T00:00:00.000Z&end=${endStr}T23:59:59.999Z`
      );

      if (!response.ok) throw new Error("Failed to fetch events");

      const data: CalendarEventResponse[] = await response.json();
      setEvents(data.map(parseCalendarEvent));
    } catch (error) {
      logError("Failed to fetch calendar events", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch events on mount and when date changes
  useEffect(() => {
    fetchEvents(currentDate);
  }, [currentDate, fetchEvents]);

  // Navigate to different month
  const handleNavigate = useCallback((newDate: Date) => {
    setCurrentDate(newDate);
  }, []);

  // Handle view change
  const handleViewChange = useCallback((newView: View) => {
    setView(newView);
  }, []);

  // Handle event click
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
  }, []);

  // Close modal
  const handleCloseModal = useCallback(() => {
    setSelectedEvent(null);
  }, []);

  // Custom event styling based on category
  // Category is now a full object, not a string
  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const categoryData = event.resource.category;

    // Base style
    const style: React.CSSProperties = {
      backgroundColor: categoryData?.color ?? "oklch(0.6 0.15 250)",
      borderRadius: "4px",
      opacity: 0.9,
      color: "white",
      border: "none",
      display: "block",
      fontSize: "0.75rem",
      padding: "2px 4px",
    };

    // Add importance indicator
    if (event.resource.importance === "MAJOR") {
      style.fontWeight = "bold";
    }

    return { style };
  }, []);

  // Custom day cell styling for weekends
  // Note: Special moon days (Purnima, Amavasya, etc.) are now detected
  // via exact Panchanga data in the Almanac page
  const dayPropGetter = useCallback((date: Date) => {
    const day = date.getDay();
    const isWeekend = day === 0 || day === 6;

    let backgroundColor = "";
    const className = "";

    if (isWeekend) {
      backgroundColor = "oklch(0.97 0.01 60)";
    }

    return {
      style: backgroundColor ? { backgroundColor } : undefined,
      className,
    };
  }, []);

  // Event content with emoji
  // Category is now a full object, not a string
  const EventComponent = useCallback(({ event }: { event: CalendarEvent }) => {
    const categoryData = event.resource.category;
    const eventTypeData = getEventType(event.resource.eventType);

    return (
      <span className="flex items-center gap-1 truncate">
        <span>{categoryData?.icon ?? eventTypeData?.icon ?? "📅"}</span>
        <span className="truncate">{event.title}</span>
      </span>
    );
  }, []);

  // Memoize components to prevent re-renders
  const components = useMemo(
    () => ({
      toolbar: CalendarToolbar,
      event: EventComponent,
      month: {
        dateHeader: DateHeader,
      },
    }),
    [EventComponent]
  );

  return (
    <div className="relative h-[calc(100vh-12rem)] min-h-[500px]">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-theme-surface-overlay">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--theme-spinner-track)] border-t-[var(--theme-spinner-fill)]" />
            <div className="text-sm text-theme-fg-muted">Laden...</div>
          </div>
        </div>
      )}

      <Calendar<CalendarEvent>
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        date={currentDate}
        view={view}
        onNavigate={handleNavigate}
        onView={handleViewChange}
        onSelectEvent={handleSelectEvent}
        eventPropGetter={eventStyleGetter}
        dayPropGetter={dayPropGetter}
        components={components}
        messages={{
          today: "Vandaag",
          previous: "Vorige",
          next: "Volgende",
          month: "Maand",
          week: "Week",
          day: "Dag",
          agenda: "Agenda",
          noEventsInRange: "Geen evenementen in deze periode",
        }}
        popup
        selectable={false}
        className="dharma-calendar"
      />

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          isOpen={!!selectedEvent}
          onClose={handleCloseModal}
          onDeleted={() => fetchEvents(currentDate)}
        />
      )}
    </div>
  );
}
