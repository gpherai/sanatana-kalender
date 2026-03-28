"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { useFetch } from "@/hooks/useFetch";
import { Sun, Sunrise, Sunset, Moon, MoonStar, Calendar, Sparkles } from "lucide-react";
import { MoonPhase } from "./MoonPhase";
import { formatDateLocal, formatTimeAgo, formatDate } from "@/lib/date-utils";
import type { DailyInfoResponse } from "@/types";
import type {
  CalendarEventResponse,
  CalendarEventResourceResponse,
} from "@/types/calendar";
import type { WeatherApiResponse } from "@/types/weather";

interface TodayEvent {
  id: string;
  name: string;
  category: CalendarEventResourceResponse["categories"][number] | null;
  eventType: string;
  date: string;
}

// Days of the week in Sanskrit
const SANSKRIT_DAYS = [
  { name: "Ravivara", deity: "Surya", icon: "☀️" }, // Sunday
  { name: "Somavara", deity: "Chandra", icon: "🌙" }, // Monday
  { name: "Mangalavara", deity: "Mangal", icon: "🔴" }, // Tuesday
  { name: "Budhavara", deity: "Budha", icon: "🟢" }, // Wednesday
  { name: "Guruvara", deity: "Brihaspati", icon: "🟡" }, // Thursday
  { name: "Shukravara", deity: "Shukra", icon: "⚪" }, // Friday
  { name: "Shanivara", deity: "Shani", icon: "🪐" }, // Saturday
] as const;

export function TodayHero() {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute, synced to the minute boundary
  useEffect(() => {
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

  // Fetch daily info, today's events, and current weather
  const todayStr = formatDateLocal(currentTime);
  const { data: dailyInfo, loading: dailyLoading } =
    useFetch<DailyInfoResponse>("/api/daily-info");
  const { data: rawEvents, loading: eventsLoading } = useFetch<CalendarEventResponse[]>(
    `/api/events?start=${todayStr}T00:00:00.000Z&end=${todayStr}T23:59:59.999Z`
  );
  const { data: weatherData } = useFetch<WeatherApiResponse>("/api/weer");
  const currentWeather = weatherData?.current;
  const loading = dailyLoading || eventsLoading;
  const todayEvents = useMemo<TodayEvent[]>(
    () =>
      rawEvents?.map((e) => ({
        id: e.eventId,
        name: e.title,
        category: e.resource.categories[0] ?? null,
        eventType: e.resource.eventType,
        date: e.start,
      })) ?? [],
    [rawEvents]
  );

  const today = currentTime;
  const dayOfWeek = today.getDay();
  const sanskritDay = SANSKRIT_DAYS[dayOfWeek] ?? SANSKRIT_DAYS[0]!;

  // Use server-calculated special day (already in API response)
  const specialDay = dailyInfo?.specialDay;

  const heroBackground = `linear-gradient(135deg,
    color-mix(in oklch, var(--theme-primary) 95%, black),
    color-mix(in oklch, var(--theme-secondary) 92%, black),
    color-mix(in oklch, var(--theme-accent) 90%, black)
  )`;

  if (loading) {
    return (
      <div
        className="relative overflow-hidden rounded-3xl p-8 shadow-2xl"
        style={{ background: heroBackground }}
      >
        <div className="flex h-48 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--theme-spinner-track)] border-t-[var(--theme-spinner-fill)] motion-reduce:animate-none" />
            <span className="text-sm text-white/80">Vandaag laden...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden rounded-3xl shadow-2xl"
      style={{ background: heroBackground }}
    >
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-[var(--theme-glass-bg)] blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-[var(--theme-glass-bg)] blur-3xl" />
        <div className="bg-gradient-radial absolute top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full from-white/5 to-transparent" />
      </div>

      <div className="relative z-10 p-6 md:p-8">
        {/* Top Row: Date and Time */}
        <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          {/* Date Display */}
          <div>
            <div className="mb-1 flex items-center gap-2 text-sm text-white/70">
              <Calendar className="h-4 w-4" />
              <span>{today.toLocaleDateString("nl-NL", { weekday: "long" })}</span>
              <span className="text-white/40">•</span>
              <span className="flex items-center gap-1">
                {sanskritDay.icon} {dailyInfo?.vara?.name ?? sanskritDay.name}
              </span>
            </div>

            <h1 className="mb-1 text-4xl font-bold text-white md:text-5xl">
              {formatDate(today)}
            </h1>

            {/* Vedic Calendar Year Info */}
            {dailyInfo?.vikramaSamvat && (
              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-white/50">
                <span>Vikrama Samvat {dailyInfo.vikramaSamvat.year}</span>
                {dailyInfo.samvatsara && (
                  <>
                    <span className="text-white/30">•</span>
                    <span>{dailyInfo.samvatsara.name}</span>
                  </>
                )}
                {/* Shaka Samvat */}
                {dailyInfo.shakaSamvat && (
                  <>
                    <span className="text-white/30">•</span>
                    <span>
                      Shaka {dailyInfo.shakaSamvat.year} ({dailyInfo.shakaSamvat.name})
                    </span>
                  </>
                )}
              </div>
            )}

            <div className="flex flex-col gap-1">
              {/* Main Panchanga line - more compact */}
              <div className="flex flex-wrap items-center gap-2 text-base text-white/90">
                {dailyInfo?.maas && (
                  <span>
                    {dailyInfo.maas.name} Maas
                    {dailyInfo.maas.lunarDay && (
                      <span className="ml-1 text-sm text-white/60">
                        (dag {dailyInfo.maas.lunarDay})
                      </span>
                    )}
                  </span>
                )}

                {/* Compact TITHI */}
                {dailyInfo?.tithi && (
                  <>
                    <span className="text-white/40">•</span>
                    <span>
                      {dailyInfo.tithi.name} ({dailyInfo.tithi.paksha})
                    </span>
                  </>
                )}

                {/* NAKSHATRA (no pada in main line) */}
                {dailyInfo?.nakshatra && (
                  <>
                    <span className="text-white/40">•</span>
                    <span>{dailyInfo.nakshatra.name}</span>
                  </>
                )}
              </div>

              {/* Secondary details line - smaller */}
              <div className="flex flex-wrap items-center gap-2 text-sm text-white/60">
                {dailyInfo?.tithi?.endTime && (
                  <span>Tithi eindigt {dailyInfo.tithi.endTime}</span>
                )}
                {dailyInfo?.nakshatra && dailyInfo?.tithi?.endTime && (
                  <span className="text-white/30">•</span>
                )}
                {dailyInfo?.nakshatra && <span>Pada {dailyInfo.nakshatra.pada}</span>}
              </div>
            </div>
          </div>

          {/* Current Time + Weather */}
          <div className="text-right">
            <div className="text-5xl font-light text-white tabular-nums md:text-6xl">
              {currentTime.toLocaleTimeString("nl-NL", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
            <div className="mt-1 text-sm text-white/60">
              {dailyInfo?.locationName || "Den Haag"}
            </div>

            {/* Weather snippet — only shown when API data is available */}
            {currentWeather?.weather[0] && (
              <div className="mt-2 flex items-center justify-end gap-2">
                <Image
                  src={`https://openweathermap.org/img/wn/${currentWeather.weather[0].icon}@2x.png`}
                  alt={currentWeather.weather[0].description}
                  width={48}
                  height={48}
                  unoptimized
                  className="-my-1"
                />
                <div>
                  <div className="text-3xl leading-tight font-semibold text-white">
                    {Math.round(currentWeather.temp)}°
                  </div>
                  <div className="text-xs text-white/60 capitalize">
                    {currentWeather.weather[0].description}
                  </div>
                  <div className="text-xs text-white/50">
                    ↑{Math.round(currentWeather.temp_max)}° ↓
                    {Math.round(currentWeather.temp_min)}°
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Sun Times */}
          <div className="rounded-2xl bg-[var(--theme-glass-bg)] p-5 backdrop-blur-md">
            <div className="mb-4 flex items-center gap-2">
              <Sun className="text-theme-icon-sun h-5 w-5" />
              <h3 className="font-semibold text-white">Zon</h3>
              {dailyInfo?.sunSign && (
                <span className="ml-auto text-xs text-white/60">
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
                    {formatTimeAgo(dailyInfo?.sunrise || null, currentTime)}
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
                    {formatTimeAgo(dailyInfo?.sunset || null, currentTime)}
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
                    <div>
                      Volgende teken om {dailyInfo.sunSign.uptoLocal.substring(0, 5)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Moon Phase - Center piece */}
          <div className="flex flex-col items-center justify-center rounded-2xl bg-[var(--theme-glass-bg)] p-5 backdrop-blur-md">
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
                  <div className="text-sm text-white/60">
                    {dailyInfo.moonPhasePercent}% verlicht
                    {dailyInfo.isWaxing ? " • Wassend" : " • Afnemend"}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Moon Times */}
          <div className="rounded-2xl bg-[var(--theme-glass-bg)] p-5 backdrop-blur-md">
            <div className="mb-4 flex items-center gap-2">
              <Moon className="text-theme-icon-moon h-5 w-5" />
              <h3 className="font-semibold text-white">Maantijden</h3>
              {dailyInfo?.moonSign && (
                <span className="ml-auto text-xs text-white/60">
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
                    {formatTimeAgo(dailyInfo?.moonrise || null, currentTime)}
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
                    {formatTimeAgo(dailyInfo?.moonset || null, currentTime)}
                  </div>
                </div>
              </div>

              {/* Moon Sign transition info */}
              {dailyInfo?.moonSign?.uptoLocal && (
                <div className="border-t border-white/10 pt-3 text-xs text-white/50">
                  Volgende teken om {dailyInfo.moonSign.uptoLocal.substring(0, 5)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Yoga / Karana / Rahu Kalam */}
        {(dailyInfo?.yoga || dailyInfo?.karana || dailyInfo?.rahuKalam) && (
          <div className="mt-6 grid grid-cols-3 gap-3">
            {dailyInfo?.yoga && (
              <div className="rounded-xl bg-[var(--theme-glass-bg)] p-3 backdrop-blur-md">
                <div className="mb-1 text-xs text-white/50">Yoga</div>
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
              <div className="rounded-xl bg-[var(--theme-glass-bg)] p-3 backdrop-blur-md">
                <div className="mb-1 text-xs text-white/50">Karana</div>
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
            {dailyInfo?.rahuKalam && (
              <div className="rounded-xl bg-[var(--theme-glass-bg)] p-3 backdrop-blur-md">
                <div className="mb-1 text-xs text-white/50">Rahu Kalam</div>
                <div className="text-sm font-medium text-white">
                  {dailyInfo.rahuKalam.start} – {dailyInfo.rahuKalam.end}
                </div>
              </div>
            )}
          </div>
        )}

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
              <span className="text-3xl">{specialDay.emoji}</span>
              <div>
                <div className="font-semibold text-white">{specialDay.name}</div>
                <div className="text-sm text-white/80">{specialDay.description}</div>
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
                  className="flex items-center gap-2 rounded-full bg-[var(--theme-glass-bg)] px-4 py-3 text-white/90 backdrop-blur-sm transition-opacity hover:opacity-80"
                >
                  {event.category?.icon && <span>{event.category.icon}</span>}
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
