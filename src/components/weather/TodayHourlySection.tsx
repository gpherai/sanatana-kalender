"use client";

import { HourlyCard } from "@/components/weather/HourlyCards";
import type { HourlyWeather } from "@/types/weather";

interface TodayHourlySectionProps {
  hourly: HourlyWeather[];
  timezoneOffset: number;
}

export function TodayHourlySection({ hourly, timezoneOffset }: TodayHourlySectionProps) {
  if (hourly.length === 0) return null;

  return (
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
            {hourly.map((h) => (
              <HourlyCard key={h.dt} h={h} timezoneOffset={timezoneOffset} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
