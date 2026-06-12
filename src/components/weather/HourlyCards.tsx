"use client";

import Image from "next/image";
import { ArrowUp, Cloud, Droplets, Eye, Gauge, Wind } from "lucide-react";
import { HourlyDetailStat } from "@/components/weather/WeatherPrimitives";
import { cn } from "@/lib/utils";
import { fmtHour, kmh, owmIcon, roundWeather as r, windDir } from "@/lib/weather";
import type { HourlyWeather } from "@/types/weather";

export function HourlyCard({
  h,
  timezoneOffset,
}: {
  h: HourlyWeather;
  timezoneOffset: number;
}) {
  const isNight = h.pod === "n";
  const precipLabel = h.pop > 0.1 ? `${r(h.pop * 100)}%` : "—";
  const pressureLabel = `${h.pressure} hPa`;
  const visibilityLabel = `${(h.visibility / 1000).toFixed(1)} km`;
  const description = h.weather[0]?.description ?? "Onbekend";

  return (
    <div
      className={cn(
        "flex min-w-[176px] shrink-0 flex-col gap-2 rounded-xl px-2.5 py-3 transition-colors",
        isNight
          ? "bg-theme-bg-subtle hover:bg-theme-hover"
          : "bg-theme-surface hover:bg-theme-hover"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-theme-fg-muted text-[11px] font-medium tabular-nums">
            {fmtHour(h.dt, timezoneOffset)}
          </span>
          <p className="text-theme-fg mt-1 text-xs leading-snug font-medium capitalize">
            {description}
          </p>
        </div>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
            isNight
              ? "bg-theme-hover text-theme-fg-secondary"
              : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
          )}
        >
          {isNight ? "Nacht" : "Dag"}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {h.weather[0] && (
          <Image
            src={owmIcon(h.weather[0].icon)}
            alt={h.weather[0].description}
            width={42}
            height={42}
            unoptimized
          />
        )}
        <div>
          <div className="text-theme-fg text-xl leading-none font-bold tabular-nums">
            {r(h.temp)}°
          </div>
          <div className="text-theme-fg-muted mt-1 text-[11px] tabular-nums">
            gevoel {r(h.feels_like)}°
          </div>
        </div>
      </div>

      <div className="text-theme-fg-muted flex items-center justify-between gap-2 text-[11px] tabular-nums">
        <span className="flex items-center gap-1">
          <ArrowUp
            className="h-3 w-3 shrink-0"
            style={{ transform: `rotate(${h.wind_deg}deg)` }}
          />
          {windDir(h.wind_deg)} {kmh(h.wind_speed)} km/u
        </span>
        {h.wind_gust != null && h.wind_gust > h.wind_speed * 1.3 && (
          <span className="text-orange-400">rukw. {kmh(h.wind_gust)}</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <HourlyDetailStat
          icon={<Droplets className="h-3 w-3 text-blue-400" />}
          label="Neerslag"
          value={precipLabel}
        />
        <HourlyDetailStat
          icon={<Cloud className="text-theme-fg-muted h-3 w-3" />}
          label="Bewolking"
          value={`${h.clouds}%`}
        />
        <HourlyDetailStat
          icon={<Droplets className="h-3 w-3 text-blue-400" />}
          label="Vochtigheid"
          value={`${h.humidity}%`}
        />
        <HourlyDetailStat
          icon={<Gauge className="text-theme-fg-muted h-3 w-3" />}
          label="Druk"
          value={pressureLabel}
        />
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <HourlyDetailStat
          icon={<Eye className="text-theme-fg-muted h-3 w-3" />}
          label="Zicht"
          value={visibilityLabel}
        />
        <HourlyDetailStat
          icon={<Wind className="text-theme-secondary h-3 w-3" />}
          label="Wind"
          value={`${kmh(h.wind_speed)} km/u`}
        />
      </div>

      {(h.rain != null && h.rain > 0) || (h.snow != null && h.snow > 0) ? (
        <div
          className={cn(
            "rounded-lg px-2 py-1 text-[11px] font-medium",
            h.rain != null && h.rain > 0
              ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
              : "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300"
          )}
        >
          {h.rain != null && h.rain > 0
            ? `${h.rain.toFixed(1)} mm regen`
            : `${(h.snow ?? 0).toFixed(1)} mm sneeuw`}
        </div>
      ) : (
        <div className="text-theme-fg-muted text-[11px]">
          Geen gemeten neerslaghoeveelheid
        </div>
      )}
    </div>
  );
}

export function HourlySlot({
  h,
  timezoneOffset,
}: {
  h: HourlyWeather;
  timezoneOffset: number;
}) {
  const isNight = h.pod === "n";
  const precipLabel = h.pop > 0.1 ? `${r(h.pop * 100)}%` : "—";
  const description = h.weather[0]?.description ?? "Onbekend";
  const precipAmount =
    h.rain != null && h.rain > 0
      ? `${h.rain.toFixed(1)} mm regen`
      : h.snow != null && h.snow > 0
        ? `${h.snow.toFixed(1)} mm sneeuw`
        : "Droog";

  return (
    <div
      className={cn(
        "flex min-w-[138px] shrink-0 flex-col gap-1.5 rounded-lg px-2 py-2 text-left text-[11px]",
        isNight ? "bg-theme-bg-subtle/70 opacity-90" : "bg-theme-surface"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-theme-fg-muted tabular-nums">
            {fmtHour(h.dt, timezoneOffset)}
          </div>
          <div className="text-theme-fg mt-0.5 line-clamp-2 text-[10px] leading-snug capitalize">
            {description}
          </div>
        </div>
        {h.weather[0] && (
          <Image
            src={owmIcon(h.weather[0].icon)}
            alt={h.weather[0].description}
            width={30}
            height={30}
            unoptimized
          />
        )}
      </div>

      <div className="flex items-end justify-between gap-2">
        <span className="text-theme-fg text-base font-bold tabular-nums">
          {r(h.temp)}°
        </span>
        <span className="text-theme-fg-muted text-[10px] tabular-nums">
          gevoel {r(h.feels_like)}°
        </span>
      </div>

      <div className="text-theme-fg-muted flex items-center justify-between gap-2 tabular-nums">
        <span className="flex items-center gap-1">
          <ArrowUp
            className="h-2.5 w-2.5 shrink-0"
            style={{ transform: `rotate(${h.wind_deg}deg)` }}
          />
          {windDir(h.wind_deg)} {kmh(h.wind_speed)}
        </span>
        {h.wind_gust != null && h.wind_gust > h.wind_speed * 1.3 && (
          <span className="text-orange-400">({kmh(h.wind_gust)})</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-1">
        <HourlyDetailStat
          icon={<Droplets className="h-3 w-3 text-blue-400" />}
          label="Neerslag"
          value={precipLabel}
          compact
        />
        <HourlyDetailStat
          icon={<Cloud className="text-theme-fg-muted h-3 w-3" />}
          label="Bew."
          value={`${h.clouds}%`}
          compact
        />
        <HourlyDetailStat
          icon={<Droplets className="h-3 w-3 text-blue-400" />}
          label="Vocht"
          value={`${h.humidity}%`}
          compact
        />
        <HourlyDetailStat
          icon={<Gauge className="text-theme-fg-muted h-3 w-3" />}
          label="Druk"
          value={`${h.pressure} hPa`}
          compact
        />
      </div>

      <div
        className={cn(
          "rounded-md px-2 py-1 text-[10px] font-medium",
          h.rain != null && h.rain > 0
            ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
            : h.snow != null && h.snow > 0
              ? "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300"
              : "bg-theme-bg-subtle text-theme-fg-muted"
        )}
      >
        {precipAmount}
      </div>
    </div>
  );
}
