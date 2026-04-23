"use client";

import Image from "next/image";
import { Cloud, Droplets, Wind } from "lucide-react";
import { MoonPhase } from "@/components/ui/MoonPhase";
import { SectionTitle } from "@/components/weather/WeatherPrimitives";
import { cn } from "@/lib/utils";
import {
  fmtDayLabel,
  kmh,
  moonName,
  owmIcon,
  owmPhase,
  roundWeather as r,
} from "@/lib/weather";
import type { DailyWeather } from "@/types/weather";

interface DailyForecastSectionProps {
  daily: DailyWeather[];
  timezoneOffset: number;
  allMin: number;
  tempRange: number;
  nowUnix: number;
}

export function DailyForecastSection({
  daily,
  timezoneOffset: tz,
  allMin,
  tempRange,
  nowUnix,
}: DailyForecastSectionProps) {
  return (
    <div>
      <SectionTitle>5-daagse verwachting</SectionTitle>
      <div className="theme-card overflow-hidden">
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
          const widthPct = Math.max(((day.temp.max - day.temp.min) / tempRange) * 100, 8);
          return (
            <ForecastRow
              key={day.dt}
              day={day}
              tz={tz}
              nowUnix={nowUnix}
              leftPct={leftPct}
              widthPct={widthPct}
              hasBorder={i > 0}
            />
          );
        })}
      </div>
    </div>
  );
}

function ForecastRow({
  day,
  tz,
  nowUnix,
  leftPct,
  widthPct,
  hasBorder,
}: {
  day: DailyWeather;
  tz: number;
  nowUnix: number;
  leftPct: number;
  widthPct: number;
  hasBorder: boolean;
}) {
  return (
    <div className={cn("px-5 py-3.5", hasBorder && "border-theme-border border-t")}>
      <div className="flex items-center gap-3 lg:hidden">
        <span className="text-theme-fg w-20 shrink-0 text-sm font-semibold capitalize">
          {fmtDayLabel(day.dt, tz, nowUnix)}
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

      <div
        className="hidden items-center gap-4 lg:grid"
        style={{ gridTemplateColumns: "140px 36px 1fr 90px 160px 110px 36px" }}
      >
        <span className="text-theme-fg text-sm font-semibold capitalize">
          {fmtDayLabel(day.dt, tz, nowUnix)}
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
