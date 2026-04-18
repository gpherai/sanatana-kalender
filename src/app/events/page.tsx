"use client";

import { useState, Suspense, useMemo, useEffect, useCallback, useRef } from "react";
import { useFetch } from "@/hooks/useFetch";
import Link from "next/link";
import { Plus, LayoutGrid, List, SlidersHorizontal } from "lucide-react";
import { FilterSidebar } from "@/components/filters";
import { EventDetailModal } from "@/components/calendar/EventDetailModal";
import { EventCard } from "@/components/events/EventCard";
import { PageLayout } from "@/components/layout";
import { useFilters } from "@/hooks/useFilters";
import {
  CalendarEvent,
  CalendarEventResponse,
  parseCalendarEvent,
} from "@/types/calendar";
import { parseLocalDate } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

type ViewMode = "grid" | "list";

/**
 * Re-order events so series children appear directly below their parent occurrence.
 * Matching is date-range based: a child belongs to the parent occurrence whose
 * date range (start..originalEndDate) contains the child's start date.
 * This correctly separates e.g. Chaitra Navratri (April) children from
 * Sharad Navratri (October) children even though they share the same parent event IDs.
 */
function groupChildrenUnderParents(
  events: CalendarEventResponse[]
): CalendarEventResponse[] {
  // Pre-sort: on the same date, series parents come before their children
  const sorted = [...events].sort((a, b) => {
    const dateDiff = a.start.localeCompare(b.start);
    if (dateDiff !== 0) return dateDiff;
    // Same date: parent (hasSeriesChildren) before child (has parents)
    return (
      (a.resource.hasSeriesChildren ? 0 : 1) - (b.resource.hasSeriesChildren ? 0 : 1)
    );
  });

  // Build map: parentEventId → all parent occurrences present in this result set
  const parentOccByEventId = new Map<string, CalendarEventResponse[]>();
  for (const event of sorted) {
    if (event.resource.hasSeriesChildren) {
      const arr = parentOccByEventId.get(event.eventId) ?? [];
      arr.push(event);
      parentOccByEventId.set(event.eventId, arr);
    }
  }

  // For each child occurrence, find the specific parent occurrence whose date range contains it.
  // Map: parentOccurrence.id → child occurrences (sorted by dayNumber)
  const childrenByParentOccId = new Map<string, CalendarEventResponse[]>();

  for (const event of sorted) {
    if (event.resource.seriesParentEventIds.length === 0) continue;

    for (const parentEventId of event.resource.seriesParentEventIds) {
      const parentOccs = parentOccByEventId.get(parentEventId) ?? [];
      const match = parentOccs.find((p) => {
        const rangeEnd = p.resource.originalEndDate ?? p.start;
        return event.start >= p.start && event.start <= rangeEnd;
      });
      if (match) {
        const arr = childrenByParentOccId.get(match.id) ?? [];
        arr.push(event);
        childrenByParentOccId.set(match.id, arr);
        break; // matched to exactly one parent occurrence
      }
    }
  }

  // Sort children within each parent occurrence by dayNumber
  for (const children of childrenByParentOccId.values()) {
    children.sort(
      (a, b) =>
        (a.resource.seriesDayNumber ?? 999) - (b.resource.seriesDayNumber ?? 999) ||
        a.start.localeCompare(b.start)
    );
  }

  const placed = new Set<string>();
  const result: CalendarEventResponse[] = [];

  for (const event of sorted) {
    if (placed.has(event.id)) continue;
    placed.add(event.id);
    result.push(event);

    // After a parent occurrence, insert its matched children immediately
    if (event.resource.hasSeriesChildren) {
      for (const child of childrenByParentOccId.get(event.id) ?? []) {
        if (!placed.has(child.id)) {
          placed.add(child.id);
          result.push(child);
        }
      }
    }
  }

  // Append children whose parent wasn't in this result set (e.g. filtered out)
  for (const event of sorted) {
    if (!placed.has(event.id)) result.push(event);
  }

  return result;
}

function EventsContent() {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showFilters, setShowFilters] = useState(false);

  const handleCloseFilters = useCallback(() => setShowFilters(false), []);

  // Back button closes the mobile filter sheet
  useEffect(() => {
    if (!showFilters) return;
    history.pushState({ filters: true }, "");
    window.addEventListener("popstate", handleCloseFilters);
    return () => window.removeEventListener("popstate", handleCloseFilters);
  }, [showFilters, handleCloseFilters]);

  // Swipe down to dismiss filter sheet
  const filterTouchStartY = useRef(0);
  const handleFilterTouchStart = useCallback((e: React.TouchEvent) => {
    filterTouchStartY.current = e.touches[0]!.clientY;
  }, []);
  const handleFilterTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const dy = e.changedTouches[0]!.clientY - filterTouchStartY.current;
      if (dy > 80) handleCloseFilters();
    },
    [handleCloseFilters]
  );

  const {
    filters,
    setFilter,
    toggleFilter,
    clearFilters,
    activeFilterCount,
    buildQueryString,
  } = useFilters();

  const eventsUrl = `/api/events?${buildQueryString()}`;
  const {
    data: rawEvents,
    loading,
    error: fetchError,
    refetch,
  } = useFetch<CalendarEventResponse[]>(eventsUrl, {
    errorMessage: "Kon events niet laden",
  });
  const events = useMemo(() => groupChildrenUnderParents(rawEvents ?? []), [rawEvents]);
  const error = fetchError?.message ?? null;

  // Handle card click - open modal
  const handleEventClick = (event: CalendarEventResponse) => {
    setSelectedEvent(parseCalendarEvent(event));
  };

  // Close modal
  const handleCloseModal = () => {
    setSelectedEvent(null);
  };

  const handleEventDeleted = refetch;

  return (
    <PageLayout>
      {/* Page Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-theme-fg text-3xl font-bold">Events</h1>
          <p className="text-theme-fg-muted mt-1 text-sm">
            {loading ? (
              "Laden..."
            ) : (
              <>
                {events.length} event{events.length !== 1 && "s"} gevonden
                {activeFilterCount > 0 && (
                  <span className="text-theme-primary">
                    {" "}
                    • {activeFilterCount} filter{activeFilterCount !== 1 && "s"} actief
                  </span>
                )}
              </>
            )}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="bg-theme-surface-raised flex items-center rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setViewMode("grid")}
              style={{ touchAction: "manipulation" }}
              className={cn(
                "flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-md transition-colors",
                viewMode === "grid"
                  ? "bg-theme-primary-15 text-theme-primary"
                  : "text-theme-fg-muted hover:text-theme-fg"
              )}
              title="Grid weergave"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              style={{ touchAction: "manipulation" }}
              className={cn(
                "flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-md transition-colors",
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
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 transition-colors lg:hidden",
              showFilters
                ? "bg-theme-primary-15 text-theme-primary"
                : "bg-theme-surface-raised text-theme-fg-muted"
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {activeFilterCount > 0 && (
              <span className="bg-theme-primary flex h-5 w-5 items-center justify-center rounded-full text-xs text-white">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* New Event Button */}
          <Link
            href="/events/new"
            className="bg-theme-primary shadow-theme-primary flex items-center gap-2 rounded-xl px-4 py-2 font-medium text-white shadow-lg transition-all hover:opacity-90"
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
        onClick={handleCloseFilters}
      />
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto overscroll-contain rounded-t-2xl transition-transform duration-300 ease-out lg:hidden",
          "bg-theme-surface",
          showFilters ? "translate-y-0" : "translate-y-full"
        )}
      >
        {/* Drag handle — only this zone triggers swipe-to-dismiss */}
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

      {/* Main Layout: Sidebar + Events */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Filter Sidebar — desktop only, always visible */}
        <div className="hidden lg:col-span-1 lg:block">
          <div className="sticky top-4">
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
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-24">
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="border-theme-primary-20 h-16 w-16 rounded-full border-4" />
                  <div className="border-theme-primary absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-t-transparent" />
                </div>
                <span className="text-theme-fg-muted text-sm">Events laden...</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="py-24 text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--theme-error-bg)]">
                <span className="text-4xl">😕</span>
              </div>
              <h2 className="text-theme-fg mb-2 text-xl font-semibold">
                Oeps, er ging iets mis
              </h2>
              <p className="text-theme-fg-muted mx-auto mb-6 max-w-md text-sm">{error}</p>
              <button
                onClick={refetch}
                className="bg-theme-primary shadow-theme-primary rounded-xl px-6 py-2.5 font-medium text-white shadow-lg transition-colors hover:opacity-90"
              >
                Opnieuw proberen
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && events.length === 0 && (
            <div className="py-24 text-center">
              <div className="bg-theme-gradient-subtle mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full">
                <span className="text-5xl">📅</span>
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
                  onClick={clearFilters}
                  className="border-theme-primary text-theme-primary hover:bg-theme-primary-10 rounded-xl border-2 px-6 py-2.5 font-medium transition-colors"
                >
                  Filters wissen
                </button>
              ) : (
                <Link
                  href="/events/new"
                  className="bg-theme-primary shadow-theme-primary inline-flex items-center gap-2 rounded-xl px-6 py-2.5 font-medium text-white shadow-lg transition-colors hover:opacity-90"
                >
                  <Plus className="h-4 w-4" />
                  Eerste Event Toevoegen
                </Link>
              )}
            </div>
          )}

          {/* Events Grid/List */}
          {!loading && !error && events.length > 0 && (
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

// Wrap in Suspense for useSearchParams
export default function EventsPage() {
  return (
    <Suspense fallback={<PageLayout loading loadingMessage="Events laden..." />}>
      <EventsContent />
    </Suspense>
  );
}
