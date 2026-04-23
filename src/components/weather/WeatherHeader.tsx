"use client";

import { MapPin, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface WeatherHeaderProps {
  location: string;
  country: string;
  lastUpdated: Date | null;
  refreshing: boolean;
  onRefresh: () => void;
}

export function WeatherHeader({
  location,
  country,
  lastUpdated,
  refreshing,
  onRefresh,
}: WeatherHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
        <MapPin className="text-theme-primary h-4 w-4 shrink-0" />
        <span className="text-theme-fg font-semibold">{location}</span>
        <span className="text-theme-fg-muted text-sm">{country}</span>
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
        onClick={onRefresh}
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
  );
}
