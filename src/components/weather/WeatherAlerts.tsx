"use client";

import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtTime } from "@/lib/weather";
import type { WeatherAlert } from "@/types/weather";

interface WeatherAlertsProps {
  alerts: WeatherAlert[];
  timezoneOffset: number;
}

function alertTone(severity?: string) {
  const normalized = severity?.toLowerCase();

  if (normalized === "extreme" || normalized === "severe") {
    return {
      wrapper:
        "border-red-300 bg-red-50 text-red-900 dark:border-red-800/70 dark:bg-red-950/45 dark:text-red-100",
      icon: "text-red-600 dark:text-red-300",
      badge: "bg-red-100 text-red-800 dark:bg-red-900/70 dark:text-red-100",
      muted: "text-red-700/80 dark:text-red-200/75",
    };
  }

  return {
    wrapper:
      "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-100",
    icon: "text-amber-600 dark:text-amber-300",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/70 dark:text-amber-100",
    muted: "text-amber-700/80 dark:text-amber-200/75",
  };
}

export function WeatherAlerts({ alerts, timezoneOffset }: WeatherAlertsProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map((alert, i) => {
        const tone = alertTone(alert.severity);
        const badges = [
          alert.severity,
          alert.urgency,
          alert.certainty,
          ...(alert.tags ?? []).slice(0, 2),
        ].filter((badge): badge is string => Boolean(badge));

        return (
          <div
            key={`${alert.sender_name}-${alert.event}-${alert.start}-${i}`}
            className={cn("flex items-start gap-3 rounded-xl border p-4", tone.wrapper)}
          >
            <AlertTriangle className={cn("mt-0.5 h-5 w-5 shrink-0", tone.icon)} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="min-w-0 text-sm leading-5 font-semibold">
                  {alert.title ?? alert.event}
                </p>
                {badges.length > 0 && (
                  <div className="flex max-w-full shrink-0 flex-wrap gap-1">
                    {badges.map((badge, badgeIndex) => (
                      <span
                        key={`${badge}-${badgeIndex}`}
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] leading-4 font-semibold whitespace-nowrap",
                          tone.badge
                        )}
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <p className={cn("mt-1 line-clamp-2 text-xs leading-5", tone.muted)}>
                {alert.description}
              </p>

              <p className={cn("mt-2 truncate text-xs leading-4", tone.muted)}>
                {fmtTime(alert.start, timezoneOffset)} -{" "}
                {fmtTime(alert.end, timezoneOffset)} · {alert.sender_name}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
