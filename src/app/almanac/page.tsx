"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { EventDetailModal } from "@/components/calendar";
import { PageLayout } from "@/components/layout";
import {
  AlmanacHeader,
  AlmanacFilters,
  MoonPhasesTimeline,
  MonthGrid,
  DayDetailsPanel,
} from "@/components/almanac";
import {
  formatDateISO,
  getMonthDays,
  getMonthStartPadding,
} from "@/lib/date-utils";
import type { DailyInfoResponse } from "@/types";
import type { CalendarEvent, CalendarEventResponse } from "@/types/calendar";
import { parseCalendarEvent } from "@/types/calendar";

// =============================================================================
// TYPES
// =============================================================================

interface MoonPhaseEvent {
  date: Date;
  type: "new" | "first_quarter" | "full" | "last_quarter";
  name: string;
  emoji: string;
}

// =============================================================================
// HELPERS
// =============================================================================

function getMoonPhaseEvents(monthData: DailyInfoResponse[]): MoonPhaseEvent[] {
  const events: MoonPhaseEvent[] = [];

  for (let i = 0; i < monthData.length; i++) {
    const day = monthData[i]!;
    const prev = monthData[i - 1];
    const next = monthData[i + 1];
    const date = new Date(day.date);

    // New moon (local minimum, < 5%)
    if (day.moonPhasePercent < 5) {
      const isPrevHigher = !prev || prev.moonPhasePercent >= day.moonPhasePercent;
      const isNextHigher = !next || next.moonPhasePercent >= day.moonPhasePercent;
      if (isPrevHigher && isNextHigher) {
        events.push({ date, type: "new", name: "Nieuwe Maan", emoji: "🌑" });
      }
    }
    // Full moon (local maximum, > 95%)
    else if (day.moonPhasePercent > 95) {
      const isPrevLower = !prev || prev.moonPhasePercent <= day.moonPhasePercent;
      const isNextLower = !next || next.moonPhasePercent <= day.moonPhasePercent;
      if (isPrevLower && isNextLower) {
        events.push({ date, type: "full", name: "Volle Maan", emoji: "🌕" });
      }
    }
    // First quarter (closest to 50% during waxing phase)
    else if (day.isWaxing && day.moonPhasePercent >= 45 && day.moonPhasePercent <= 55) {
      const distanceTo50 = Math.abs(day.moonPhasePercent - 50);
      const prevDistance = prev ? Math.abs(prev.moonPhasePercent - 50) : Infinity;
      const nextDistance = next ? Math.abs(next.moonPhasePercent - 50) : Infinity;

      if (distanceTo50 <= prevDistance && distanceTo50 <= nextDistance) {
        const wasPrevWaxing = !prev || prev.isWaxing;
        if (wasPrevWaxing) {
          events.push({ date, type: "first_quarter", name: "Eerste Kwartier", emoji: "🌓" });
        }
      }
    }
    // Last quarter (closest to 50% during waning phase)
    else if (!day.isWaxing && day.moonPhasePercent >= 45 && day.moonPhasePercent <= 55) {
      const distanceTo50 = Math.abs(day.moonPhasePercent - 50);
      const prevDistance = prev ? Math.abs(prev.moonPhasePercent - 50) : Infinity;
      const nextDistance = next ? Math.abs(next.moonPhasePercent - 50) : Infinity;

      if (distanceTo50 <= prevDistance && distanceTo50 <= nextDistance) {
        const wasPrevWaning = !prev || !prev.isWaxing;
        if (wasPrevWaning) {
          events.push({ date, type: "last_quarter", name: "Laatste Kwartier", emoji: "🌗" });
        }
      }
    }
  }

  return events.sort((a, b) => a.date.getTime() - b.date.getTime());
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function AlmanacPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [monthData, setMonthData] = useState<DailyInfoResponse[]>([]);
  const [monthEvents, setMonthEvents] = useState<CalendarEventResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [location, setLocation] = useState<string>("Den Haag");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Filters
  const [showMoonPhases, setShowMoonPhases] = useState(true);
  const [showSpecialDays, setShowSpecialDays] = useState(true);
  const [showEvents, setShowEvents] = useState(true);

  // Preserve scroll position when selecting dates
  const scrollPositionRef = useRef<number>(0);
  const isInitialMount = useRef(true);

  // Fetch month data
  const fetchMonthData = useCallback(async (y: number, m: number) => {
    setLoading(true);
    const controller = new AbortController();

    try {
      const firstDay = new Date(y, m, 1);
      const lastDay = new Date(y, m + 1, 0);
      const start = formatDateISO(firstDay);
      const end = formatDateISO(lastDay);

      const [dailyRes, eventsRes] = await Promise.all([
        fetch(`/api/daily-info?start=${start}&end=${end}`, { signal: controller.signal }),
        fetch(`/api/events?start=${start}T00:00:00.000Z&end=${end}T23:59:59.999Z`, {
          signal: controller.signal,
        }),
      ]);

      if (dailyRes.ok) {
        const data: DailyInfoResponse[] = await dailyRes.json();
        setMonthData(data);
        if (data[0]) {
          setLocation(data[0].locationName);
        }
      }

      if (eventsRes.ok) {
        const data: CalendarEventResponse[] = await eventsRes.json();
        setMonthEvents(data);
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        console.error("Error fetching month data:", error);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMonthData(year, month);
  }, [year, month, fetchMonthData]);

  // Preserve scroll position when selecting different dates within same month
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Save scroll position before state update (in next tick)
    const timer = requestAnimationFrame(() => {
      if (scrollPositionRef.current > 0) {
        window.scrollTo({ top: scrollPositionRef.current, behavior: 'instant' });
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
  const moonPhases = useMemo(() => getMoonPhaseEvents(monthData), [monthData]);

  // Extract special days from API response (server-calculated)
  const specialDays = useMemo(() =>
    monthData
      .filter(d => d.specialDay)
      .map(d => ({
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
    monthData.forEach(d => {
      const key = d.date.split("T")[0]!;
      map.set(key, d);
    });
    return map;
  }, [monthData]);

  const eventsMap = useMemo(() => {
    const map = new Map<string, CalendarEventResponse[]>();
    monthEvents.forEach(e => {
      const key = e.start.split("T")[0]!;
      const existing = map.get(key) || [];
      existing.push(e);
      map.set(key, existing);
    });
    return map;
  }, [monthEvents]);

  const specialDaysMap = useMemo(() => {
    const map = new Map<string, typeof specialDays[0][]>();
    specialDays.forEach(s => {
      const key = formatDateISO(s.date);
      const existing = map.get(key) || [];
      existing.push(s);
      map.set(key, existing);
    });
    return map;
  }, [specialDays]);

  const moonPhasesMap = useMemo(() => {
    const map = new Map<string, MoonPhaseEvent>();
    moonPhases.forEach(p => {
      map.set(formatDateISO(p.date), p);
    });
    return map;
  }, [moonPhases]);

  // Selected day data
  const selectedDateStr = formatDateISO(selectedDate);
  const selectedDayInfo = dailyInfoMap.get(selectedDateStr);
  const selectedDayEvents = eventsMap.get(selectedDateStr) || [];
  const selectedDaySpecial = specialDaysMap.get(selectedDateStr) || [];

  // Handlers
  const handleToggleFilter = useCallback((filter: "moonPhases" | "specialDays" | "events") => {
    if (filter === "moonPhases") setShowMoonPhases(v => !v);
    if (filter === "specialDays") setShowSpecialDays(v => !v);
    if (filter === "events") setShowEvents(v => !v);
  }, []);

  const handleEventClick = (event: CalendarEventResponse) => {
    setSelectedEvent(parseCalendarEvent(event));
  };

  const handleCloseModal = () => {
    setSelectedEvent(null);
  };

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
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-theme-primary-20 border-t-theme-primary" />
            <span className="text-sm text-theme-fg-muted">Laden...</span>
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
      <EventDetailModal
        event={selectedEvent!}
        isOpen={!!selectedEvent}
        onClose={handleCloseModal}
      />
    </PageLayout>
  );
}
