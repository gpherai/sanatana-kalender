"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useFetch } from "@/hooks/useFetch";
import { EventDetailModal } from "@/components/calendar/EventDetailModal";
import { PageLayout } from "@/components/layout";
import {
  AlmanacHeader,
  AlmanacFilters,
  MoonPhasesTimeline,
  MonthGrid,
  DayDetailsPanel,
} from "@/components/almanac";
import type { MoonPhaseEvent } from "@/components/almanac";
import { formatDateLocal, getMonthDays, getMonthStartPadding } from "@/lib/date-utils";
import type { DailyInfoResponse } from "@/types";
import type { CalendarEvent, CalendarEventResponse } from "@/types/calendar";
import { parseCalendarEvent } from "@/types/calendar";

// =============================================================================
// HELPERS
// =============================================================================

const MOON_PHASE_META: Record<
  "new" | "first_quarter" | "full" | "last_quarter",
  { name: string; emoji: string }
> = {
  new: { name: "Nieuwe Maan", emoji: "🌑" },
  first_quarter: { name: "Eerste Kwartier", emoji: "🌓" },
  full: { name: "Volle Maan", emoji: "🌕" },
  last_quarter: { name: "Laatste Kwartier", emoji: "🌗" },
};

function getMoonPhaseEvents(monthData: DailyInfoResponse[]): MoonPhaseEvent[] {
  return monthData
    .filter((d) => d.moonPhaseEvent)
    .map((d) => ({
      date: new Date(d.date + "T12:00:00"),
      type: d.moonPhaseEvent!.type,
      ...MOON_PHASE_META[d.moonPhaseEvent!.type],
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function AlmanacPage() {
  const [today, setToday] = useState(() => new Date());
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  // Refresh "today" at midnight so isToday() checks stay accurate
  useEffect(() => {
    const now = new Date();
    const msUntilMidnight =
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() -
      now.getTime();
    const timer = setTimeout(() => setToday(new Date()), msUntilMidnight);
    return () => clearTimeout(timer);
  }, [today]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Filters
  const [showMoonPhases, setShowMoonPhases] = useState(true);
  const [showSpecialDays, setShowSpecialDays] = useState(true);
  const [showEvents, setShowEvents] = useState(true);

  // Preserve scroll position when selecting dates
  const scrollPositionRef = useRef<number>(0);
  const isInitialMount = useRef(true);

  // Fetch month data
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const start = formatDateLocal(firstDay);
  const end = formatDateLocal(lastDay);

  const { data: monthData, loading: dailyLoading } = useFetch<DailyInfoResponse[]>(
    `/api/daily-info?start=${start}&end=${end}`
  );
  const { data: monthEvents, loading: eventsLoading } = useFetch<CalendarEventResponse[]>(
    `/api/events?start=${start}T00:00:00.000Z&end=${end}T23:59:59.999Z`
  );
  const loading = dailyLoading || eventsLoading;
  const location = monthData?.[0]?.locationName ?? "Den Haag";

  // Preserve scroll position when selecting different dates within same month
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Save scroll position before state update (in next tick)
    const timer = requestAnimationFrame(() => {
      if (scrollPositionRef.current > 0) {
        window.scrollTo({ top: scrollPositionRef.current, behavior: "instant" });
      }
    });

    return () => cancelAnimationFrame(timer);
  }, [selectedDate]);

  // Save scroll position before date selection
  const handleDateSelect = useCallback((date: Date) => {
    scrollPositionRef.current = window.scrollY;
    setSelectedDate(date);
  }, []);

  // Derived data
  const days = useMemo(() => getMonthDays(year, month), [year, month]);
  const startPadding = useMemo(() => getMonthStartPadding(year, month), [year, month]);
  const moonPhases = useMemo(() => getMoonPhaseEvents(monthData ?? []), [monthData]);

  // Extract special days from API response (server-calculated)
  const specialDays = useMemo(
    () =>
      (monthData ?? [])
        .filter((d) => d.specialDay)
        .map((d) => ({
          date: new Date(d.date),
          type: d.specialDay!.type,
          name: d.specialDay!.name,
          description: d.specialDay!.description,
          emoji: d.specialDay!.emoji,
        })),
    [monthData]
  );

  // Create maps for quick lookup
  const dailyInfoMap = useMemo(() => {
    const map = new Map<string, DailyInfoResponse>();
    (monthData ?? []).forEach((d) => {
      const key = d.date.split("T")[0]!;
      map.set(key, d);
    });
    return map;
  }, [monthData]);

  const eventsMap = useMemo(() => {
    const map = new Map<string, CalendarEventResponse[]>();
    (monthEvents ?? []).forEach((e) => {
      const startKey = e.start.split("T")[0]!;
      const endKey = e.resource.originalEndDate ?? startKey;
      // Add event to every calendar day it spans (handles tithi spanning + multi-day festivals)
      let current = new Date(startKey + "T00:00:00Z");
      const end = new Date(endKey + "T00:00:00Z");
      while (current <= end) {
        const key = formatDateLocal(current);
        const existing = map.get(key) ?? [];
        existing.push(e);
        map.set(key, existing);
        current = new Date(current.getTime() + 24 * 60 * 60 * 1000);
      }
    });
    return map;
  }, [monthEvents]);

  const specialDaysMap = useMemo(() => {
    const map = new Map<string, (typeof specialDays)[0][]>();
    specialDays.forEach((s) => {
      const key = formatDateLocal(s.date);
      const existing = map.get(key) ?? [];
      existing.push(s);
      map.set(key, existing);
    });
    return map;
  }, [specialDays]);

  const moonPhasesMap = useMemo(() => {
    const map = new Map<string, MoonPhaseEvent>();
    moonPhases.forEach((p) => {
      map.set(formatDateLocal(p.date), p);
    });
    return map;
  }, [moonPhases]);

  // Selected day data
  const selectedDateStr = formatDateLocal(selectedDate);
  const selectedDayInfo = dailyInfoMap.get(selectedDateStr);
  const rawSelectedDayEvents = eventsMap.get(selectedDateStr) ?? [];
  // Angarki suppression: when Angarki Chaturthi is present, hide generic named
  // Sankashti events (those tagged "sankashti" but not "angaraka" or "sakat").
  // Sakat Chauth and other named festivals survive — only the monthly Sankashti
  // variants are redundant on an Angarki day.
  const hasAngarki = rawSelectedDayEvents.some((e) =>
    e.resource.tags.includes("angaraka")
  );
  const selectedDayEvents = hasAngarki
    ? rawSelectedDayEvents.filter(
        (e) =>
          !e.resource.tags.includes("sankashti") ||
          e.resource.tags.includes("angaraka") ||
          e.resource.tags.includes("sakat")
      )
    : rawSelectedDayEvents;
  const selectedDaySpecial = specialDaysMap.get(selectedDateStr) ?? [];

  // Handlers
  const handleToggleFilter = useCallback(
    (filter: "moonPhases" | "specialDays" | "events") => {
      if (filter === "moonPhases") setShowMoonPhases((v) => !v);
      if (filter === "specialDays") setShowSpecialDays((v) => !v);
      if (filter === "events") setShowEvents((v) => !v);
    },
    []
  );

  const handleEventClick = useCallback((event: CalendarEventResponse) => {
    setSelectedEvent(parseCalendarEvent(event));
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedEvent(null);
  }, []);

  return (
    <PageLayout>
      <AlmanacHeader location={location} />

      <AlmanacFilters
        year={year}
        month={month}
        showMoonPhases={showMoonPhases}
        showSpecialDays={showSpecialDays}
        showEvents={showEvents}
        onYearChange={setYear}
        onMonthChange={setMonth}
        onToggleFilter={handleToggleFilter}
      />

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="border-theme-primary-20 border-t-theme-primary h-12 w-12 animate-spin rounded-full border-4" />
            <span className="text-theme-fg-muted text-sm">Laden...</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Main Calendar - Larger width */}
          <div className="flex-[2] space-y-6">
            {showMoonPhases && (
              <MoonPhasesTimeline
                moonPhases={moonPhases}
                month={month}
                selectedDate={selectedDate}
                onSelectDate={handleDateSelect}
              />
            )}

            <MonthGrid
              year={year}
              month={month}
              days={days}
              startPadding={startPadding}
              dailyInfoMap={dailyInfoMap}
              eventsMap={eventsMap}
              specialDaysMap={specialDaysMap}
              moonPhasesMap={moonPhasesMap}
              selectedDate={selectedDate}
              onSelectDate={handleDateSelect}
              showMoonPhases={showMoonPhases}
              showSpecialDays={showSpecialDays}
              showEvents={showEvents}
            />
          </div>

          {/* Right Panel - Day Details */}
          <DayDetailsPanel
            selectedDate={selectedDate}
            selectedDayInfo={selectedDayInfo}
            selectedDayEvents={selectedDayEvents}
            selectedDaySpecial={selectedDaySpecial}
            onEventClick={handleEventClick}
            showEvents={showEvents}
            showSpecialDays={showSpecialDays}
          />
        </div>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          isOpen={true}
          onClose={handleCloseModal}
        />
      )}
    </PageLayout>
  );
}
