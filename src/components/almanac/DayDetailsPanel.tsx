"use client";

import { Sun, Moon, Sparkles, Star } from "lucide-react";
import { MoonPhase } from "@/components/ui/MoonPhase";
import { cn } from "@/lib/utils";
import { isToday, formatDateISO } from "@/lib/date-utils";
import { getApproximateHinduMonth, type SpecialDay } from "@/lib/panchanga-helpers";
import type { DailyInfoResponse } from "@/types";
import type { CalendarEventResponse } from "@/types/calendar";

interface DayDetailsPanelProps {
  selectedDate: Date;
  selectedDayInfo: DailyInfoResponse | undefined;
  selectedDayEvents: CalendarEventResponse[];
  selectedDaySpecial: SpecialDay[];
  onEventClick: (event: CalendarEventResponse) => void;
  showEvents: boolean;
  showSpecialDays: boolean;
}

const SANSKRIT_DAYS = [
  {
    name: "Somavara",
    deity: "Chandra",
    planet: "Moon",
    icon: "🌙",
    color: "text-[var(--theme-almanac-planet-moon)]",
  },
  {
    name: "Mangalavara",
    deity: "Mangal",
    planet: "Mars",
    icon: "🔴",
    color: "text-[var(--theme-almanac-planet-mars)]",
  },
  {
    name: "Budhavara",
    deity: "Budha",
    planet: "Mercury",
    icon: "🟢",
    color: "text-[var(--theme-almanac-planet-mercury)]",
  },
  {
    name: "Guruvara",
    deity: "Brihaspati",
    planet: "Jupiter",
    icon: "🟡",
    color: "text-[var(--theme-almanac-planet-jupiter)]",
  },
  {
    name: "Shukravara",
    deity: "Shukra",
    planet: "Venus",
    icon: "⚪",
    color: "text-[var(--theme-almanac-planet-venus)]",
  },
  {
    name: "Shanivara",
    deity: "Shani",
    planet: "Saturn",
    icon: "🪐",
    color: "text-[var(--theme-almanac-planet-saturn)]",
  },
  {
    name: "Ravivara",
    deity: "Surya",
    planet: "Sun",
    icon: "☀️",
    color: "text-[var(--theme-almanac-planet-sun)]",
  },
] as const;

export function DayDetailsPanel({
  selectedDate,
  selectedDayInfo,
  selectedDayEvents,
  selectedDaySpecial,
  onEventClick,
  showEvents,
  showSpecialDays,
}: DayDetailsPanelProps) {
  const selectedSanskritDay = SANSKRIT_DAYS[(selectedDate.getDay() + 6) % 7]!;
  const selectedHinduMonth = getApproximateHinduMonth(selectedDate);
  const selectedDateStr = formatDateISO(selectedDate);

  return (
    <div className="w-full space-y-4 lg:sticky lg:top-20 lg:w-72 lg:flex-shrink-0 lg:self-start">
      {/* Selected Day Header */}
      <div
        className="rounded-2xl p-4 text-white shadow-lg"
        style={{
          background: `linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))`,
        }}
      >
        <div className="flex items-center gap-2 text-sm text-white/70">
          <span>{selectedSanskritDay.icon}</span>
          <span>{selectedSanskritDay.name}</span>
          {isToday(selectedDate) && (
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">Vandaag</span>
          )}
        </div>
        <h3 className="mt-1 text-xl font-bold">
          {selectedDate.toLocaleDateString("nl-NL", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </h3>
        <div className="mt-1 flex flex-wrap gap-2 text-sm text-white/80">
          <span>{selectedHinduMonth} Maas</span>
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
            className="rounded-xl p-3 shadow"
            style={{
              background: `linear-gradient(135deg, var(--theme-almanac-sun-card-from), var(--theme-almanac-sun-card-to))`,
            }}
          >
            <div className="mb-2 flex items-center gap-2">
              <Sun className="h-4 w-4 text-[var(--theme-almanac-sun-icon)]" />
              <span className="text-theme-fg text-xs font-semibold">Zon</span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-theme-fg-muted">Opkomst</span>
                <span className="text-theme-fg font-semibold">
                  {selectedDayInfo.sunrise || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-fg-muted">Ondergang</span>
                <span className="text-theme-fg font-semibold">
                  {selectedDayInfo.sunset || "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Moon */}
          <div
            className="rounded-xl p-3 shadow"
            style={{
              background: `linear-gradient(135deg, var(--theme-almanac-moon-card-from), var(--theme-almanac-moon-card-to))`,
            }}
          >
            <div className="mb-2 flex items-center gap-2">
              <Moon className="h-4 w-4 text-[var(--theme-almanac-moon-icon)]" />
              <span className="text-theme-fg text-xs font-semibold">Maan</span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-theme-fg-muted">Opkomst</span>
                <span className="text-theme-fg font-semibold">
                  {selectedDayInfo.moonrise || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-fg-muted">Ondergang</span>
                <span className="text-theme-fg font-semibold">
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
            {selectedDaySpecial.map((special, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-lg">{special.emoji}</span>
                <div>
                  <div className="text-theme-fg font-medium">{special.name}</div>
                  <div className="text-theme-fg-muted text-xs">{special.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Panchanga Details */}
      {selectedDayInfo &&
        (selectedDayInfo.yoga || selectedDayInfo.karana || selectedDayInfo.rahuKalam) && (
          <div className="bg-theme-surface-raised rounded-xl p-4 shadow">
            <h4 className="text-theme-fg mb-3 text-sm font-semibold">
              Panchanga Details
            </h4>
            <div className="space-y-3">
              {selectedDayInfo.yoga && (
                <div className="bg-theme-surface-hover rounded-lg p-3">
                  <h5 className="text-theme-fg-muted mb-1 text-xs font-medium">Yoga</h5>
                  <p className="text-theme-fg text-sm font-medium">
                    {selectedDayInfo.yoga.name}
                  </p>
                  {selectedDayInfo.yoga.endTime && (
                    <p className="text-theme-fg-muted mt-1 text-xs">
                      Eindigt om {selectedDayInfo.yoga.endTime}
                    </p>
                  )}
                </div>
              )}

              {selectedDayInfo.karana && (
                <div className="bg-theme-surface-hover rounded-lg p-3">
                  <h5 className="text-theme-fg-muted mb-1 text-xs font-medium">Karana</h5>
                  <p className="text-theme-fg text-sm font-medium">
                    {selectedDayInfo.karana.name} ({selectedDayInfo.karana.type})
                  </p>
                  {selectedDayInfo.karana.endTime && (
                    <p className="text-theme-fg-muted mt-1 text-xs">
                      Eindigt om {selectedDayInfo.karana.endTime}
                    </p>
                  )}
                </div>
              )}

              {selectedDayInfo.rahuKalam && (
                <div className="rounded-lg border-l-4 border-[var(--theme-almanac-warning-border)] bg-[var(--theme-almanac-warning-bg)] p-3">
                  <h5 className="mb-1 text-xs font-medium text-[var(--theme-almanac-warning-heading)]">
                    Rahu Kalam (Ongunstig)
                  </h5>
                  <p className="text-sm font-semibold text-[var(--theme-almanac-warning-text)]">
                    {selectedDayInfo.rahuKalam.start} - {selectedDayInfo.rahuKalam.end}
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
                const eventStartKey = event.start.split("T")[0]!;
                const isStartDay = eventStartKey === selectedDateStr;
                const isSpanning =
                  event.resource.originalEndDate !== null &&
                  event.resource.originalEndDate !== eventStartKey;

                return (
                  <button
                    key={event.id}
                    onClick={() => onEventClick(event)}
                    className={cn(
                      "w-full rounded-lg p-3 text-left transition-all hover:shadow-md",
                      "bg-theme-surface-hover hover:bg-theme-surface"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span>{event.resource.categories[0]?.icon || "📅"}</span>
                      <span className="text-theme-fg font-medium">{event.title}</span>
                    </div>

                    {/* Time badges + spanning indicator */}
                    {(event.resource.startTime ||
                      event.resource.endTime ||
                      isSpanning ||
                      event.resource.notes) && (
                      <div className="mt-1 flex flex-wrap items-center gap-1 text-xs">
                        {event.resource.startTime && (
                          <span className="rounded bg-[var(--theme-almanac-moon-badge-bg)] px-2 py-0.5 text-[var(--theme-almanac-moon-badge-fg)]">
                            {isStartDay ? "Begint " : ""}
                            {event.resource.startTime}
                          </span>
                        )}
                        {event.resource.endTime && (
                          <span className="rounded bg-[var(--theme-almanac-special-badge-bg)] px-2 py-0.5 text-[var(--theme-almanac-special-badge-fg)]">
                            Eindigt {event.resource.endTime}
                          </span>
                        )}
                        {isSpanning && isStartDay && !event.resource.endTime && (
                          <span className="rounded bg-[var(--theme-almanac-special-badge-bg)] px-2 py-0.5 text-[var(--theme-almanac-special-badge-fg)]">
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
                      <p className="text-theme-fg-muted mt-1 line-clamp-2 text-xs">
                        {event.resource.description}
                      </p>
                    )}
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
  );
}
