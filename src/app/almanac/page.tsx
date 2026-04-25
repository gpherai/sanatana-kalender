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
import {
  formatDateLocal,
  getMonthDays,
  getMonthStartPadding,
  parseCalendarDate,
} from "@/lib/date-utils";
import type { DailyInfoResponse } from "@/types";
import type { CalendarEvent, CalendarEventResponse } from "@/types/calendar";
import { parseCalendarEvent } from "@/types/calendar";
import { DEFAULT_LOCATION } from "@/lib/domain";

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
      date: parseCalendarDate(d.date.split("T")[0]!),
      type: d.moonPhaseEvent!.type,
      ...MOON_PHASE_META[d.moonPhaseEvent!.type],
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

// =============================================================================
// SESSION CACHE (module-level — survives re-renders, reset on page reload)
// =============================================================================

const monthDataCache = new Map<string, DailyInfoResponse[]>();
const eventsDataCache = new Map<string, CalendarEventResponse[]>();

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
  const cacheKey = `${year}-${month}`;
  const cachedDailyInfo = monthDataCache.get(cacheKey) ?? null;
  const cachedEvents = eventsDataCache.get(cacheKey) ?? null;

  const {
    data: fetchedMonthData,
    loading: dailyLoading,
    error: dailyError,
  } = useFetch<DailyInfoResponse[]>(`/api/daily-info?start=${start}&end=${end}`, {
    skip: !!cachedDailyInfo,
  });
  const { data: fetchedMonthEvents, loading: eventsLoading } = useFetch<
    CalendarEventResponse[]
  >(`/api/events?start=${start}&end=${end}`, {
    skip: !!cachedEvents,
  });
  const monthData = cachedDailyInfo ?? fetchedMonthData;
  const monthEvents = cachedEvents ?? fetchedMonthEvents;
  const loading = dailyLoading || eventsLoading;
  const error = dailyError;
  const location = monthData?.[0]?.locationName ?? DEFAULT_LOCATION.name;

  // Preserve scroll position when selecting different dates within same month
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const timer = requestAnimationFrame(() => {
      if (scrollPositionRef.current > 0) {
        window.scrollTo({ top: scrollPositionRef.current, behavior: "instant" });
      }
    });

    return () => cancelAnimationFrame(timer);
  }, [selectedDate]);

  // Store fetched results in session cache once loaded
  useEffect(() => {
    if (fetchedMonthData) monthDataCache.set(cacheKey, fetchedMonthData);
  }, [cacheKey, fetchedMonthData]);

  useEffect(() => {
    if (fetchedMonthEvents) eventsDataCache.set(cacheKey, fetchedMonthEvents);
  }, [cacheKey, fetchedMonthEvents]);

  // Prefetch prev and next month in the background after current month loads
  useEffect(() => {
    if (!monthData || !monthEvents) return;
    const prefetch = (y: number, m: number) => {
      const key = `${y}-${m}`;
      const fd = new Date(y, m, 1);
      const ld = new Date(y, m + 1, 0);
      const s = formatDateLocal(fd);
      const e = formatDateLocal(ld);
      if (!monthDataCache.has(key)) {
        fetch(`/api/daily-info?start=${s}&end=${e}`)
          .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
          .then((data: DailyInfoResponse[]) => {
            monthDataCache.set(key, data);
          })
          .catch(() => {});
      }
      if (!eventsDataCache.has(key)) {
        fetch(`/api/events?start=${s}&end=${e}`)
          .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
          .then((data: CalendarEventResponse[]) => {
            eventsDataCache.set(key, data);
          })
          .catch(() => {});
      }
    };
    const prevY = month === 0 ? year - 1 : year;
    const prevM = month === 0 ? 11 : month - 1;
    const nextY = month === 11 ? year + 1 : year;
    const nextM = month === 11 ? 0 : month + 1;
    prefetch(prevY, prevM);
    prefetch(nextY, nextM);
  }, [year, month, monthData, monthEvents]);

  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);

  // Save scroll position before date selection
  const handleDateSelect = useCallback((date: Date) => {
    scrollPositionRef.current = window.scrollY;
    setSelectedDate(date);
    setMobilePanelOpen(true);
  }, []);

  const handleCloseMobilePanel = useCallback(() => setMobilePanelOpen(false), []);

  // Month/year navigation: atomically select dag 1 and close mobile panel
  const handleYearChange = useCallback(
    (y: number) => {
      setYear(y);
      setSelectedDate(new Date(y, month, 1));
      setMobilePanelOpen(false);
    },
    [month]
  );

  const handleMonthChange = useCallback(
    (m: number) => {
      setMonth(m);
      setSelectedDate(new Date(year, m, 1));
      setMobilePanelOpen(false);
    },
    [year]
  );

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
          date: parseCalendarDate(d.date.split("T")[0]!),
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

  // Yoga and karana start times: the start of today's element = end of yesterday's element
  const yogaStartTime = useMemo(() => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    return dailyInfoMap.get(formatDateLocal(prev))?.yoga?.endTime ?? null;
  }, [selectedDate, dailyInfoMap]);

  const karanaStartTime = useMemo(() => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    return dailyInfoMap.get(formatDateLocal(prev))?.karana?.endTime ?? null;
  }, [selectedDate, dailyInfoMap]);

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
        onYearChange={handleYearChange}
        onMonthChange={handleMonthChange}
        onToggleFilter={handleToggleFilter}
      />

      {error ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="text-theme-fg text-sm font-medium">
              Kon almanac niet laden
            </span>
            <span className="text-theme-fg-muted text-xs">{error.message}</span>
            <button
              onClick={() => window.location.reload()}
              className="bg-theme-primary mt-1 rounded-lg px-4 py-2 text-sm text-white hover:opacity-90"
            >
              Opnieuw proberen
            </button>
          </div>
        </div>
      ) : loading ? (
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

          {/* Right Panel - Day Details (bottom sheet on mobile) */}
          <DayDetailsPanel
            selectedDate={selectedDate}
            selectedDayInfo={selectedDayInfo}
            selectedDayEvents={selectedDayEvents}
            selectedDaySpecial={selectedDaySpecial}
            onEventClick={handleEventClick}
            showEvents={showEvents}
            showSpecialDays={showSpecialDays}
            isOpen={mobilePanelOpen}
            onClose={handleCloseMobilePanel}
            yogaStartTime={yogaStartTime}
            karanaStartTime={karanaStartTime}
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
