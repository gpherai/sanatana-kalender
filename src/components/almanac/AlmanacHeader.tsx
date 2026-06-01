"use client";

import { MapPin } from "lucide-react";

interface AlmanacHeaderProps {
  location: string;
}

export function AlmanacHeader({ location }: AlmanacHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-theme-primary mb-1 text-sm font-medium tracking-wide opacity-80">
          पञ्चाङ्ग · Pañcāṅga
        </p>
        <h1 className="text-theme-fg text-3xl font-bold">Panchang Almanac</h1>
        <p className="text-theme-fg-muted mt-1 text-sm">
          Astronomische kalender met zon- en maanstanden
        </p>
      </div>

      <div className="bg-theme-surface-raised flex items-center gap-2 rounded-full px-4 py-2 shadow-sm">
        <MapPin className="text-theme-primary h-4 w-4" />
        <span className="text-theme-fg text-sm font-medium">{location}</span>
      </div>
    </div>
  );
}
