"use client";

import { MapPin } from "lucide-react";

interface AlmanacHeaderProps {
  location: string;
}

export function AlmanacHeader({ location }: AlmanacHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold text-theme-fg">
          📅 Panchang Almanac
        </h1>
        <p className="mt-1 text-sm text-theme-fg-muted">
          Astronomische kalender met zon- en maanstanden
        </p>
      </div>

      <div className="flex items-center gap-2 rounded-full bg-theme-surface-raised px-4 py-2 shadow-sm">
        <MapPin className="h-4 w-4 text-theme-primary" />
        <span className="text-sm font-medium text-theme-fg">{location}</span>
      </div>
    </div>
  );
}
