"use client";

import Image from "next/image";
import { ArrowUp, Cloud, Droplets, Eye, Gauge, Thermometer, Wind } from "lucide-react";
import { KpiBadge } from "@/components/weather/WeatherPrimitives";
import { kmh, owmIcon, roundWeather as r, windDir } from "@/lib/weather";
import type { CurrentWeather, DailyWeather } from "@/types/weather";

interface CurrentWeatherCardProps {
  current: CurrentWeather;
  today: DailyWeather | undefined;
}

export function CurrentWeatherCard({ current: c, today }: CurrentWeatherCardProps) {
  const pressureLabel =
    c.sea_level > 1020
      ? "Hoog · stabiel"
      : c.sea_level < 1000
        ? "Laag · onstabiel"
        : "Normaal";

  return (
    <div className="theme-card relative overflow-hidden p-5 md:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-theme-fg-muted text-[10px] font-bold tracking-[0.12em] uppercase">
          Huidig weer
        </span>
        {c.weather[0] && (
          <span className="theme-chip px-3 py-1 text-xs font-medium capitalize">
            {c.weather[0].description}
          </span>
        )}
      </div>

      <div className="mb-5 flex items-start gap-1">
        {c.weather[0] && (
          <Image
            src={owmIcon(c.weather[0].icon, 4)}
            alt={c.weather[0].description}
            width={80}
            height={80}
            loading="eager"
            fetchPriority="high"
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

      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <KpiBadge
          icon={<Cloud className="text-theme-fg-muted h-4 w-4" />}
          label="Bewolking"
          value={`${c.clouds}%`}
        />
        <KpiBadge
          icon={<Eye className="text-theme-fg-muted h-4 w-4" />}
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
