"use client";

import { Droplets, Eye, Gauge, MoonStar, Sunrise, Sunset } from "lucide-react";
import { MoonPhase } from "@/components/ui/MoonPhase";
import { SideRow } from "@/components/weather/WeatherPrimitives";
import { dayLength, fmtTime, moonName, owmPhase, roundWeather as r } from "@/lib/weather";
import type { CurrentWeather, DailyWeather } from "@/types/weather";

interface WeatherAstronomyCardsProps {
  current: CurrentWeather;
  today: DailyWeather | undefined;
  timezoneOffset: number;
}

export function WeatherAstronomyCards({
  current: c,
  today,
  timezoneOffset: tz,
}: WeatherAstronomyCardsProps) {
  const moonPhase = today?.moon_phase ?? 0;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:flex lg:flex-col lg:gap-4">
      <div className="theme-card p-4">
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

      <div className="theme-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--theme-almanac-moon-bg)]">
            <MoonStar className="text-theme-icon-moon h-4 w-4" />
          </div>
          <span className="text-theme-fg text-sm font-semibold">Maan</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-theme-fg text-xs leading-snug font-medium">
              {moonName(moonPhase)}
            </p>
            <p className="text-theme-fg-muted mt-0.5 text-[10px]">
              Dag {r(moonPhase * 29.5)} · {moonPhase < 0.5 ? "Wassend" : "Afnemend"}
            </p>
          </div>
          <MoonPhase {...owmPhase(moonPhase)} size={32} glow={false} />
        </div>
      </div>

      <div className="theme-card col-span-2 p-4 sm:col-span-1">
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
  );
}
