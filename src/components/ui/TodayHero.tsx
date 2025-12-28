"use client";

import { useEffect, useState } from "react";
import { Sun, Sunrise, Sunset, Moon, MoonStar, Calendar, Sparkles } from "lucide-react";
import { MoonPhase } from "./MoonPhase";
import { cn, formatDateLocal } from "@/lib/utils";
import { formatTimeAgo } from "@/lib/date-utils";
import { getApproximateHinduMonth } from "@/lib/panchanga-helpers";
import type { DailyInfoResponse } from "@/types";

interface TodayEvent {
  id: string;
  name: string;
  category: string | null;
  categoryIcon: string | null;
  eventType: string;
  importance: string;
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
  const [dailyInfo, setDailyInfo] = useState<DailyInfoResponse | null>(null);
  const [todayEvents, setTodayEvents] = useState<TodayEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch daily info and today's events
  useEffect(() => {
    const controller = new AbortController();

    async function fetchData() {
      try {
        const today = new Date();
        const todayStr = formatDateLocal(today); // ← FIX: Use formatDateLocal to prevent UTC timezone shifts

        const [dailyRes, todayEventsRes] = await Promise.all([
          fetch("/api/daily-info", { signal: controller.signal }),
          fetch(`/api/events?start=${todayStr}T00:00:00.000Z&end=${todayStr}T23:59:59.999Z`, {
            signal: controller.signal,
          }),
        ]);

        if (dailyRes.ok) {
          const data: DailyInfoResponse = await dailyRes.json();
          setDailyInfo(data);
        }

        if (todayEventsRes.ok) {
          const events: Array<{
            eventId: string;
            title: string;
            start: string;
            resource: {
              category: string | null;
              categoryIcon: string | null;
              eventType: string;
              importance: string;
            };
          }> = await todayEventsRes.json();
          setTodayEvents(
            events.map((e) => ({
              id: e.eventId,
              name: e.title,
              category: e.resource.category,
              categoryIcon: e.resource.categoryIcon,
              eventType: e.resource.eventType,
              importance: e.resource.importance,
              date: e.start,
            }))
          );
        }
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Error fetching today data:", error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchData();
    return () => controller.abort();
  }, []);

  const today = currentTime;
  const dayOfWeek = today.getDay();
  const sanskritDay = SANSKRIT_DAYS[dayOfWeek] ?? SANSKRIT_DAYS[0]!;

  // Use exact Maas from Drik Panchang (instead of approximation)
  const hinduMonth = dailyInfo?.maas?.name ?? getApproximateHinduMonth(today);

  // Use server-calculated special day (already in API response)
  const specialDay = dailyInfo?.specialDay;

  if (loading) {
    return (
      <div
        className="relative overflow-hidden rounded-3xl p-8 shadow-2xl"
        style={{
          background: `
            linear-gradient(135deg,
              color-mix(in oklch, var(--theme-primary) 95%, black),
              color-mix(in oklch, var(--theme-secondary) 92%, black),
              color-mix(in oklch, var(--theme-accent) 90%, black)
            )
          `,
        }}
      >
        <div className="flex h-48 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--theme-spinner-track)] border-t-[var(--theme-spinner-fill)]" />
            <span className="text-sm text-white/80">Loading today&apos;s info...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden rounded-3xl shadow-2xl"
      style={{
        background: `
          linear-gradient(135deg,
            color-mix(in oklch, var(--theme-primary) 95%, black),
            color-mix(in oklch, var(--theme-secondary) 92%, black),
            color-mix(in oklch, var(--theme-accent) 90%, black)
          )
        `,
      }}
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
                {sanskritDay.icon} {sanskritDay.name}
              </span>
            </div>

            <h1 className="mb-1 text-4xl font-bold text-white md:text-5xl">
              {today.toLocaleDateString("nl-NL", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </h1>

            {/* Vedic Calendar Year Info */}
            {dailyInfo?.vikramaSamvat && (
              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-white/50">
                <span>
                  Vikrama Samvat {dailyInfo.vikramaSamvat.year}
                </span>
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
                <span>
                  {hinduMonth} Maas
                  {dailyInfo?.maas?.lunarDay && (
                    <span className="ml-1 text-sm text-white/60">
                      (dag {dailyInfo.maas.lunarDay})
                    </span>
                  )}
                </span>

                {/* Compact TITHI */}
                {dailyInfo?.tithi && (
                  <>
                    <span className="text-white/40">•</span>
                    <span>{dailyInfo.tithi.name} ({dailyInfo.tithi.paksha})</span>
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
                {dailyInfo?.nakshatra && (
                  <span>Pada {dailyInfo.nakshatra.pada}</span>
                )}
              </div>
            </div>
          </div>

          {/* Current Time */}
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
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Sun Times */}
          <div className="rounded-2xl bg-[var(--theme-glass-bg)] p-5 backdrop-blur-md">
            <div className="mb-4 flex items-center gap-2">
              <Sun className="h-5 w-5 text-theme-icon-sun" />
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
                  <Sunrise className="h-5 w-5 text-theme-icon-sunrise" />
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
                  <Sunset className="h-5 w-5 text-theme-icon-sunset" />
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

              {/* Pravishte info - days since Sankranti */}
              {dailyInfo?.pravishte && (
                <div className="border-t border-white/10 pt-3 text-xs text-white/50">
                  Dag {dailyInfo.pravishte.daysSinceSankranti} in {dailyInfo.pravishte.currentRashi}
                </div>
              )}
            </div>
          </div>

          {/* Moon Phase - Center piece */}
          <div className="flex flex-col items-center justify-center rounded-2xl bg-[var(--theme-glass-bg)] p-5 backdrop-blur-sm">
            <div className="mb-4 flex items-center gap-2">
              <MoonStar className="h-5 w-5 text-theme-icon-moon" />
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
              <Moon className="h-5 w-5 text-theme-icon-moon" />
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
                  <span className="text-xl">🌙</span>
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
                  <span className="text-xl">🌑</span>
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

        {/* Special Lunar Day Banner */}
        {specialDay && (
          <div
            className="mt-6 rounded-2xl p-4 backdrop-blur-sm ring-1 ring-[var(--theme-glass-border)]"
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
              <Sparkles className="h-5 w-5 text-theme-icon-event-special" />
              <h3 className="font-semibold text-white">Vandaag</h3>
            </div>

            <div className="flex flex-wrap gap-3">
              {todayEvents.map((event) => (
                <div
                  key={event.id}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-4 py-2 backdrop-blur-sm",
                    event.importance === "MAJOR"
                      ? "bg-[var(--theme-warning-bg)] text-[var(--theme-warning-fg)] ring-1 ring-[var(--theme-warning-border)]"
                      : "bg-[var(--theme-glass-bg)] text-white/90"
                  )}
                >
                  {event.categoryIcon && <span>{event.categoryIcon}</span>}
                  <span className="font-medium">{event.name}</span>
                  {event.importance === "MAJOR" && <span className="ml-1">⭐</span>}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
