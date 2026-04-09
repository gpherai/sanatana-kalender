"use client";

import { useState, useEffect, useCallback, useId } from "react";
import Image from "next/image";
import { PageLayout } from "@/components/layout";
import {
  Cloud,
  Wind,
  Droplets,
  Eye,
  Gauge,
  RefreshCw,
  MapPin,
  AlertTriangle,
  Sunrise,
  Sunset,
  ArrowUp,
  Thermometer,
  MoonStar,
} from "lucide-react";
import { MoonPhase } from "@/components/ui/MoonPhase";
import { cn } from "@/lib/utils";
import type {
  WeatherApiResponse,
  CurrentWeather,
  HourlyWeather,
  DailyWeather,
  AirQuality,
} from "@/types/weather";

// =============================================================================
// HELPERS
// =============================================================================

function owmIcon(icon: string, size: 2 | 4 = 2) {
  return `https://openweathermap.org/img/wn/${icon}@${size}x.png`;
}
function r(n: number) {
  return Math.round(n);
}
function kmh(ms: number) {
  return r(ms * 3.6);
}
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function windDir(deg: number): string {
  const dirs = [
    "N",
    "NNO",
    "NO",
    "ONO",
    "O",
    "OZO",
    "ZO",
    "ZZO",
    "Z",
    "ZZW",
    "ZW",
    "WZW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ];
  return dirs[r(deg / 22.5) % 16] ?? "N";
}

/** Convert OWM moon_phase (0–1) to MoonPhase component props */
function owmPhase(phase: number) {
  return {
    percent: Math.round(((1 - Math.cos(phase * 2 * Math.PI)) / 2) * 100),
    isWaxing: phase < 0.5,
  };
}

function moonName(phase: number): string {
  if (phase < 0.03 || phase > 0.97) return "Nieuwe maan";
  if (phase < 0.22) return "Wassende sikkel";
  if (phase < 0.28) return "Eerste kwartier";
  if (phase < 0.47) return "Wassende maan";
  if (phase < 0.53) return "Volle maan";
  if (phase < 0.72) return "Afnemende maan";
  if (phase < 0.78) return "Laatste kwartier";
  return "Afnemende sikkel";
}

function toLocal(unix: number, tz: number) {
  return new Date((unix + tz) * 1000);
}
function fmtTime(unix: number, tz: number) {
  const d = toLocal(unix, tz);
  return `${d.getUTCHours().toString().padStart(2, "0")}:${d.getUTCMinutes().toString().padStart(2, "0")}`;
}
function fmtHour(unix: number, tz: number) {
  return `${toLocal(unix, tz).getUTCHours().toString().padStart(2, "0")}:00`;
}
function fmtDayLabel(unix: number, tz: number): string {
  const d = toLocal(unix, tz);
  const now = toLocal(Math.floor(Date.now() / 1000), tz);
  if (d.getUTCDate() === now.getUTCDate()) return "Vandaag";
  const tom = new Date(now);
  tom.setUTCDate(now.getUTCDate() + 1);
  if (d.getUTCDate() === tom.getUTCDate()) return "Morgen";
  return d.toLocaleDateString("nl-NL", { weekday: "long", timeZone: "UTC" });
}
function fmtDayShort(unix: number, tz: number): string {
  const d = toLocal(unix, tz);
  const now = toLocal(Math.floor(Date.now() / 1000), tz);
  if (d.getUTCDate() === now.getUTCDate()) return "Vandaag";
  const tom = new Date(now);
  tom.setUTCDate(now.getUTCDate() + 1);
  if (d.getUTCDate() === tom.getUTCDate()) return "Morgen";
  return d.toLocaleDateString("nl-NL", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}
function dayLength(sunrise: number, sunset: number) {
  const s = sunset - sunrise;
  return `${Math.floor(s / 3600)}u ${Math.floor((s % 3600) / 60)}m`;
}
function dayKey(unix: number, tz: number) {
  const d = toLocal(unix, tz);
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
}

// AQI helpers
const AQI_LABELS = ["Goed", "Redelijk", "Matig", "Slecht", "Zeer slecht"] as const;
const AQI_DESCS = [
  "Luchtkwaliteit is uitstekend. Geen beperkingen.",
  "Acceptabele luchtkwaliteit. Gevoelige personen kunnen lichte hinder ervaren.",
  "Gevoelige groepen (astma, hart/longen) kunnen last krijgen. Beperk langdurige inspanning buiten.",
  "Gezondheidseffecten mogelijk voor iedereen. Vermijd langdurige inspanning buiten.",
  "Ernstige gezondheidsrisico's. Blijf zoveel mogelijk binnen.",
] as const;

function aqiLabel(aqi: number) {
  return AQI_LABELS[aqi - 1] ?? "Onbekend";
}
function aqiDesc(aqi: number) {
  return AQI_DESCS[aqi - 1] ?? "";
}
function aqiBadgeClass(aqi: number) {
  return (
    [
      "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300",
      "bg-lime-100 text-lime-800 dark:bg-lime-950/60 dark:text-lime-300",
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300",
      "bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300",
      "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300",
    ][aqi - 1] ?? "bg-slate-100 text-slate-800"
  );
}
function aqiDotClass(aqi: number) {
  return (
    ["bg-green-500", "bg-lime-500", "bg-yellow-500", "bg-orange-500", "bg-red-500"][
      aqi - 1
    ] ?? "bg-slate-400"
  );
}

/** Linear interpolation between 3-hour OWM slots → approximate 1-hour resolution */
function interpolateHourly(slots: HourlyWeather[]): HourlyWeather[] {
  if (slots.length < 2) return slots;
  const result: HourlyWeather[] = [];
  for (let i = 0; i < slots.length - 1; i++) {
    const a = slots[i]!;
    const b = slots[i + 1]!;
    for (let h = 0; h < 3; h++) {
      const t = h / 3;
      result.push({
        dt: a.dt + h * 3600,
        temp: lerp(a.temp, b.temp, t),
        feels_like: lerp(a.feels_like, b.feels_like, t),
        humidity: Math.round(lerp(a.humidity, b.humidity, t)),
        pressure: Math.round(lerp(a.pressure, b.pressure, t)),
        clouds: Math.round(lerp(a.clouds, b.clouds, t)),
        visibility: Math.round(lerp(a.visibility, b.visibility, t)),
        wind_speed: lerp(a.wind_speed, b.wind_speed, t),
        wind_deg: h < 2 ? a.wind_deg : b.wind_deg,
        wind_gust:
          a.wind_gust != null
            ? lerp(a.wind_gust, b.wind_gust ?? a.wind_gust, t)
            : undefined,
        pop: a.pop,
        rain: a.rain != null ? a.rain / 3 : undefined,
        snow: a.snow != null ? a.snow / 3 : undefined,
        weather: a.weather,
        pod: h < 2 ? a.pod : b.pod,
      });
    }
  }
  result.push(slots[slots.length - 1]!);
  return result;
}

type HourlyItem =
  | { kind: "sep"; label: string; key: string }
  | { kind: "slot"; h: HourlyWeather };

function buildHourlyItems(hourly: HourlyWeather[], tz: number): HourlyItem[] {
  const items: HourlyItem[] = [];
  let lastKey = "";
  for (const h of hourly) {
    const k = dayKey(h.dt, tz);
    if (k !== lastKey) {
      items.push({ kind: "sep", label: fmtDayShort(h.dt, tz), key: k });
      lastKey = k;
    }
    items.push({ kind: "slot", h });
  }
  return items;
}

// =============================================================================
// SKELETON
// =============================================================================

function Pulse({ className }: { className: string }) {
  return <div className={cn("bg-theme-bg-subtle animate-pulse rounded", className)} />;
}

function WeerSkeleton() {
  return (
    <PageLayout spacing>
      {/* Topbalk */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Pulse className="h-4 w-4 rounded-full" />
          <Pulse className="h-5 w-32" />
          <Pulse className="h-4 w-10" />
        </div>
        <Pulse className="h-8 w-8 rounded-xl" />
      </div>

      {/* Hero grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_272px]">
        <div className="bg-theme-surface border-theme-border rounded-2xl border p-5 shadow-sm md:p-6">
          <div className="mb-4 flex justify-between">
            <Pulse className="h-3 w-20" />
            <Pulse className="h-6 w-28 rounded-full" />
          </div>
          <div className="mb-5 flex items-start gap-2">
            <Pulse className="h-20 w-20 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-2 pt-1">
              <Pulse className="h-14 w-32" />
              <Pulse className="h-4 w-56" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Pulse key={i} className="h-16 rounded-xl" />
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <Pulse className="h-7 w-36 rounded-full" />
            <Pulse className="h-7 w-28 rounded-full" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 lg:flex lg:flex-col lg:gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-theme-surface border-theme-border rounded-2xl border p-4 shadow-sm"
            >
              <div className="mb-3 flex items-center gap-2">
                <Pulse className="h-7 w-7 rounded-lg" />
                <Pulse className="h-4 w-16" />
              </div>
              <div className="space-y-2.5">
                {Array.from({ length: 3 }).map((_, j) => (
                  <Pulse key={j} className="h-3.5" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Luchtkwaliteit */}
      <div>
        <Pulse className="mb-3 h-3 w-28" />
        <div className="bg-theme-surface border-theme-border rounded-2xl border p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <Pulse className="h-3 w-3 rounded-full" />
            <Pulse className="h-7 w-20 rounded-full" />
            <Pulse className="h-4 w-80" />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Pulse key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        </div>
      </div>

      {/* Vandaag per uur */}
      <div>
        <Pulse className="mb-3 h-3 w-32" />
        <div className="bg-theme-surface border-theme-border h-40 rounded-2xl border shadow-sm" />
      </div>

      {/* Grafiek */}
      <div>
        <Pulse className="mb-3 h-3 w-48" />
        <div className="bg-theme-surface border-theme-border h-52 rounded-2xl border shadow-sm" />
      </div>

      {/* 5-daagse */}
      <div>
        <Pulse className="mb-3 h-3 w-36" />
        <div className="bg-theme-surface border-theme-border overflow-hidden rounded-2xl border shadow-sm">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "flex items-center gap-4 px-5 py-4",
                i > 0 && "border-theme-border border-t"
              )}
            >
              <Pulse className="h-4 w-20" />
              <Pulse className="h-8 w-8 rounded-lg" />
              <Pulse className="h-4 flex-1" />
              <Pulse className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}

// =============================================================================
// PAGE
// =============================================================================

export default function WeerPage() {
  const [weather, setWeather] = useState<WeatherApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWeather = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else {
      setLoading(true);
      setError(null);
    }
    try {
      const res = await fetch("/api/weer", { cache: "no-store" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        setError(body.message ?? "Kon weerdata niet ophalen");
        return;
      }
      setWeather((await res.json()) as WeatherApiResponse);
      setLastUpdated(new Date());
    } catch {
      setError("Verbindingsfout bij het ophalen van weerdata");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchWeather();
  }, [fetchWeather]);

  if (loading) return <WeerSkeleton />;

  if (error) {
    return (
      <PageLayout width="narrow">
        <div className="bg-theme-surface border-theme-border mt-16 rounded-2xl border p-10 text-center shadow-sm">
          <Cloud className="text-theme-fg-muted mx-auto mb-4 h-10 w-10" />
          <h2 className="text-theme-fg mb-2 text-lg font-semibold">
            Weerdata niet beschikbaar
          </h2>
          <p className="text-theme-fg-muted mb-6 text-sm">{error}</p>
          <button
            onClick={() => void fetchWeather()}
            className="bg-theme-primary cursor-pointer rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Opnieuw proberen
          </button>
        </div>
      </PageLayout>
    );
  }

  if (!weather) return null;

  const {
    current: c,
    hourly,
    daily,
    alerts,
    timezone_offset: tz,
    air_quality: aq,
  } = weather;
  const today = daily[0];
  const nowKey = dayKey(Math.floor(Date.now() / 1000), tz);
  const todayHourly = hourly.filter((h) => dayKey(h.dt, tz) === nowKey);
  const futureHourly = hourly.filter((h) => dayKey(h.dt, tz) !== nowKey);

  const allMin = Math.min(...daily.map((d) => d.temp.min));
  const allMax = Math.max(...daily.map((d) => d.temp.max));
  const tempRange = allMax - allMin || 1;
  const futureItems = buildHourlyItems(futureHourly, tz);

  // Interpoleer vandaag van 3u → ~1u slots
  const todayHourlyInterp = interpolateHourly(todayHourly);

  return (
    <PageLayout spacing>
      {/* ── TOPBALK ──────────────────────────────────────────────────────── */}
      <h1 className="sr-only">Weer — {weather.location}</h1>
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <MapPin className="text-theme-primary h-4 w-4 shrink-0" />
          <span className="text-theme-fg font-semibold">{weather.location}</span>
          <span className="text-theme-fg-muted text-sm">{weather.country}</span>
          {lastUpdated && (
            <span className="text-theme-fg-muted hidden text-xs sm:inline">
              · bijgewerkt{" "}
              {lastUpdated.toLocaleTimeString("nl-NL", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
        <button
          onClick={() => void fetchWeather(true)}
          disabled={refreshing}
          aria-label="Vernieuwen"
          className="text-theme-fg-muted hover:text-theme-fg hover:bg-theme-hover flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-xl transition-colors disabled:opacity-40"
        >
          <RefreshCw
            className={cn(
              "h-4 w-4",
              refreshing && "animate-spin motion-reduce:animate-none"
            )}
          />
        </button>
      </div>

      {/* ── WEERALERTS ───────────────────────────────────────────────────── */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-4 dark:border-orange-800/60 dark:bg-orange-950/40"
            >
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-orange-800 dark:text-orange-200">
                  {alert.event}
                </p>
                <p className="mt-0.5 line-clamp-2 text-xs text-orange-700/80 dark:text-orange-300/80">
                  {alert.description}
                </p>
                <p className="mt-1.5 text-xs text-orange-500">
                  {fmtTime(alert.start, tz)} – {fmtTime(alert.end, tz)} ·{" "}
                  {alert.sender_name}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          SECTIE 1 — HUIDIG WEER + ZON/MAAN/LUCHT
      ════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_272px]">
        <CurrentWeatherCard current={c} today={today} />

        {/* Rechterkolom: Zon · Maan · Lucht */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:flex lg:flex-col lg:gap-4">
          {/* Zon */}
          <div className="bg-theme-surface border-theme-border rounded-2xl border p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--theme-almanac-sun-card-from)]">
                <Sunrise className="h-4 w-4 text-[var(--theme-almanac-sun-rise-icon)]" />
              </div>
              <span className="text-theme-fg text-sm font-semibold">Zon</span>
            </div>
            <div className="space-y-2.5">
              <SideRow
                icon={<Sunrise className="text-theme-icon-sunrise h-3.5 w-3.5" />}
                label="Opkomst"
                value={fmtTime(c.sunrise, tz)}
              />
              <SideRow
                icon={<Sunset className="text-theme-icon-sunset h-3.5 w-3.5" />}
                label="Ondergang"
                value={fmtTime(c.sunset, tz)}
              />
              <div className="border-theme-border border-t pt-2">
                <SideRow label="Daglengte" value={dayLength(c.sunrise, c.sunset)} muted />
              </div>
            </div>
          </div>

          {/* Maan */}
          <div className="bg-theme-surface border-theme-border rounded-2xl border p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--theme-almanac-moon-bg)]">
                <MoonStar className="text-theme-icon-moon h-4 w-4" />
              </div>
              <span className="text-theme-fg text-sm font-semibold">Maan</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-theme-fg text-xs leading-snug font-medium">
                  {moonName(today?.moon_phase ?? 0)}
                </p>
                <p className="text-theme-fg-muted mt-0.5 text-[10px]">
                  Dag {r((today?.moon_phase ?? 0) * 29.5)} ·{" "}
                  {(today?.moon_phase ?? 0) < 0.5 ? "Wassend" : "Afnemend"}
                </p>
              </div>
              <MoonPhase {...owmPhase(today?.moon_phase ?? 0)} size={32} glow={false} />
            </div>
          </div>

          {/* Lucht — full width on mobile (2-col grid), auto on sm+ */}
          <div className="bg-theme-surface border-theme-border col-span-2 rounded-2xl border p-4 shadow-sm sm:col-span-1">
            <div className="mb-3 flex items-center gap-2">
              <div className="bg-theme-primary-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg">
                <Gauge className="text-theme-primary h-4 w-4" />
              </div>
              <span className="text-theme-fg text-sm font-semibold">Lucht</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 sm:block sm:space-y-2.5">
              <SideRow
                icon={<Gauge className="text-theme-fg-muted h-3.5 w-3.5" />}
                label="Zeeniv. druk"
                value={`${c.sea_level} hPa`}
              />
              <SideRow
                icon={<Gauge className="text-theme-fg-muted h-3.5 w-3.5" />}
                label="Gronddruk"
                value={`${c.grnd_level} hPa`}
              />
              <SideRow
                icon={<Eye className="text-theme-fg-muted h-3.5 w-3.5" />}
                label="Zichtbaarheid"
                value={`${(c.visibility / 1000).toFixed(1)} km`}
              />
              <SideRow
                icon={<Droplets className="h-3.5 w-3.5 text-blue-400" />}
                label="Dauwpunt"
                value={`${r(c.dew_point)}°C`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          SECTIE 2 — LUCHTKWALITEIT
      ════════════════════════════════════════════════════════════════════ */}
      {aq && <AirQualityCard aq={aq} />}

      {/* ════════════════════════════════════════════════════════════════════
          SECTIE 3 — VANDAAG: PER UUR (geïnterpoleerd)
      ════════════════════════════════════════════════════════════════════ */}
      {todayHourlyInterp.length > 0 && (
        <div>
          <div className="mb-3 flex items-baseline gap-2">
            <h2 className="text-theme-fg-muted text-[10px] font-bold tracking-[0.12em] uppercase">
              Vandaag · per uur
            </h2>
            <span className="text-theme-fg-muted hidden text-[9px] normal-case opacity-50 sm:inline">
              (lineair geïnterpoleerd uit 3u-sloten)
            </span>
          </div>
          <div className="bg-theme-surface border-theme-border rounded-2xl border shadow-sm">
            <div className="overflow-x-auto p-3">
              <div
                className="flex gap-1.5 [&>*]:snap-start"
                style={{ scrollSnapType: "x mandatory" }}
              >
                {todayHourlyInterp.map((h) => (
                  <HourlyCard key={h.dt} h={h} tz={tz} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          SECTIE 4 — TEMPERATUURGRAFIEK
      ════════════════════════════════════════════════════════════════════ */}
      {hourly.length >= 2 && <TempChart hourly={hourly} daily={daily} tz={tz} />}

      {/* ════════════════════════════════════════════════════════════════════
          SECTIE 5 — 5-DAAGSE VERWACHTING
      ════════════════════════════════════════════════════════════════════ */}
      <div>
        <SectionTitle>5-daagse verwachting</SectionTitle>
        <div className="bg-theme-surface border-theme-border overflow-hidden rounded-2xl border shadow-sm">
          <div
            className="border-theme-border text-theme-fg-muted hidden border-b px-5 py-2 text-[10px] font-semibold tracking-widest uppercase lg:grid"
            style={{ gridTemplateColumns: "140px 36px 1fr 90px 160px 110px 36px" }}
          >
            <span>Dag</span>
            <span />
            <span>Omschrijving</span>
            <span className="text-right">Temp.</span>
            <span className="text-center">Bereik</span>
            <span>Neerslag</span>
            <span className="text-center">Maan</span>
          </div>
          {daily.map((day, i) => {
            const leftPct = ((day.temp.min - allMin) / tempRange) * 100;
            const widthPct = Math.max(
              ((day.temp.max - day.temp.min) / tempRange) * 100,
              8
            );
            return (
              <ForecastRow
                key={day.dt}
                day={day}
                tz={tz}
                leftPct={leftPct}
                widthPct={widthPct}
                hasBorder={i > 0}
              />
            );
          })}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          SECTIE 5 — PER 3 UUR: KOMENDE DAGEN
      ════════════════════════════════════════════════════════════════════ */}
      {futureHourly.length > 0 && (
        <div>
          <SectionTitle>Per 3 uur · komende dagen</SectionTitle>
          <div className="bg-theme-surface border-theme-border rounded-2xl border shadow-sm">
            <div className="overflow-x-auto p-3">
              <div
                className="flex items-stretch gap-1"
                style={{ scrollSnapType: "x mandatory" }}
              >
                {futureItems.map((item, i) =>
                  item.kind === "sep" ? (
                    <div
                      key={item.key}
                      className={cn(
                        "flex shrink-0 flex-col items-center justify-center px-2",
                        i > 0 && "border-theme-border border-l"
                      )}
                    >
                      <span
                        className="text-theme-primary text-[10px] font-bold tracking-wider whitespace-nowrap uppercase"
                        style={{
                          writingMode: "vertical-rl",
                          transform: "rotate(180deg)",
                        }}
                      >
                        {item.label}
                      </span>
                    </div>
                  ) : (
                    <HourlySlot key={item.h.dt} h={item.h} tz={tz} />
                  )
                )}
              </div>
            </div>
            <div className="border-theme-border text-theme-fg-muted flex flex-wrap gap-x-5 gap-y-1 border-t px-4 py-2.5 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-blue-400" />
                Neerslagkans
              </span>
              <span className="flex items-center gap-1.5">
                <ArrowUp className="h-3 w-3" />
                Pijl = windrichting
              </span>
              <span className="text-theme-fg-muted/60">Grijs = gevoelstemperatuur</span>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}

// =============================================================================
// CURRENT WEATHER CARD
// =============================================================================

function CurrentWeatherCard({
  current: c,
  today,
}: {
  current: CurrentWeather;
  today: DailyWeather | undefined;
}) {
  const pressureLabel =
    c.sea_level > 1020
      ? "Hoog · stabiel"
      : c.sea_level < 1000
        ? "Laag · onstabiel"
        : "Normaal";

  return (
    <div className="bg-theme-surface border-theme-border relative overflow-hidden rounded-2xl border p-5 shadow-sm md:p-6">
      {/* Decoratief ghost-icoon */}
      {c.weather[0] && (
        <Image
          src={owmIcon(c.weather[0].icon, 4)}
          alt=""
          aria-hidden="true"
          width={200}
          height={200}
          className="pointer-events-none absolute -right-8 -bottom-8 opacity-[0.04] select-none"
        />
      )}

      {/* Label + conditie-badge */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-theme-fg-muted text-[10px] font-bold tracking-[0.12em] uppercase">
          Huidig weer
        </span>
        {c.weather[0] && (
          <span className="bg-theme-hover text-theme-fg-secondary rounded-full px-3 py-1 text-xs font-medium capitalize">
            {c.weather[0].description}
          </span>
        )}
      </div>

      {/* TEMPERATUUR — hero metric */}
      <div className="mb-5 flex items-start gap-1">
        {c.weather[0] && (
          <Image
            src={owmIcon(c.weather[0].icon, 4)}
            alt={c.weather[0].description}
            width={80}
            height={80}
            priority
            className="-mt-3 -ml-3 shrink-0 drop-shadow-sm"
          />
        )}
        <div>
          <div className="text-theme-fg text-6xl leading-none font-bold tabular-nums sm:text-7xl">
            {r(c.temp)}°
          </div>
          <div className="text-theme-fg-muted mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-sm">
            <span>Voelt als {r(c.feels_like)}°</span>
            <span className="text-theme-fg-subtle">·</span>
            <span>Dauwpunt {r(c.dew_point)}°</span>
            <span className="text-theme-fg-subtle">·</span>
            <span>{c.humidity}% vochtig</span>
          </div>
        </div>
      </div>

      {/* KPI BADGES — rij 1: min/max/wind/vochtigheid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <KpiBadge
          icon={<Thermometer className="h-4 w-4 text-blue-400" />}
          label="Min. vandaag"
          value={`${r(today?.temp.min ?? c.temp_min)}°C`}
          valueClass="text-blue-500 dark:text-blue-400"
        />
        <KpiBadge
          icon={<Thermometer className="h-4 w-4 text-orange-400" />}
          label="Max. vandaag"
          value={`${r(today?.temp.max ?? c.temp_max)}°C`}
          valueClass="text-orange-500 dark:text-orange-400"
        />
        <KpiBadge
          icon={
            <ArrowUp
              className="text-theme-secondary h-4 w-4"
              style={{ transform: `rotate(${c.wind_deg}deg)` }}
            />
          }
          label={`Wind · ${windDir(c.wind_deg)}`}
          value={`${kmh(c.wind_speed)} km/u`}
        />
        <KpiBadge
          icon={<Droplets className="h-4 w-4 text-blue-400" />}
          label="Luchtvochtigheid"
          value={`${c.humidity}%`}
        />
      </div>

      {/* KPI BADGES — rij 2: bewolking / zichtbaarheid / wind max / neerslag vandaag */}
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <KpiBadge
          icon={<Cloud className="h-4 w-4 text-slate-400" />}
          label="Bewolking"
          value={`${c.clouds}%`}
        />
        <KpiBadge
          icon={<Eye className="h-4 w-4 text-slate-400" />}
          label="Zichtbaarheid"
          value={`${(c.visibility / 1000).toFixed(1)} km`}
        />
        <KpiBadge
          icon={<Wind className="text-theme-secondary h-4 w-4" />}
          label="Wind max vandaag"
          value={today?.wind_max != null ? `${kmh(today.wind_max)} km/u` : "—"}
        />
        <KpiBadge
          icon={<Droplets className="h-4 w-4 text-blue-400" />}
          label="Neerslag vandaag"
          value={
            (today?.rain_total ?? 0) > 0
              ? `${today!.rain_total} mm`
              : (today?.snow_total ?? 0) > 0
                ? `${today!.snow_total} mm sneeuw`
                : "Droog"
          }
          valueClass={
            (today?.rain_total ?? 0) > 0 || (today?.snow_total ?? 0) > 0
              ? "text-blue-500 dark:text-blue-400"
              : undefined
          }
        />
      </div>

      {/* PILL BADGES */}
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="bg-theme-hover text-theme-fg-secondary inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium">
          <Gauge className="text-theme-fg-muted h-3.5 w-3.5 shrink-0" />
          {c.sea_level} hPa · {pressureLabel}
        </span>

        {c.wind_gust != null && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">
            <Wind className="h-3.5 w-3.5 shrink-0" />
            Rukwinden {kmh(c.wind_gust)} km/u
          </span>
        )}

        {today?.wind_gust_max != null && today.wind_gust_max > (c.wind_gust ?? 0) && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">
            <Wind className="h-3.5 w-3.5 shrink-0" />
            Max. rukwind vandaag {kmh(today.wind_gust_max)} km/u
          </span>
        )}

        {(today?.pop_max ?? 0) > 0.1 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
            <Droplets className="h-3.5 w-3.5 shrink-0" />
            {r(today!.pop_max * 100)}% kans op neerslag
            {(today?.rain_total ?? 0) > 0 && ` · ${today!.rain_total} mm`}
            {(today?.snow_total ?? 0) > 0 && ` · ${today!.snow_total} mm sneeuw`}
          </span>
        )}

        {c.rain?.["1h"] != null && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
            <Droplets className="h-3.5 w-3.5 shrink-0" />
            Nu: {c.rain["1h"]} mm/u regen
          </span>
        )}
        {c.snow?.["1h"] != null && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
            Nu: {c.snow["1h"]} mm/u sneeuw
          </span>
        )}
      </div>
    </div>
  );
}

// Kleine helper voor chemische symbolen als icon-slot (consistent met h-4 w-4 Lucide sizing)
function Chem({ children }: { children: string }) {
  return (
    <div className="flex h-4 w-4 shrink-0 items-center justify-center">
      <span className="text-theme-fg-muted text-[9px] leading-none font-bold tabular-nums">
        {children}
      </span>
    </div>
  );
}

// =============================================================================
// LUCHTKWALITEIT CARD
// =============================================================================

function AirQualityCard({ aq }: { aq: AirQuality }) {
  const { aqi, components: c } = aq;
  const label = aqiLabel(aqi);
  const desc = aqiDesc(aqi);
  const badge = aqiBadgeClass(aqi);
  const dot = aqiDotClass(aqi);

  return (
    <div>
      <SectionTitle>Luchtkwaliteit</SectionTitle>
      <div className="bg-theme-surface border-theme-border rounded-2xl border p-5 shadow-sm">
        {/* AQI header */}
        <div className="mb-4 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <span
              className={cn("h-3 w-3 shrink-0 rounded-full", dot)}
              aria-hidden="true"
            />
            <span className={cn("rounded-full px-3 py-1 text-sm font-bold", badge)}>
              {label}
            </span>
            <span className="text-theme-fg-muted text-xs">AQI {aqi}/5</span>
          </div>
          <p className="text-theme-fg-muted ml-auto hidden text-xs sm:block">{desc}</p>
        </div>
        <p className="text-theme-fg-muted mb-4 text-xs sm:hidden">{desc}</p>

        {/* Pollutant grid */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <KpiBadge
            icon={<Chem>PM</Chem>}
            label="PM2.5"
            value={`${c.pm2_5.toFixed(1)} µg/m³`}
            valueClass={
              c.pm2_5 > 25
                ? "text-orange-500 dark:text-orange-400"
                : c.pm2_5 > 15
                  ? "text-yellow-600 dark:text-yellow-400"
                  : "text-theme-fg"
            }
            hint={c.pm2_5 > 25 ? "Hoog" : c.pm2_5 > 15 ? "Verhoogd" : undefined}
          />
          <KpiBadge
            icon={<Chem>PM</Chem>}
            label="PM10"
            value={`${c.pm10.toFixed(1)} µg/m³`}
            valueClass={
              c.pm10 > 90
                ? "text-orange-500 dark:text-orange-400"
                : c.pm10 > 45
                  ? "text-yellow-600 dark:text-yellow-400"
                  : "text-theme-fg"
            }
            hint={c.pm10 > 90 ? "Hoog" : c.pm10 > 45 ? "Verhoogd" : undefined}
          />
          <KpiBadge
            icon={<Chem>NO₂</Chem>}
            label="Stikstofdioxide"
            value={`${c.no2.toFixed(1)} µg/m³`}
            valueClass={
              c.no2 > 200
                ? "text-red-500 dark:text-red-400"
                : c.no2 > 40
                  ? "text-orange-500 dark:text-orange-400"
                  : "text-theme-fg"
            }
            hint={c.no2 > 200 ? "Hoog" : c.no2 > 40 ? "Verhoogd" : undefined}
          />
          <KpiBadge
            icon={<Chem>O₃</Chem>}
            label="Ozon"
            value={`${c.o3.toFixed(1)} µg/m³`}
            valueClass={
              c.o3 > 180
                ? "text-red-500 dark:text-red-400"
                : c.o3 > 120
                  ? "text-orange-500 dark:text-orange-400"
                  : "text-theme-fg"
            }
            hint={c.o3 > 180 ? "Hoog" : c.o3 > 120 ? "Verhoogd" : undefined}
          />
          <KpiBadge
            icon={<Chem>SO₂</Chem>}
            label="Zwaveldioxide"
            value={`${c.so2.toFixed(1)} µg/m³`}
            valueClass={
              c.so2 > 350
                ? "text-red-500 dark:text-red-400"
                : c.so2 > 40
                  ? "text-orange-500 dark:text-orange-400"
                  : "text-theme-fg"
            }
            hint={c.so2 > 350 ? "Hoog" : c.so2 > 40 ? "Verhoogd" : undefined}
          />
          <KpiBadge
            icon={<Chem>CO</Chem>}
            label="Koolmonoxide"
            value={`${(c.co / 1000).toFixed(1)} mg/m³`}
            valueClass={
              c.co > 10000
                ? "text-red-500 dark:text-red-400"
                : c.co > 4000
                  ? "text-orange-500 dark:text-orange-400"
                  : "text-theme-fg"
            }
            hint={c.co > 10000 ? "Hoog" : c.co > 4000 ? "Verhoogd" : undefined}
          />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// TEMPERATUURGRAFIEK  (custom SVG)
// =============================================================================

function TempChart({
  hourly,
  daily,
  tz,
}: {
  hourly: HourlyWeather[];
  daily: DailyWeather[];
  tz: number;
}) {
  const gradId = `weerTempGrad${useId().replace(/:/g, "")}`;
  const W = 800,
    H = 188;
  const PAD = { l: 36, r: 14, t: 22, b: 32 };
  const pw = W - PAD.l - PAD.r;
  const ph = H - PAD.t - PAD.b;
  const n = hourly.length;
  if (n < 2) return null;

  const allTemps = hourly.flatMap((h) => [h.temp, h.feels_like]);
  const rawMin = Math.min(...allTemps);
  const rawMax = Math.max(...allTemps);
  const minT = Math.floor(rawMin) - 2;
  const maxT = Math.ceil(rawMax) + 2;
  const tRange = maxT - minT;

  const xOf = (i: number) => PAD.l + (i / (n - 1)) * pw;
  const yOf = (t: number) => PAD.t + (1 - (t - minT) / tRange) * ph;

  const tempPts = hourly
    .map((h, i) => `${xOf(i).toFixed(1)},${yOf(h.temp).toFixed(1)}`)
    .join(" ");
  const feelsPts = hourly
    .map((h, i) => `${xOf(i).toFixed(1)},${yOf(h.feels_like).toFixed(1)}`)
    .join(" ");

  // Area under temp line
  const areaD = [
    `M ${PAD.l.toFixed(1)} ${(PAD.t + ph).toFixed(1)}`,
    ...hourly.map((h, i) => `L ${xOf(i).toFixed(1)} ${yOf(h.temp).toFixed(1)}`),
    `L ${(PAD.l + pw).toFixed(1)} ${(PAD.t + ph).toFixed(1)} Z`,
  ].join(" ");

  // Y-axis grid lines
  const gridStep = tRange <= 16 ? 2 : tRange <= 30 ? 5 : 10;
  const gridLines: number[] = [];
  for (let t = Math.ceil(minT / gridStep) * gridStep; t <= maxT; t += gridStep) {
    gridLines.push(t);
  }

  // Day separators
  const separators: { xi: number; label: string }[] = [];
  let prevKey = "";
  hourly.forEach((h, i) => {
    const k = dayKey(h.dt, tz);
    if (k !== prevKey) {
      if (prevKey && i > 0) separators.push({ xi: xOf(i), label: fmtDayShort(h.dt, tz) });
      prevKey = k;
    }
  });

  // Daily min/max markers — positioned at the midpoint of each day's slots
  const dailyMarkers = daily
    .slice(0, 6)
    .map((d) => {
      const dayK = dayKey(d.dt, tz);
      const indices = hourly
        .map((h, i) => ({ h, i }))
        .filter(({ h }) => dayKey(h.dt, tz) === dayK)
        .map(({ i }) => i);
      if (indices.length === 0) return null;
      const midIdx = indices[Math.floor(indices.length / 2)]!;
      return {
        xi: xOf(midIdx),
        yMax: yOf(d.temp.max),
        yMin: yOf(d.temp.min),
        tMax: r(d.temp.max),
        tMin: r(d.temp.min),
      };
    })
    .filter((m): m is NonNullable<typeof m> => m !== null);

  return (
    <div>
      <SectionTitle>Temperatuurverloop · komende 5 dagen</SectionTitle>
      <div className="bg-theme-surface border-theme-border overflow-hidden rounded-2xl border shadow-sm">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ display: "block", height: "auto" }}
          aria-label="Temperatuurverloop grafiek"
          role="img"
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Y-axis grid + labels */}
          {gridLines.map((t) => (
            <g key={t}>
              <line
                x1={PAD.l}
                y1={yOf(t).toFixed(1)}
                x2={W - PAD.r}
                y2={yOf(t).toFixed(1)}
                stroke="currentColor"
                strokeWidth="0.5"
                strokeDasharray="4 4"
                className="text-slate-200 dark:text-slate-700"
              />
              <text
                x={PAD.l - 5}
                y={yOf(t).toFixed(1)}
                textAnchor="end"
                dominantBaseline="middle"
                fill="currentColor"
                style={{ fontSize: 9, fontVariantNumeric: "tabular-nums" }}
                className="text-slate-400 dark:text-slate-500"
              >
                {t}°
              </text>
            </g>
          ))}

          {/* Day separator lines + labels */}
          {separators.map(({ xi, label }) => (
            <g key={xi}>
              <line
                x1={xi.toFixed(1)}
                y1={PAD.t}
                x2={xi.toFixed(1)}
                y2={PAD.t + ph}
                stroke="currentColor"
                strokeWidth="0.75"
                className="text-slate-200 dark:text-slate-700"
              />
              <text
                x={(xi + 5).toFixed(1)}
                y={(PAD.t + ph + 18).toFixed(1)}
                fill="currentColor"
                style={{ fontSize: 9 }}
                className="text-slate-400 dark:text-slate-500"
              >
                {label}
              </text>
            </g>
          ))}

          {/* Area fill */}
          <path d={areaD} fill={`url(#${gradId})`} />

          {/* Feels-like line (dashed) */}
          <polyline
            points={feelsPts}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="1.5"
            strokeDasharray="5 3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Temp line */}
          <polyline
            points={tempPts}
            fill="none"
            stroke="#f97316"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Daily min/max markers */}
          {dailyMarkers.map(({ xi, yMax, yMin, tMax, tMin }) => (
            <g key={xi}>
              <circle
                cx={xi.toFixed(1)}
                cy={yMax.toFixed(1)}
                r="3"
                fill="#f97316"
                opacity="0.7"
              />
              <text
                x={xi.toFixed(1)}
                y={(yMax - 7).toFixed(1)}
                textAnchor="middle"
                fill="#f97316"
                style={{ fontSize: 10, fontWeight: 600 }}
                opacity="0.85"
              >
                {tMax}°
              </text>
              <circle
                cx={xi.toFixed(1)}
                cy={yMin.toFixed(1)}
                r="3"
                fill="#60a5fa"
                opacity="0.7"
              />
              <text
                x={xi.toFixed(1)}
                y={(yMin + 13).toFixed(1)}
                textAnchor="middle"
                fill="#60a5fa"
                style={{ fontSize: 10, fontWeight: 600 }}
                opacity="0.85"
              >
                {tMin}°
              </text>
            </g>
          ))}
        </svg>

        {/* Legenda */}
        <div className="border-theme-border text-theme-fg-muted flex flex-wrap gap-x-5 gap-y-1 border-t px-4 py-2.5 text-xs">
          <span className="flex items-center gap-2">
            <span className="block h-0.5 w-5 rounded-full bg-orange-400" />
            Temperatuur
          </span>
          <span className="flex items-center gap-2">
            <svg width="20" height="6" aria-hidden="true">
              <line
                x1="0"
                y1="3"
                x2="20"
                y2="3"
                stroke="#94a3b8"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
            </svg>
            Gevoelstemperatuur
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-orange-400 opacity-70" />
            Dagmax
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-400 opacity-70" />
            Dagmin
          </span>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// KPI BADGE
// =============================================================================

function KpiBadge({
  icon,
  label,
  value,
  valueClass,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
  /** Text indicator for elevated values — ensures non-color-only signalling */
  hint?: string;
}) {
  return (
    <div className="bg-theme-bg-subtle rounded-xl px-3 py-2.5">
      <div className="mb-1 flex items-center gap-1.5">
        {icon}
        <span className="text-theme-fg-muted text-[10px] leading-none font-medium">
          {label}
        </span>
      </div>
      <p
        className={cn(
          "text-sm leading-none font-bold tabular-nums",
          valueClass ?? "text-theme-fg"
        )}
      >
        {value}
        {hint && <span className="ml-1 text-[10px] font-semibold">{hint}</span>}
      </p>
    </div>
  );
}

// =============================================================================
// SIDE ROW  (Zon/Maan/Lucht kaarten)
// =============================================================================

function SideRow({
  icon,
  label,
  value,
  muted,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span
        className={cn(
          "flex items-center gap-1.5 text-xs",
          muted ? "text-theme-fg-muted" : "text-theme-fg-secondary"
        )}
      >
        {icon}
        {label}
      </span>
      <span
        className={cn(
          "text-xs font-semibold tabular-nums",
          muted ? "text-theme-fg-secondary" : "text-theme-fg"
        )}
      >
        {value}
      </span>
    </div>
  );
}

// =============================================================================
// SECTION TITLE
// =============================================================================

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-theme-fg-muted mb-3 text-[10px] font-bold tracking-[0.12em] uppercase">
      {children}
    </h2>
  );
}

// =============================================================================
// FORECAST ROW  (5-daagse samenvatting)
// =============================================================================

function ForecastRow({
  day,
  tz,
  leftPct,
  widthPct,
  hasBorder,
}: {
  day: DailyWeather;
  tz: number;
  leftPct: number;
  widthPct: number;
  hasBorder: boolean;
}) {
  return (
    <div className={cn("px-5 py-3.5", hasBorder && "border-theme-border border-t")}>
      {/* MOBIEL */}
      <div className="flex items-center gap-3 lg:hidden">
        <span className="text-theme-fg w-20 shrink-0 text-sm font-semibold capitalize">
          {fmtDayLabel(day.dt, tz)}
        </span>
        {day.weather[0] && (
          <Image
            src={owmIcon(day.weather[0].icon)}
            alt=""
            width={32}
            height={32}
            className="shrink-0"
          />
        )}
        <span className="text-theme-fg-secondary flex-1 truncate text-sm capitalize">
          {day.weather[0]?.description}
        </span>
        <span className="shrink-0 text-sm font-semibold">
          <span className="text-orange-500">{r(day.temp.max)}°</span>
          <span className="text-theme-fg-muted"> / {r(day.temp.min)}°</span>
        </span>
        <span aria-label={moonName(day.moon_phase)} className="shrink-0">
          <MoonPhase {...owmPhase(day.moon_phase)} size={20} glow={false} />
        </span>
      </div>
      <div className="text-theme-fg-muted mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs lg:hidden">
        <span className="flex items-center gap-1">
          <Wind className="h-3 w-3" />
          {kmh(day.wind_max)} km/u
          {day.wind_gust_max != null && ` (${kmh(day.wind_gust_max)})`}
        </span>
        {day.pop_max > 0.05 && (
          <span className="flex items-center gap-1 text-blue-500 dark:text-blue-400">
            <Droplets className="h-3 w-3" />
            {r(day.pop_max * 100)}%{day.rain_total > 0 && ` · ${day.rain_total}mm`}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Cloud className="h-3 w-3" />
          {day.clouds_avg}%
        </span>
      </div>

      {/* DESKTOP */}
      <div
        className="hidden items-center gap-4 lg:grid"
        style={{ gridTemplateColumns: "140px 36px 1fr 90px 160px 110px 36px" }}
      >
        <span className="text-theme-fg text-sm font-semibold capitalize">
          {fmtDayLabel(day.dt, tz)}
        </span>
        {day.weather[0] ? (
          <Image src={owmIcon(day.weather[0].icon)} alt="" width={32} height={32} />
        ) : (
          <span />
        )}
        <div className="min-w-0">
          <p className="text-theme-fg-secondary truncate text-sm capitalize">
            {day.weather[0]?.description}
          </p>
          <div className="text-theme-fg-muted mt-0.5 flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1">
              <Wind className="h-3 w-3 shrink-0" />
              {kmh(day.wind_max)} km/u
              {day.wind_gust_max != null && (
                <span className="opacity-60">(rukw. {kmh(day.wind_gust_max)})</span>
              )}
            </span>
            <span className="flex items-center gap-1 opacity-70">
              <Cloud className="h-3 w-3 shrink-0" />
              {day.clouds_avg}%
            </span>
          </div>
        </div>
        <div className="text-right text-sm font-semibold tabular-nums">
          <span className="text-orange-500">{r(day.temp.max)}°</span>
          <span className="text-theme-fg-muted font-normal"> / {r(day.temp.min)}°</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-theme-fg-muted w-7 text-right text-xs tabular-nums">
            {r(day.temp.min)}°
          </span>
          <div className="bg-theme-hover relative h-2 flex-1 overflow-hidden rounded-full">
            <div
              className="absolute h-2 rounded-full bg-gradient-to-r from-blue-400 to-orange-400"
              style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
            />
          </div>
          <span className="text-theme-fg-muted w-7 text-xs tabular-nums">
            {r(day.temp.max)}°
          </span>
        </div>
        <div className="text-xs">
          {day.pop_max > 0.05 ? (
            <div className="space-y-0.5">
              <p className="font-semibold text-blue-500 dark:text-blue-400">
                {r(day.pop_max * 100)}% kans
              </p>
              {day.rain_total > 0 && (
                <p className="text-blue-400/80">{day.rain_total} mm</p>
              )}
              {day.snow_total > 0 && (
                <p className="text-sky-400/80">{day.snow_total} mm sneeuw</p>
              )}
            </div>
          ) : (
            <span className="text-theme-fg-muted">Droog</span>
          )}
        </div>
        <div className="flex justify-center" aria-label={moonName(day.moon_phase)}>
          <MoonPhase {...owmPhase(day.moon_phase)} size={20} glow={false} />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// HOURLY CARD  (vandaag per uur)
// =============================================================================

function HourlyCard({ h, tz }: { h: HourlyWeather; tz: number }) {
  const isNight = h.pod === "n";
  return (
    <div
      className={cn(
        "flex min-w-[76px] shrink-0 flex-col items-center gap-1 rounded-xl px-2 py-3 text-center transition-colors",
        isNight
          ? "bg-theme-bg-subtle hover:bg-theme-hover"
          : "bg-theme-surface hover:bg-theme-hover"
      )}
    >
      <span className="text-theme-fg-muted text-[11px] font-medium tabular-nums">
        {fmtHour(h.dt, tz)}
      </span>
      {h.weather[0] && (
        <Image
          src={owmIcon(h.weather[0].icon)}
          alt={h.weather[0].description}
          width={36}
          height={36}
        />
      )}
      <span className="text-theme-fg text-base leading-none font-bold tabular-nums">
        {r(h.temp)}°
      </span>
      <span className="text-theme-fg-muted text-[11px] tabular-nums">
        {r(h.feels_like)}°
      </span>
      <div className="text-theme-fg-muted flex items-center gap-0.5 text-[11px] tabular-nums">
        <ArrowUp
          className="h-2.5 w-2.5 shrink-0"
          style={{ transform: `rotate(${h.wind_deg}deg)` }}
        />
        <span>{kmh(h.wind_speed)}</span>
      </div>
      {h.wind_gust != null && h.wind_gust > h.wind_speed * 1.3 && (
        <span className="text-[11px] text-orange-400">({kmh(h.wind_gust)})</span>
      )}
      <span
        className={cn(
          "text-[11px] font-semibold tabular-nums",
          h.pop > 0.1
            ? "text-blue-500 dark:text-blue-400"
            : "text-theme-fg-muted opacity-25"
        )}
      >
        {h.pop > 0.1 ? `${r(h.pop * 100)}%` : "—"}
      </span>
      {h.rain != null && h.rain > 0 ? (
        <span className="text-[11px] text-blue-400">{h.rain.toFixed(1)}mm</span>
      ) : h.snow != null && h.snow > 0 ? (
        <span className="text-[11px] text-sky-400">{h.snow.toFixed(1)}mm</span>
      ) : null}
    </div>
  );
}

// =============================================================================
// HOURLY SLOT  (komende dagen)
// =============================================================================

function HourlySlot({ h, tz }: { h: HourlyWeather; tz: number }) {
  const isNight = h.pod === "n";
  return (
    <div
      className={cn(
        "flex min-w-[56px] shrink-0 flex-col items-center gap-0.5 rounded-lg px-1 py-2 text-center text-[11px]",
        isNight ? "opacity-65" : ""
      )}
    >
      <span className="text-theme-fg-muted tabular-nums">{fmtHour(h.dt, tz)}</span>
      {h.weather[0] && (
        <Image
          src={owmIcon(h.weather[0].icon)}
          alt={h.weather[0].description}
          width={28}
          height={28}
        />
      )}
      <span className="text-theme-fg font-bold tabular-nums">{r(h.temp)}°</span>
      <span className="text-theme-fg-muted tabular-nums">{r(h.feels_like)}°</span>
      <div className="text-theme-fg-muted flex items-center gap-0.5 tabular-nums">
        <ArrowUp
          className="h-2.5 w-2.5 shrink-0"
          style={{ transform: `rotate(${h.wind_deg}deg)` }}
        />
        <span>{kmh(h.wind_speed)}</span>
      </div>
      {h.wind_gust != null && h.wind_gust > h.wind_speed * 1.3 && (
        <span className="text-orange-400">({kmh(h.wind_gust)})</span>
      )}
      <span
        className={cn(
          h.pop > 0.1
            ? "font-medium text-blue-500 dark:text-blue-400"
            : "text-theme-fg-muted opacity-25"
        )}
      >
        {h.pop > 0.1 ? `${r(h.pop * 100)}%` : "—"}
      </span>
      {h.rain != null && h.rain > 0 ? (
        <span className="text-blue-400">{h.rain.toFixed(1)}mm</span>
      ) : h.snow != null && h.snow > 0 ? (
        <span className="text-sky-400">{h.snow.toFixed(1)}mm</span>
      ) : null}
    </div>
  );
}
