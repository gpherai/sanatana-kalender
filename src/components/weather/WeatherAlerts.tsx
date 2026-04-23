"use client";

import { AlertTriangle } from "lucide-react";
import { fmtTime } from "@/lib/weather";
import type { WeatherAlert } from "@/types/weather";

interface WeatherAlertsProps {
  alerts: WeatherAlert[];
  timezoneOffset: number;
}

export function WeatherAlerts({ alerts, timezoneOffset }: WeatherAlertsProps) {
  if (alerts.length === 0) return null;

  return (
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
              {fmtTime(alert.start, timezoneOffset)} -{" "}
              {fmtTime(alert.end, timezoneOffset)} · {alert.sender_name}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
