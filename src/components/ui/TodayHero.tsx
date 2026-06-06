"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Sun,
  Sunrise,
  Sunset,
  Moon,
  MoonStar,
  Calendar,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { MoonPhase } from "./MoonPhase";
import { PlanetIcon } from "./PlanetIcon";
import { formatTimeAgo, formatIsoTimeAgo, formatDate } from "@/lib/date-utils";
import type { DailyInfoResponse } from "@/types";
import type { CalendarEventResourceResponse } from "@/types/calendar";
import type { WeatherApiResponse } from "@/types/weather";
import { DEFAULT_LOCATION, VARA_DAYS } from "@/lib/domain";

interface TodayEvent {
  id: string;
  name: string;
  category: CalendarEventResourceResponse["categories"][number] | null;
  eventType: string;
  date: string;
}

export interface TodayHeroProps {
  dailyInfo: DailyInfoResponse | null;
  todayEvents: TodayEvent[];
  currentWeather: WeatherApiResponse["current"] | null;
}

export function TodayHero({ dailyInfo, todayEvents, currentWeather }: TodayHeroProps) {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  // Update time every minute, synced to the minute boundary.
  // Initialized in useEffect (not useState) to prevent SSR/hydration mismatch.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: sets client time after mount to avoid SSR hydration mismatch
    setCurrentTime(new Date());
    const msUntilNextMinute = (60 - new Date().getSeconds()) * 1000;
    let interval: ReturnType<typeof setInterval>;
    const timeout = setTimeout(() => {
      setCurrentTime(new Date());
      interval = setInterval(() => setCurrentTime(new Date()), 60000);
    }, msUntilNextMinute);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  // Fall back to server-provided date for stable SSR rendering of weekday/date heading.
  // currentTime is null until after hydration; the date heading never mismatches.
  const today =
    currentTime ?? new Date(dailyInfo?.date ?? new Date().toISOString().slice(0, 10));
  const dayOfWeek = today.getDay();
  const varaDay = VARA_DAYS[dayOfWeek] ?? VARA_DAYS[0]!;

  // Use server-calculated special day (already in API response)
  const specialDay = dailyInfo?.specialDay;

  // Hero background comes from the theme; base.css provides the fallback.
  const heroBackground = "var(--theme-hero-bg)";

  return (
    <div
      className="today-hero relative overflow-hidden rounded-3xl shadow-2xl"
      style={{ background: heroBackground }}
    >
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-[var(--theme-glass-bg)] blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-[var(--theme-glass-bg)] blur-3xl" />
        <div
          className="absolute top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(circle, var(--theme-hero-blob-color) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10 p-6 md:p-8">
        {/* Top Row: Date heading + Time always side by side */}
        <div className="mb-3 flex items-start justify-between gap-4">
          {/* Date + weekday */}
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2 text-sm text-white/70">
              <Calendar className="h-4 w-4" />
              <span>{today.toLocaleDateString("nl-NL", { weekday: "long" })}</span>
              <span className="text-white/25">•</span>
              <span className="flex items-center gap-1">
                <PlanetIcon planet={varaDay.planet} className="h-3.5 w-3.5" />
                {dailyInfo?.vara?.name ?? varaDay.name}
              </span>
            </div>
            <h1 className="theme-heading-reset mb-0 text-4xl font-bold text-white md:text-5xl">
              {formatDate(today, { timeZone: DEFAULT_LOCATION.timezone })}
            </h1>
          </div>

          {/* Current Time + Weather */}
          <div className="shrink-0 text-right">
            <div
              suppressHydrationWarning
              className="text-3xl font-light text-white tabular-nums md:text-4xl"
            >
              {(currentTime ?? new Date()).toLocaleTimeString("nl-NL", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
            <div className="mt-1 text-sm text-white/50">
              {dailyInfo?.locationName || DEFAULT_LOCATION.name}
            </div>

            {/* Weather snippet — only shown when API data is available */}
            {currentWeather?.weather[0] && (
              <div className="mt-2 text-right">
                <div className="flex items-center justify-end gap-1">
                  <Image
                    src={`https://openweathermap.org/img/wn/${currentWeather.weather[0].icon}@2x.png`}
                    alt={currentWeather.weather[0].description}
                    width={40}
                    height={40}
                  />
                  <span className="text-xl leading-none font-semibold text-white">
                    {Math.round(currentWeather.temp)}°
                  </span>
                </div>
                <div className="overflow-hidden text-xs whitespace-nowrap text-white/50 capitalize">
                  {currentWeather.weather[0].description}
                </div>
                <div className="text-xs text-white/50">
                  ↑{Math.round(currentWeather.temp_max)}° ↓
                  {Math.round(currentWeather.temp_min)}°
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Panchanga details — full width below header */}
        <div className="mb-8">
          {/* Vedic Calendar Year Info */}
          {dailyInfo?.vikramaSamvat && (
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-white/50">
              <span>Vikrama Samvat {dailyInfo.vikramaSamvat.year}</span>
              {dailyInfo.samvatsara && (
                <>
                  <span className="text-white/25">•</span>
                  <span>{dailyInfo.samvatsara.name}</span>
                </>
              )}
              {/* Shaka Samvat */}
              {dailyInfo.shakaSamvat && (
                <>
                  <span className="text-white/25">•</span>
                  <span>
                    Shaka {dailyInfo.shakaSamvat.year} ({dailyInfo.shakaSamvat.name})
                  </span>
                </>
              )}
            </div>
          )}

          <div className="flex flex-col gap-1">
            {/* Main Panchanga line - more compact */}
            <div className="flex flex-wrap items-center gap-2 text-base text-white/70">
              {dailyInfo?.maas && (
                <span>
                  {dailyInfo.maas.name} Maas
                  {dailyInfo.maas.lunarDay && (
                    <span className="ml-1 text-sm text-white/50">
                      (dag {dailyInfo.maas.lunarDay})
                    </span>
                  )}
                </span>
              )}

              {/* Compact TITHI */}
              {dailyInfo?.tithi && (
                <>
                  <span className="text-white/25">•</span>
                  <span>
                    {dailyInfo.tithi.name} ({dailyInfo.tithi.paksha})
                  </span>
                </>
              )}

              {/* NAKSHATRA + pada samen */}
              {dailyInfo?.nakshatra && (
                <>
                  <span className="text-white/25">•</span>
                  <span>
                    {dailyInfo.nakshatra.name}
                    <span className="ml-1 text-sm text-white/50">
                      pada {dailyInfo.nakshatra.pada}
                    </span>
                  </span>
                </>
              )}
            </div>

            {/* Secondary details line - smaller */}
            {dailyInfo?.tithi?.endTime && (
              <div className="text-sm text-white/50">
                Tithi eindigt {dailyInfo.tithi.endTime}
              </div>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Sun Times */}
          <div className="rounded-2xl border border-[var(--theme-glass-border)] bg-[var(--theme-glass-bg)] p-5 backdrop-blur-md">
            <div className="mb-4 flex items-center gap-2">
              <Sun className="text-theme-icon-sun h-5 w-5" />
              <h3 className="font-semibold text-white">Zon</h3>
              {dailyInfo?.sunSign && (
                <span className="ml-auto text-xs text-white/50">
                  {dailyInfo.sunSign.name}
                </span>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sunrise className="text-theme-icon-sunrise h-5 w-5" />
                  <span className="text-white/70">Opkomst</span>
                </div>
                <div className="text-right">
                  <div className="text-xl font-semibold text-white">
                    {dailyInfo?.sunrise || "—"}
                  </div>
                  <div className="text-xs text-white/50">
                    {currentTime &&
                      formatTimeAgo(dailyInfo?.sunrise || null, currentTime)}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sunset className="text-theme-icon-sunset h-5 w-5" />
                  <span className="text-white/70">Ondergang</span>
                </div>
                <div className="text-right">
                  <div className="text-xl font-semibold text-white">
                    {dailyInfo?.sunset || "—"}
                  </div>
                  <div className="text-xs text-white/50">
                    {currentTime && formatTimeAgo(dailyInfo?.sunset || null, currentTime)}
                  </div>
                </div>
              </div>

              {/* Zon positie info */}
              {(dailyInfo?.pravishte || dailyInfo?.sunSign?.uptoLocal) && (
                <div className="space-y-0.5 border-t border-white/10 pt-3 text-xs text-white/50">
                  {dailyInfo?.pravishte && (
                    <div>
                      Dag {dailyInfo.pravishte.daysSinceSankranti} in{" "}
                      {dailyInfo.pravishte.currentRashi}
                    </div>
                  )}
                  {dailyInfo?.sunSign?.uptoLocal && (
                    <div>Volgende teken om {dailyInfo.sunSign.uptoLocal.slice(0, 5)}</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Moon Phase - Center piece */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--theme-glass-border)] bg-[var(--theme-glass-bg)] p-5 backdrop-blur-md">
            <div className="mb-4 flex items-center gap-2">
              <MoonStar className="text-theme-icon-moon h-5 w-5" />
              <h3 className="font-semibold text-white">Maan</h3>
            </div>

            {dailyInfo && (
              <>
                <MoonPhase
                  percent={dailyInfo.moonPhasePercent}
                  isWaxing={dailyInfo.isWaxing}
                  size={100}
                  glow={true}
                />
                <div className="mt-3 text-center">
                  <div className="text-lg font-medium text-white">
                    {dailyInfo.moonPhaseName}
                  </div>
                  <div className="text-sm text-white/50">
                    {dailyInfo.moonPhasePercent}% verlicht
                    {dailyInfo.isWaxing ? " • Wassend" : " • Afnemend"}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Moon Times */}
          <div className="rounded-2xl border border-[var(--theme-glass-border)] bg-[var(--theme-glass-bg)] p-5 backdrop-blur-md">
            <div className="mb-4 flex items-center gap-2">
              <Moon className="text-theme-icon-moon h-5 w-5" />
              <h3 className="font-semibold text-white">Maantijden</h3>
              {dailyInfo?.moonSign && (
                <span className="ml-auto text-xs text-white/50">
                  {dailyInfo.moonSign.name}
                </span>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MoonStar className="h-5 w-5 text-white/70" />
                  <span className="text-white/70">Opkomst</span>
                </div>
                <div className="text-right">
                  <div className="text-xl font-semibold text-white">
                    {dailyInfo?.moonrise || "—"}
                  </div>
                  <div className="text-xs text-white/50">
                    {currentTime &&
                      formatIsoTimeAgo(dailyInfo?.moonriseUtcIso || null, currentTime)}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Moon className="h-5 w-5 text-white/70" />
                  <span className="text-white/70">Ondergang</span>
                </div>
                <div className="text-right">
                  <div className="text-xl font-semibold text-white">
                    {dailyInfo?.moonset || "—"}
                  </div>
                  <div className="text-xs text-white/50">
                    {currentTime &&
                      formatIsoTimeAgo(dailyInfo?.moonsetUtcIso || null, currentTime)}
                  </div>
                </div>
              </div>

              {/* Moon Sign transition info */}
              {dailyInfo?.moonSign?.uptoLocal && (
                <div className="border-t border-white/10 pt-3 text-xs text-white/50">
                  Volgende teken om {dailyInfo.moonSign.uptoLocal.slice(0, 5)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Yoga / Karana */}
        {(dailyInfo?.yoga || dailyInfo?.karana) && (
          <div className="mt-6">
            <div className="mb-2 text-xs font-medium tracking-wider text-white/40 uppercase">
              Pañcāṅga
            </div>
            <div className="rounded-xl border border-[var(--theme-glass-border)] bg-[var(--theme-glass-bg)] p-3 backdrop-blur-md">
              <div className="grid grid-cols-2 divide-x divide-white/10">
                {dailyInfo?.yoga && (
                  <div className="pr-4">
                    <div className="mb-0.5 text-xs text-white/50">Yoga</div>
                    <div className="text-sm font-medium text-white">
                      {dailyInfo.yoga.name}
                    </div>
                    {dailyInfo.yoga.endTime && (
                      <div className="mt-0.5 text-xs text-white/40">
                        t/m {dailyInfo.yoga.endTime}
                      </div>
                    )}
                  </div>
                )}
                {dailyInfo?.karana && (
                  <div className={dailyInfo?.yoga ? "pl-4" : ""}>
                    <div className="mb-0.5 text-xs text-white/50">Karana</div>
                    <div className="text-sm font-medium text-white">
                      {dailyInfo.karana.name}
                    </div>
                    {dailyInfo.karana.endTime && (
                      <div className="mt-0.5 text-xs text-white/40">
                        t/m {dailyInfo.karana.endTime}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Muhurta tijden: chronologisch gesorteerd */}
        {(() => {
          const muhurtas = [
            dailyInfo?.brahmaMuhurta && {
              name: "Brahma",
              auspicious: true,
              ...dailyInfo.brahmaMuhurta,
            },
            dailyInfo?.rahuKalam && {
              name: "Rahu Kalam",
              auspicious: false,
              ...dailyInfo.rahuKalam,
            },
            dailyInfo?.yamagandam && {
              name: "Yamagandam",
              auspicious: false,
              ...dailyInfo.yamagandam,
            },
            dailyInfo?.gulikaKalam && {
              name: "Gulika Kalam",
              auspicious: false,
              ...dailyInfo.gulikaKalam,
            },
            dailyInfo?.abhijitMuhurta && {
              name: "Abhijit",
              auspicious: true,
              ...dailyInfo.abhijitMuhurta,
            },
            dailyInfo?.vijayMuhurta && {
              name: "Vijay",
              auspicious: true,
              ...dailyInfo.vijayMuhurta,
            },
          ]
            .filter(
              (
                m
              ): m is { name: string; auspicious: boolean; start: string; end: string } =>
                Boolean(m)
            )
            .sort((a, b) => a.start.localeCompare(b.start));

          if (muhurtas.length === 0) return null;

          return (
            <div className="mt-6">
              <div className="mb-2 text-xs font-medium tracking-wider text-white/40 uppercase">
                Muhurta
              </div>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-3">
                {muhurtas.map((m) => (
                  <div
                    key={m.name}
                    className={
                      m.auspicious
                        ? "rounded-xl border border-white/20 bg-white/10 p-2.5 backdrop-blur-md sm:p-3"
                        : "rounded-xl border border-[var(--theme-glass-border)] bg-[var(--theme-glass-bg)] p-2.5 backdrop-blur-md sm:p-3"
                    }
                  >
                    <div
                      className={`mb-1 flex items-center gap-1 text-xs ${m.auspicious ? "text-white/70" : "text-white/50"}`}
                    >
                      {m.auspicious ? (
                        <Sparkles className="h-3 w-3 shrink-0" />
                      ) : (
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                      )}
                      {m.name}
                    </div>
                    <div className="text-xs font-medium text-white sm:text-sm">
                      <span className="block sm:hidden">{m.start}</span>
                      <span className="block sm:hidden">– {m.end}</span>
                      <span className="hidden sm:inline">
                        {m.start} – {m.end}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Special Lunar Day Banner */}
        {specialDay && (
          <div
            className="mt-6 rounded-2xl p-4 ring-1 ring-[var(--theme-glass-border)] backdrop-blur-sm"
            style={{
              background: `linear-gradient(90deg,
                color-mix(in oklch, var(--theme-almanac-special-bg) 50%, transparent),
                color-mix(in oklch, var(--theme-almanac-event-bg) 50%, transparent)
              )`,
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl" aria-hidden="true">
                {specialDay.emoji}
              </span>
              <div>
                <div className="font-semibold text-white">{specialDay.name}</div>
                <div className="text-sm text-white/70">{specialDay.description}</div>
              </div>
            </div>
          </div>
        )}

        {/* Today's Events */}
        {todayEvents.length > 0 && (
          <div className="mt-6 border-t border-[var(--theme-glass-border)] pt-6">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="text-theme-icon-event-special h-5 w-5" />
              <h3 className="font-semibold text-white">Vandaag</h3>
            </div>

            <div className="flex flex-wrap gap-3">
              {todayEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="flex items-center gap-2 rounded-full border border-[var(--theme-glass-border)] bg-[var(--theme-glass-bg)] px-4 py-3 text-white/70 backdrop-blur-sm transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none active:opacity-60"
                  style={{ touchAction: "manipulation" }}
                >
                  {event.category?.icon && (
                    <span aria-hidden="true">{event.category.icon}</span>
                  )}
                  <span className="font-medium">{event.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
