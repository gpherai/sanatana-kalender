"use client";

import { ArrowUp } from "lucide-react";
import { HourlySlot } from "@/components/weather/HourlyCards";
import { SectionTitle } from "@/components/weather/WeatherPrimitives";
import { cn } from "@/lib/utils";
import type { HourlyItem } from "@/lib/weather";

interface FutureHourlySectionProps {
  items: HourlyItem[];
  timezoneOffset: number;
}

export function FutureHourlySection({ items, timezoneOffset }: FutureHourlySectionProps) {
  if (items.length === 0) return null;

  return (
    <div>
      <SectionTitle>Per 3 uur · komende dagen</SectionTitle>
      <div className="theme-card">
        <div className="overflow-x-auto p-3">
          <div
            className="flex items-stretch gap-1"
            style={{ scrollSnapType: "x mandatory" }}
          >
            {items.map((item, i) =>
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
                <HourlySlot key={item.h.dt} h={item.h} timezoneOffset={timezoneOffset} />
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
  );
}
