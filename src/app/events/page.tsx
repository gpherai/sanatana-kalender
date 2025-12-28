"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { Plus, LayoutGrid, List, SlidersHorizontal } from "lucide-react";
import { FilterSidebar } from "@/components/filters";
import { EventDetailModal } from "@/components/calendar";
import { EventCard } from "@/components/events";
import { PageLayout } from "@/components/layout";
import { useFilters } from "@/hooks/useFilters";
import {
  CalendarEvent,
  CalendarEventResponse,
  parseCalendarEvent,
} from "@/types/calendar";
import { cn } from "@/lib/utils";

type ViewMode = "grid" | "list";

function EventsContent() {
  const [events, setEvents] = useState<CalendarEventResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showFilters, setShowFilters] = useState(true);

  const {
    filters,
    setFilter,
    toggleFilter,
    clearFilters,
    activeFilterCount,
    buildQueryString,
  } = useFilters();

  // Refetch function for retry button
  const refetch = () => setRefreshTrigger((prev) => prev + 1);

  // Fetch events with filters (with AbortController for cleanup)
  useEffect(() => {
    const controller = new AbortController();

    async function fetchEvents() {
      setLoading(true);
      setError(null);

      try {
        const queryString = buildQueryString();
        const response = await fetch(`/api/events?${queryString}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Kon events niet laden");
        }

        const data = await response.json();
        setEvents(data);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        setError(err instanceof Error ? err.message : "Onbekende fout");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchEvents();

    return () => controller.abort();
  }, [buildQueryString, refreshTrigger]);

  // Handle card click - open modal
  const handleEventClick = (event: CalendarEventResponse) => {
    setSelectedEvent(parseCalendarEvent(event));
  };

  // Close modal
  const handleCloseModal = () => {
    setSelectedEvent(null);
  };

  // Refresh after delete
  const handleEventDeleted = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <PageLayout>
      {/* Page Header */}
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-theme-fg">
              Events
            </h1>
            <p className="mt-1 text-sm text-theme-fg-muted">
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
            <div className="flex items-center rounded-lg bg-theme-surface-raised p-1 shadow-sm">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "rounded-md p-2 transition-colors",
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
                className={cn(
                  "rounded-md p-2 transition-colors",
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
                "flex items-center gap-2 rounded-lg px-3 py-2 transition-colors lg:hidden",
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

        {/* Main Layout: Sidebar + Events */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Filter Sidebar */}
          <div className={cn("lg:col-span-1", !showFilters && "hidden lg:block")}>
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
                  <span className="text-sm text-theme-fg-muted">
                    Events laden...
                  </span>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="py-24 text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                  <span className="text-4xl">😕</span>
                </div>
                <h2 className="mb-2 text-xl font-semibold text-theme-fg">
                  Oeps, er ging iets mis
                </h2>
                <p className="mx-auto mb-6 max-w-md text-sm text-theme-fg-muted">
                  {error}
                </p>
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
                <h2 className="mb-2 text-xl font-semibold text-theme-fg">
                  {activeFilterCount > 0 ? "Geen events gevonden" : "Nog geen events"}
                </h2>
                <p className="mx-auto mb-6 max-w-md text-sm text-theme-fg-muted">
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
                {events.map((event) => (
                  <EventCard
                    key={event.id}
                    id={event.eventId}
                    name={event.title}
                    description={event.resource.description}
                    date={new Date(event.start)}
                    endDate={
                      event.resource.originalEndDate
                        ? new Date(event.resource.originalEndDate)
                        : null
                    }
                    startTime={event.resource.startTime}
                    endTime={event.resource.endTime}
                    category={event.resource.category}
                    eventType={event.resource.eventType}
                    importance={event.resource.importance}
                    tithi={event.resource.tithi}
                    nakshatra={event.resource.nakshatra}
                    tags={event.resource.tags}
                    onClick={() => handleEventClick(event)}
                    className={viewMode === "list" ? "md:flex-row" : ""}
                  />
                ))}
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
