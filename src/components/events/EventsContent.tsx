"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { FocusTrap } from "focus-trap-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  LayoutGrid,
  List,
  SlidersHorizontal,
  Calendar,
  CalendarOff,
  ArrowUpDown,
} from "lucide-react";
import { FilterSidebar } from "@/components/filters";
import { EventDetailModal } from "@/components/calendar/EventDetailModal";
import { EventCard } from "@/components/events/EventCard";
import { PageLayout } from "@/components/layout";
import { useFilters, type FilterState } from "@/hooks/useFilters";
import type { CalendarEvent, CalendarEventResponse } from "@/types/calendar";
import { parseCalendarEvent } from "@/types/calendar";
import { parseLocalDate } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { useOverlayHistory } from "@/hooks/useOverlayHistory";
import { useScrollLock } from "@/hooks/useScrollLock";
import { groupChildrenUnderParents } from "@/lib/events";

type ViewMode = "grid" | "list";

// Reverse the order of top-level groups (parents + their children) without
// breaking the parent-before-children invariant required for series events.
function applySortDirection(
  events: CalendarEventResponse[],
  order: "asc" | "desc"
): CalendarEventResponse[] {
  if (order === "asc") return events;
  const groups: CalendarEventResponse[][] = [];
  for (const event of events) {
    if (event.resource.seriesParentEventIds.length > 0) {
      groups[groups.length - 1]!.push(event);
    } else {
      groups.push([event]);
    }
  }
  return groups.reverse().flat();
}

function applyFilters(
  events: CalendarEventResponse[],
  filters: FilterState
): CalendarEventResponse[] {
  let result = events;

  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.resource.description?.toLowerCase().includes(q)
    );
  }

  if (filters.dateFrom) {
    result = result.filter((e) => e.start >= filters.dateFrom);
  }
  if (filters.dateTo) {
    result = result.filter((e) => e.start <= filters.dateTo);
  }

  if (filters.categories.length > 0) {
    const catSet = new Set(filters.categories);
    result = result.filter((e) => e.resource.categories.some((c) => catSet.has(c.name)));
  }

  if (filters.eventTypes.length > 0) {
    const typeSet = new Set(filters.eventTypes);
    result = result.filter((e) => typeSet.has(e.resource.eventType));
  }

  if (filters.specialTithis.length > 0) {
    const tithiSet = new Set(filters.specialTithis);
    result = result.filter((e) => e.resource.tithi && tithiSet.has(e.resource.tithi));
  }

  return result;
}

interface EventsContentProps {
  initialEvents: CalendarEventResponse[];
}

export function EventsContent({ initialEvents }: EventsContentProps) {
  const router = useRouter();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showFilters, setShowFilters] = useState(false);

  const handleCloseFilters = useCallback(() => setShowFilters(false), []);
  const { requestClose: requestCloseFilters } = useOverlayHistory({
    isOpen: showFilters,
    onClose: handleCloseFilters,
    stateKey: "events-filter-sheet",
  });

  const filterTouchStartY = useRef(0);
  const handleFilterTouchStart = useCallback((e: React.TouchEvent) => {
    filterTouchStartY.current = e.touches[0]!.clientY;
  }, []);
  const handleFilterTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const dy = e.changedTouches[0]!.clientY - filterTouchStartY.current;
      if (dy > 80) requestCloseFilters();
    },
    [requestCloseFilters]
  );

  const filterSheetRef = useRef<HTMLDivElement>(null);

  // ESC to close filter sheet
  useEffect(() => {
    if (!showFilters) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestCloseFilters();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showFilters, requestCloseFilters]);

  // Body scroll-lock while filter sheet is open
  useScrollLock(showFilters);

  const { filters, setFilter, toggleFilter, clearFilters, activeFilterCount } =
    useFilters();

  const events = useMemo(
    () =>
      applySortDirection(
        groupChildrenUnderParents(applyFilters(initialEvents, filters)),
        filters.sortOrder
      ),
    [initialEvents, filters]
  );

  const handleEventClick = (event: CalendarEventResponse) => {
    setSelectedEvent(parseCalendarEvent(event));
  };

  const handleCloseModal = () => setSelectedEvent(null);
  const handleEventDeleted = () => router.refresh();

  return (
    <PageLayout>
      {/* Page Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-theme-primary mb-1 font-serif text-sm font-medium tracking-wide opacity-80">
            उत्सव · Utsava
          </p>
          <h1 className="text-theme-fg text-3xl font-bold">Events</h1>
          <p className="text-theme-fg-muted mt-1 text-sm">
            {events.length} event{events.length !== 1 && "s"} gevonden
            {activeFilterCount > 0 && (
              <span className="text-theme-primary">
                {" "}
                • {activeFilterCount} filter{activeFilterCount !== 1 && "s"} actief
              </span>
            )}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Sort direction toggle */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() =>
                setFilter("sortOrder", filters.sortOrder === "asc" ? "desc" : "asc")
              }
              style={{ touchAction: "manipulation" }}
              className={cn(
                "bg-theme-surface-raised border-theme-border focus-visible:ring-theme-primary flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border transition-colors focus-visible:ring-2 focus-visible:outline-none",
                filters.sortOrder === "desc"
                  ? "text-theme-primary"
                  : "text-theme-fg-muted hover:text-theme-fg"
              )}
              title={filters.sortOrder === "asc" ? "Oplopend" : "Aflopend"}
            >
              <ArrowUpDown className="h-4 w-4" />
            </button>
          </div>

          {/* View Toggle */}
          <div className="bg-theme-surface-raised flex items-center rounded-lg p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              style={{ touchAction: "manipulation" }}
              className={cn(
                "focus-visible:ring-theme-primary flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none",
                viewMode === "grid"
                  ? "bg-theme-primary-15 text-theme-primary"
                  : "text-theme-fg-muted hover:text-theme-fg"
              )}
              title="Grid weergave"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              style={{ touchAction: "manipulation" }}
              className={cn(
                "focus-visible:ring-theme-primary flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none",
                viewMode === "list"
                  ? "bg-theme-primary-15 text-theme-primary"
                  : "text-theme-fg-muted hover:text-theme-fg"
              )}
              title="Lijst weergave"
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {/* Filter Toggle (mobile) */}
          <button
            type="button"
            onClick={() => {
              if (showFilters) {
                requestCloseFilters();
                return;
              }
              setShowFilters(true);
            }}
            className={cn(
              "focus-visible:ring-theme-primary flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg px-3 py-2 transition-colors focus-visible:ring-2 focus-visible:outline-none lg:hidden",
              showFilters
                ? "bg-theme-primary-15 text-theme-primary"
                : "bg-theme-surface-raised text-theme-fg-muted"
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {activeFilterCount > 0 && (
              <span className="bg-theme-primary text-theme-primary-fg flex h-5 w-5 items-center justify-center rounded-full text-xs">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* New Event Button */}
          <Link
            href="/events/new"
            className="bg-theme-primary shadow-theme-primary text-theme-primary-fg flex items-center gap-2 rounded-xl px-4 py-2 font-medium shadow-lg transition-all hover:opacity-90 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nieuw Event</span>
          </Link>
        </div>
      </div>

      {/* Mobile filter bottom sheet */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 lg:hidden",
          showFilters
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        )}
        onClick={() => requestCloseFilters()}
      />
      <FocusTrap
        active={showFilters}
        focusTrapOptions={{
          escapeDeactivates: false,
          allowOutsideClick: true,
          fallbackFocus: () => filterSheetRef.current ?? document.body,
        }}
      >
        <div
          ref={filterSheetRef}
          role="dialog"
          aria-modal="true"
          aria-label="Filters"
          tabIndex={-1}
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto overscroll-contain rounded-t-2xl transition-transform duration-300 ease-out outline-none lg:hidden",
            "bg-theme-surface",
            showFilters ? "translate-y-0" : "translate-y-full"
          )}
        >
          <div
            className="flex touch-none justify-center px-4 pt-3 pb-4"
            onTouchStart={handleFilterTouchStart}
            onTouchEnd={handleFilterTouchEnd}
          >
            <div className="h-1.5 w-12 rounded-full bg-[var(--theme-fg-muted)]/30" />
          </div>
          <FilterSidebar
            filters={filters}
            onFilterChange={setFilter}
            onToggleFilter={toggleFilter}
            onClearFilters={clearFilters}
            activeFilterCount={activeFilterCount}
            className="relative max-h-none overflow-visible rounded-none bg-transparent shadow-none"
          />
        </div>
      </FocusTrap>

      {/* Main Layout: Sidebar + Events */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Filter Sidebar — desktop only, always visible */}
        <div className="hidden lg:col-span-1 lg:block">
          <div className="sticky top-20">
            <FilterSidebar
              filters={filters}
              onFilterChange={setFilter}
              onToggleFilter={toggleFilter}
              onClearFilters={clearFilters}
              activeFilterCount={activeFilterCount}
            />
          </div>
        </div>

        {/* Events */}
        <div className="lg:col-span-3">
          {/* Empty State */}
          {events.length === 0 && (
            <div className="py-24 text-center">
              <div className="bg-theme-gradient-subtle mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full">
                {activeFilterCount > 0 ? (
                  <CalendarOff className="text-theme-fg-muted h-11 w-11" />
                ) : (
                  <Calendar className="text-theme-primary h-11 w-11" />
                )}
              </div>
              <h2 className="text-theme-fg mb-2 text-xl font-semibold">
                {activeFilterCount > 0 ? "Geen events gevonden" : "Nog geen events"}
              </h2>
              <p className="text-theme-fg-muted mx-auto mb-6 max-w-md text-sm">
                {activeFilterCount > 0
                  ? "Probeer andere filters of wis ze allemaal"
                  : "Begin met het toevoegen van je eerste spirituele event"}
              </p>
              {activeFilterCount > 0 ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="border-theme-primary text-theme-primary hover:bg-theme-primary-10 focus-visible:ring-theme-primary cursor-pointer rounded-xl border-2 px-6 py-2.5 font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  Filters wissen
                </button>
              ) : (
                <Link
                  href="/events/new"
                  className="bg-theme-primary shadow-theme-primary text-theme-primary-fg inline-flex items-center gap-2 rounded-xl px-6 py-2.5 font-medium shadow-lg transition-colors hover:opacity-90 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
                >
                  <Plus className="h-4 w-4" />
                  Eerste Event Toevoegen
                </Link>
              )}
            </div>
          )}

          {/* Events Grid/List */}
          {events.length > 0 && (
            <div
              className={cn(
                viewMode === "grid"
                  ? "grid grid-cols-1 gap-4 md:grid-cols-2"
                  : "flex flex-col gap-3"
              )}
            >
              {events.map((event) => {
                const isChild = event.resource.seriesParentEventIds.length > 0;
                return (
                  <div
                    key={event.id}
                    className={cn(
                      "h-full",
                      isChild &&
                        viewMode === "list" &&
                        "border-theme-border border-l-2 pl-4"
                    )}
                  >
                    <EventCard
                      id={event.eventId}
                      name={event.title}
                      description={event.resource.description}
                      date={parseLocalDate(event.start)}
                      endDate={
                        event.resource.originalEndDate
                          ? parseLocalDate(event.resource.originalEndDate)
                          : null
                      }
                      startTime={event.resource.startTime}
                      endTime={event.resource.endTime}
                      category={event.resource.categories[0] ?? null}
                      eventType={event.resource.eventType}
                      tithi={event.resource.tithi}
                      nakshatra={event.resource.nakshatra}
                      tags={event.resource.tags}
                      onClick={() => handleEventClick(event)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          isOpen={!!selectedEvent}
          onClose={handleCloseModal}
          onDeleted={handleEventDeleted}
        />
      )}
    </PageLayout>
  );
}
