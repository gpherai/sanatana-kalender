"use client";

import { useRef, useCallback } from "react";
import {
  Sun,
  Sunrise,
  Sunset,
  Moon,
  MoonStar,
  Sparkles,
  Star,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FALLBACK_CATEGORY_COLOR, resolveCategoryColor } from "@/lib/category-styles";
import { useTheme } from "@/components/theme/ThemeProvider";
import { MoonPhase } from "@/components/ui/MoonPhase";
import { PlanetIcon } from "@/components/ui/PlanetIcon";
import { isToday, formatDateLocal, formatLongDate } from "@/lib/date-utils";
import type { SpecialDay } from "@/lib/panchanga-helpers";
import type { DailyInfoResponse } from "@/types";
import type { CalendarEventResponse } from "@/types/calendar";
import { useOverlayHistory } from "@/hooks/useOverlayHistory";

interface DayDetailsPanelProps {
  selectedDate: Date;
  selectedDayInfo: DailyInfoResponse | undefined;
  selectedDayEvents: CalendarEventResponse[];
  selectedDaySpecial: SpecialDay[];
  onEventClick: (event: CalendarEventResponse) => void;
  showEvents: boolean;
  showSpecialDays: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  yogaStartTime?: string | null;
  karanaStartTime?: string | null;
}

const SANSKRIT_DAYS = [
  {
    name: "Somavara",
    deity: "Chandra",
    planet: "Moon" as const,
    color: "text-[var(--theme-almanac-planet-moon)]",
  },
  {
    name: "Mangalavara",
    deity: "Mangal",
    planet: "Mars" as const,
    color: "text-[var(--theme-almanac-planet-mars)]",
  },
  {
    name: "Budhavara",
    deity: "Budha",
    planet: "Mercury" as const,
    color: "text-[var(--theme-almanac-planet-mercury)]",
  },
  {
    name: "Guruvara",
    deity: "Brihaspati",
    planet: "Jupiter" as const,
    color: "text-[var(--theme-almanac-planet-jupiter)]",
  },
  {
    name: "Shukravara",
    deity: "Shukra",
    planet: "Venus" as const,
    color: "text-[var(--theme-almanac-planet-venus)]",
  },
  {
    name: "Shanivara",
    deity: "Shani",
    planet: "Saturn" as const,
    color: "text-[var(--theme-almanac-planet-saturn)]",
  },
  {
    name: "Ravivara",
    deity: "Surya",
    planet: "Sun" as const,
    color: "text-[var(--theme-almanac-planet-sun)]",
  },
];

export function DayDetailsPanel({
  selectedDate,
  selectedDayInfo,
  selectedDayEvents,
  selectedDaySpecial,
  onEventClick,
  showEvents,
  showSpecialDays,
  isOpen = false,
  onClose,
  yogaStartTime,
  karanaStartTime,
}: DayDetailsPanelProps) {
  const { resolvedColorMode } = useTheme();
  const isDark = resolvedColorMode === "dark";
  const selectedSanskritDay = selectedDayInfo?.vara?.name
    ? SANSKRIT_DAYS.find((d) => d.name === selectedDayInfo.vara!.name)
    : undefined;
  const selectedHinduMonth = selectedDayInfo?.maas?.name;
  const selectedDateStr = formatDateLocal(selectedDate);
  const { requestClose } = useOverlayHistory({
    isOpen,
    onClose: onClose ?? (() => {}),
    stateKey: "almanac-day-details",
  });

  // Swipe down to dismiss
  const touchStartY = useRef(0);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0]!.clientY;
  }, []);
  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const dy = e.changedTouches[0]!.clientY - touchStartY.current;
      if (dy > 80) requestClose();
    },
    [requestClose]
  );

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 lg:hidden",
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => requestClose()}
      />

      {/* Panel */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto overscroll-contain rounded-t-2xl transition-transform duration-300 ease-out",
          "bg-[var(--theme-surface)]",
          "lg:static lg:z-auto lg:max-h-none lg:overflow-visible lg:rounded-none lg:bg-transparent lg:transition-none",
          "lg:sticky lg:top-20 lg:w-72 lg:flex-shrink-0 lg:self-start",
          isOpen ? "translate-y-0" : "translate-y-full lg:translate-y-0"
        )}
      >
        {/* Drag handle — only this zone triggers swipe-to-dismiss */}
        <div
          data-testid="swipe-handle"
          className="flex touch-none justify-center px-4 pt-3 pb-4 lg:hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="h-1.5 w-12 rounded-full bg-[var(--theme-fg-muted)]/30" />
        </div>

        <div className="space-y-4 px-4 pb-8 lg:px-0 lg:pb-0">
          {/* Selected Day Header */}
          <div
            data-testid="day-header"
            className="rounded-2xl p-4 text-white shadow-lg lg:cursor-default"
            style={{
              background: `var(--theme-almanac-day-header-bg)`,
            }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="flex items-center gap-2 text-sm text-white/70">
              {selectedSanskritDay && (
                <>
                  <PlanetIcon
                    planet={selectedSanskritDay.planet}
                    className={`h-4 w-4 shrink-0 ${selectedSanskritDay.color}`}
                  />
                  <span>{selectedSanskritDay.name}</span>
                </>
              )}
              {isToday(selectedDate) && (
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
                  Vandaag
                </span>
              )}
            </div>
            <h3 className="mt-1 text-xl font-bold">{formatLongDate(selectedDate)}</h3>
            <div className="mt-1 flex flex-wrap gap-2 text-sm text-white/80">
              {selectedHinduMonth && <span>{selectedHinduMonth} Maas</span>}
              {selectedDayInfo?.tithi && (
                <>
                  <span className="text-white/40">•</span>
                  <span>
                    {selectedDayInfo.tithi.paksha} {selectedDayInfo.tithi.name}
                    {selectedDayInfo.tithi.endTime && (
                      <span className="ml-1 text-xs text-white/50">
                        (eindigt {selectedDayInfo.tithi.endTime})
                      </span>
                    )}
                  </span>
                </>
              )}
              {selectedDayInfo?.nakshatra && (
                <>
                  <span className="text-white/40">•</span>
                  <span>
                    {selectedDayInfo.nakshatra.name}
                    {selectedDayInfo.nakshatra.endTime && (
                      <span className="ml-1 text-xs text-white/50">
                        (eindigt {selectedDayInfo.nakshatra.endTime})
                      </span>
                    )}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Sun & Moon Times */}
          {selectedDayInfo && (
            <div className="grid grid-cols-2 gap-3">
              {/* Sun */}
              <div
                className="rounded-xl p-4 shadow"
                style={{
                  background: `linear-gradient(135deg, var(--theme-almanac-sun-card-from), var(--theme-almanac-sun-card-to))`,
                }}
              >
                <div className="mb-3 flex items-center gap-2">
                  <Sun className="h-4 w-4 text-[var(--theme-almanac-sun-icon)]" />
                  <span className="text-theme-fg text-xs font-semibold">Zon</span>
                </div>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2" title="Opkomst">
                    <Sunrise className="h-3.5 w-3.5 shrink-0 text-[var(--theme-almanac-sun-rise-icon)]" />
                    <span className="text-theme-fg text-sm font-semibold tabular-nums">
                      {selectedDayInfo.sunrise || "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2" title="Ondergang">
                    <Sunset className="h-3.5 w-3.5 shrink-0 text-[var(--theme-almanac-sun-set-icon)]" />
                    <span className="text-theme-fg text-sm font-semibold tabular-nums">
                      {selectedDayInfo.sunset || "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Moon */}
              <div
                className="rounded-xl p-4 shadow"
                style={{
                  background: `linear-gradient(135deg, var(--theme-almanac-moon-card-from), var(--theme-almanac-moon-card-to))`,
                }}
              >
                <div className="mb-3 flex items-center gap-2">
                  <Moon className="h-4 w-4 text-[var(--theme-almanac-moon-icon)]" />
                  <span className="text-theme-fg text-xs font-semibold">Maan</span>
                </div>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2" title="Opkomst">
                    <MoonStar className="h-3.5 w-3.5 shrink-0 text-[var(--theme-almanac-moon-rise-icon)]" />
                    <span className="text-theme-fg text-sm font-semibold tabular-nums">
                      {selectedDayInfo.moonrise || "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2" title="Ondergang">
                    <Moon className="h-3.5 w-3.5 shrink-0 text-[var(--theme-almanac-moon-set-icon)]" />
                    <span className="text-theme-fg text-sm font-semibold tabular-nums">
                      {selectedDayInfo.moonset || "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Moon Phase Visual */}
          {selectedDayInfo && (
            <div className="bg-theme-surface-raised flex items-center gap-4 rounded-xl p-4 shadow">
              <MoonPhase
                percent={selectedDayInfo.moonPhasePercent}
                isWaxing={selectedDayInfo.isWaxing}
                size={56}
                glow={true}
              />
              <div>
                <div className="text-theme-fg font-semibold">
                  {selectedDayInfo.moonPhaseName}
                </div>
                <div className="text-theme-fg-muted text-sm">
                  {selectedDayInfo.moonPhasePercent}% •{" "}
                  {selectedDayInfo.isWaxing ? "Wassend ↑" : "Afnemend ↓"}
                </div>
              </div>
            </div>
          )}

          {/* Special Lunar Days */}
          {showSpecialDays && selectedDaySpecial.length > 0 && (
            <div className="rounded-xl bg-[var(--theme-almanac-special-card-bg)] p-4 shadow">
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--theme-almanac-special-heading)]">
                <Sparkles className="h-4 w-4" />
                Speciale dag
              </h4>
              <div className="space-y-2">
                {selectedDaySpecial.map((special) => (
                  <div key={special.type} className="flex items-start gap-2">
                    <span className="text-lg" aria-hidden="true">
                      {special.emoji}
                    </span>
                    <div>
                      <div className="text-theme-fg font-medium">{special.name}</div>
                      <div className="text-theme-fg-muted text-xs">
                        {special.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Panchanga Details */}
          {selectedDayInfo &&
            (selectedDayInfo.yoga ||
              selectedDayInfo.karana ||
              selectedDayInfo.rahuKalam) && (
              <div className="bg-theme-surface-raised rounded-xl p-4 shadow">
                <h4 className="text-theme-fg mb-3 text-sm font-semibold">
                  Panchanga Details
                </h4>
                <div className="space-y-3">
                  {selectedDayInfo.yoga && (
                    <div className="panchanga-yoga-card bg-theme-surface-hover rounded-lg p-3">
                      <h5 className="panchanga-yoga-label text-theme-fg-muted mb-1 text-xs font-medium">
                        Yoga
                      </h5>
                      <p className="text-theme-fg text-sm font-medium">
                        {selectedDayInfo.yoga.name}
                      </p>
                      <div className="text-theme-fg-muted mt-1 space-y-0.5 text-xs">
                        {yogaStartTime && <p>Begint om {yogaStartTime}</p>}
                        {selectedDayInfo.yoga.endTime && (
                          <p>Eindigt om {selectedDayInfo.yoga.endTime}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedDayInfo.karana && (
                    <div className="panchanga-karana-card bg-theme-surface-hover rounded-lg p-3">
                      <h5 className="panchanga-karana-label text-theme-fg-muted mb-1 text-xs font-medium">
                        Karana
                      </h5>
                      <p className="text-theme-fg text-sm font-medium">
                        {selectedDayInfo.karana.name} ({selectedDayInfo.karana.type})
                      </p>
                      <div className="text-theme-fg-muted mt-1 space-y-0.5 text-xs">
                        {karanaStartTime && <p>Begint om {karanaStartTime}</p>}
                        {selectedDayInfo.karana.endTime && (
                          <p>Eindigt om {selectedDayInfo.karana.endTime}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedDayInfo.rahuKalam && (
                    <div className="rounded-lg border-l-4 border-[var(--theme-almanac-warning-border)] bg-[var(--theme-almanac-warning-bg)] p-3">
                      <h5 className="mb-1 text-xs font-medium text-[var(--theme-almanac-warning-heading)]">
                        Rahu Kalam (Ongunstig)
                      </h5>
                      <p className="text-sm font-semibold text-[var(--theme-almanac-warning-text)]">
                        {selectedDayInfo.rahuKalam.start} -{" "}
                        {selectedDayInfo.rahuKalam.end}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* Events */}
          {showEvents && (
            <div className="bg-theme-surface-raised rounded-xl p-4 shadow">
              <h4 className="text-theme-fg mb-3 flex items-center gap-2 text-sm font-semibold">
                <Star className="h-4 w-4 text-[var(--theme-almanac-event-icon)]" />
                Events
              </h4>
              {selectedDayEvents.length > 0 ? (
                <div className="space-y-2">
                  {selectedDayEvents.map((event) => {
                    const eventStartKey = event.start.slice(0, 10);
                    const isStartDay = eventStartKey === selectedDateStr;
                    const isSpanning =
                      event.resource.originalEndDate !== null &&
                      event.resource.originalEndDate !== eventStartKey;

                    const cat = event.resource.categories[0];
                    const categoryColor = cat
                      ? resolveCategoryColor(cat.color, cat.colorDark, isDark)
                      : FALLBACK_CATEGORY_COLOR;

                    return (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => onEventClick(event)}
                        className="group border-theme-border bg-theme-surface focus-visible:ring-theme-primary relative w-full overflow-hidden rounded-xl border text-left shadow-sm transition-all duration-200 hover:shadow-md focus-visible:ring-2 focus-visible:outline-none"
                      >
                        {/* Category color strip */}
                        <div
                          className="absolute top-0 left-0 h-full w-1.5"
                          style={{ backgroundColor: categoryColor }}
                        />

                        <div className="py-3 pr-3 pl-5">
                          <div className="flex items-center gap-2">
                            <span className="flex-shrink-0 text-base" aria-hidden="true">
                              {event.resource.categories[0]?.icon ?? "📅"}
                            </span>
                            <span className="text-theme-fg group-hover:text-theme-primary flex-1 truncate text-sm font-medium transition-colors">
                              {event.title}
                            </span>
                            <ChevronRight className="text-theme-primary h-3.5 w-3.5 flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                          </div>

                          {/* Time badges + spanning indicator */}
                          {(event.resource.startTime ||
                            event.resource.endTime ||
                            isSpanning ||
                            event.resource.notes) && (
                            <div className="mt-1.5 flex flex-wrap items-center gap-1 text-xs">
                              {event.resource.startTime && isStartDay && (
                                <span className="rounded bg-[var(--theme-almanac-event-time-start-bg)] px-2 py-0.5 text-[var(--theme-almanac-event-time-start-fg)]">
                                  Begint om {event.resource.startTime}
                                </span>
                              )}
                              {event.resource.endTime && (
                                <span className="rounded bg-[var(--theme-almanac-event-time-end-bg)] px-2 py-0.5 text-[var(--theme-almanac-event-time-end-fg)]">
                                  Eindigt om {event.resource.endTime}
                                </span>
                              )}
                              {isSpanning && !event.resource.endTime && (
                                <span className="rounded bg-[var(--theme-almanac-event-time-end-bg)] px-2 py-0.5 text-[var(--theme-almanac-event-time-end-fg)]">
                                  Loopt door
                                </span>
                              )}
                              {event.resource.notes && (
                                <span className="text-theme-fg-muted">
                                  {event.resource.notes}
                                </span>
                              )}
                            </div>
                          )}

                          {event.resource.description && (
                            <p className="text-theme-fg-muted mt-1 line-clamp-1 text-xs">
                              {event.resource.description}
                            </p>
                          )}
                        </div>

                        {/* Bottom gradient on hover */}
                        <div
                          className="absolute right-0 bottom-0 left-0 h-0.5 opacity-0 transition-opacity group-hover:opacity-100"
                          style={{
                            background: `linear-gradient(90deg, ${categoryColor}, transparent)`,
                          }}
                        />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-theme-fg-muted text-center text-sm">Geen events</p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
