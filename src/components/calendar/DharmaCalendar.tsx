"use client";

import {
  useState,
  useCallback,
  useEffect,
  useMemo,
  createContext,
  useContext,
} from "react";
import { useFetch } from "@/hooks/useFetch";
import { Calendar, dateFnsLocalizer, View, DateHeaderProps } from "react-big-calendar";
import {
  format,
  parse,
  startOfWeek,
  getDay,
  startOfMonth,
  endOfMonth,
  endOfWeek,
  addMonths,
} from "date-fns";
import { nl } from "date-fns/locale";
import {
  CalendarEvent,
  CalendarEventResponse,
  parseCalendarEvent,
} from "@/types/calendar";
import { getEventType } from "@/lib/domain";
import { logError } from "@/lib/utils";
import {
  FALLBACK_CATEGORY_COLOR,
  getContrastTextColor,
  resolveCategoryColor,
} from "@/lib/category-styles";
import { useTheme } from "@/components/theme/ThemeProvider";
import { formatDateLocal } from "@/lib/date-utils";
import type { DailyInfoResponse } from "@/types";
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

type MoonCellData = { emoji: string; isSpecial: "full" | "new" | null };
const MoonDataContext = createContext<Map<string, MoonCellData>>(new Map());
const CALENDAR_VIEWS: readonly View[] = ["month", "week", "day", "agenda"];

function isCalendarView(value: unknown): value is View {
  return typeof value === "string" && CALENDAR_VIEWS.includes(value as View);
}

/**
 * Custom date header component showing moon phase (exact via Swiss Ephemeris API data)
 */
function DateHeader({ date }: DateHeaderProps) {
  const moonData = useContext(MoonDataContext);
  const key = formatDateLocal(date);
  const moon = moonData.get(key);
  const moonEmoji = moon?.emoji ?? "";
  const specialDay = moon?.isSpecial ?? null;
  const isToday = new Date().toDateString() === date.toDateString();

  return (
    <div className="flex w-full items-center justify-between px-1">
      <span
        className={`text-sm font-medium ${isToday ? "bg-theme-primary rounded-full px-2 py-0.5 text-white" : ""} `}
      >
        {date.getDate()}
      </span>
      <span
        className={`text-xs ${specialDay === "full" ? "text-lg" : ""} ${specialDay === "new" ? "opacity-50" : ""} `}
        title={`Maanfase: ${moonEmoji}`}
      >
        {moonEmoji}
      </span>
    </div>
  );
}

export function DharmaCalendar() {
  const [mounted, setMounted] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<View>("month");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [eventsError, setEventsError] = useState(false);
  const { resolvedColorMode } = useTheme();
  const isDark = resolvedColorMode === "dark";

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: SSR hydration guard
    setMounted(true);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadDefaultView() {
      try {
        const response = await fetch("/api/preferences", {
          signal: controller.signal,
        });
        if (!response.ok) return;

        const preferences = (await response.json()) as { defaultView?: unknown };
        if (isCalendarView(preferences.defaultView)) {
          setView(preferences.defaultView);
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
      }
    }

    void loadDefaultView();

    return () => {
      controller.abort();
    };
  }, []);

  // Build URL for current month range (with ±1 month buffer for multi-day events)
  const eventsUrl = useMemo(() => {
    const start = startOfMonth(addMonths(currentDate, -1));
    const end = endOfMonth(addMonths(currentDate, 1));
    return `/api/events?start=${formatDateLocal(start)}&end=${formatDateLocal(end)}`;
  }, [currentDate]);

  // Daily-info for the full calendar grid (including overflow days from adjacent months)
  const dailyInfoUrl = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
    return `/api/daily-info?start=${formatDateLocal(start)}&end=${formatDateLocal(end)}`;
  }, [currentDate]);

  const {
    data: eventsData,
    loading,
    refetch,
  } = useFetch<CalendarEventResponse[]>(eventsUrl, {
    onSuccess: () => setEventsError(false),
    onError: (err) => {
      logError("Failed to fetch calendar events", err);
      setEventsError(true);
    },
  });
  const events = useMemo(() => eventsData?.map(parseCalendarEvent) ?? [], [eventsData]);

  const { data: monthDailyInfo } = useFetch<DailyInfoResponse[]>(dailyInfoUrl);
  const moonDataMap = useMemo(() => {
    const map = new Map<string, MoonCellData>();
    (monthDailyInfo ?? []).forEach((d) => {
      const key = d.date.split("T")[0]!;
      const type = d.moonPhaseEvent?.type ?? null;
      map.set(key, {
        emoji: d.moonPhaseEmoji,
        isSpecial: type === "full" ? "full" : type === "new" ? "new" : null,
      });
    });
    return map;
  }, [monthDailyInfo]);

  // Navigate to different month
  const handleNavigate = useCallback((newDate: Date) => {
    setCurrentDate(newDate);
    setEventsError(false);
  }, []);

  const handleRetryEvents = useCallback(() => {
    setEventsError(false);
    refetch();
  }, [refetch]);

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
  const eventStyleGetter = useCallback(
    (event: CalendarEvent) => {
      const categoryData = event.resource.categories[0] ?? null;
      const backgroundColor = categoryData
        ? resolveCategoryColor(categoryData.color, categoryData.colorDark, isDark)
        : FALLBACK_CATEGORY_COLOR;

      // Base style
      const style: React.CSSProperties = {
        backgroundColor,
        borderRadius: "999px",
        opacity: 1,
        color: getContrastTextColor(backgroundColor),
        border: "none",
        display: "block",
        fontSize: "0.75rem",
        padding: "2px 4px",
      };

      return { style };
    },
    [isDark]
  );

  // Custom day cell styling for weekends and moon phase days
  const dayPropGetter = useCallback(
    (date: Date) => {
      const day = date.getDay();
      const isWeekend = day === 0 || day === 6;

      const key = formatDateLocal(date);
      const moon = moonDataMap.get(key);
      let className = "";
      if (moon?.isSpecial === "full") className = "full-moon-day";
      else if (moon?.isSpecial === "new") className = "new-moon-day";

      return {
        style: isWeekend
          ? { backgroundColor: "var(--theme-calendar-weekend-bg)" }
          : undefined,
        className,
      };
    },
    [moonDataMap]
  );

  // Event content with emoji
  // Category is now a full object, not a string
  const EventComponent = useCallback(({ event }: { event: CalendarEvent }) => {
    const categoryData = event.resource.categories[0] ?? null;
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
    <div className="relative h-[calc(100svh-1rem)] min-h-[850px]">
      {(!mounted || loading) && (
        <div className="bg-theme-surface-overlay absolute inset-0 z-10 flex items-center justify-center rounded-xl">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--theme-spinner-track)] border-t-[var(--theme-spinner-fill)] motion-reduce:animate-none" />
            <div className="text-theme-fg-muted text-sm">Laden...</div>
          </div>
        </div>
      )}

      {eventsError && !loading && (
        <div className="absolute inset-x-0 top-4 z-10 flex justify-center px-4">
          <div className="flex items-center gap-2 rounded-xl border border-[var(--theme-error)] bg-[var(--theme-error-bg)] px-4 py-2.5 text-sm text-[var(--theme-error-fg)] shadow-md">
            <span>Kon events niet laden.</span>
            <button
              type="button"
              onClick={handleRetryEvents}
              className="font-medium underline hover:no-underline"
            >
              Opnieuw proberen
            </button>
          </div>
        </div>
      )}

      {mounted && (
        <MoonDataContext.Provider value={moonDataMap}>
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
        </MoonDataContext.Provider>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          isOpen
          onClose={handleCloseModal}
          onDeleted={refetch}
        />
      )}
    </div>
  );
}
