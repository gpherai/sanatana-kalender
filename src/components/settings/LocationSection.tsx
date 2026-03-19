"use client";

import { MapPin, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Section } from "@/components/ui";
import { PRESET_LOCATIONS } from "@/lib/domain";

// =============================================================================
// TYPES
// =============================================================================

interface DailyInfo {
  sunrise: string | null;
  sunset: string | null;
  moonPhasePercent: number;
  moonPhaseName: string;
  isWaxing: boolean;
}

interface LocationSectionProps {
  locationName: string;
  locationLat: number;
  locationLon: number;
  dailyInfo: DailyInfo | null;
  onLocationPreset: (preset: (typeof PRESET_LOCATIONS)[number]) => void;
  onLocationChange: (
    field: "locationName" | "locationLat" | "locationLon",
    value: string | number
  ) => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function LocationSection({
  locationName,
  locationLat,
  locationLon,
  dailyInfo,
  onLocationPreset,
  onLocationChange,
}: LocationSectionProps) {
  return (
    <Section
      title="Locatie"
      description="Voor zon- en maanberekeningen"
      icon={MapPin}
      iconColor="accent"
    >
      {/* Preset locations */}
      <div className="mb-6">
        <label className="text-theme-fg-secondary mb-2 block text-sm font-medium">
          Snelle selectie
        </label>
        <div className="flex flex-wrap gap-2">
          {PRESET_LOCATIONS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => onLocationPreset(preset)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm transition-all",
                locationName === preset.name
                  ? "bg-theme-primary text-white shadow-md"
                  : "bg-theme-surface-raised text-theme-fg-secondary hover:bg-theme-hover"
              )}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Location name */}
        <div>
          <label
            htmlFor="locationName"
            className="text-theme-fg-secondary mb-2 block text-sm font-medium"
          >
            Naam
          </label>
          <input
            id="locationName"
            type="text"
            value={locationName}
            onChange={(e) => onLocationChange("locationName", e.target.value)}
            className="focus:ring-theme-primary-50 focus:border-theme-primary border-theme-border bg-theme-surface text-theme-fg w-full rounded-lg border px-3 py-2 focus:ring-2"
          />
        </div>

        {/* Latitude */}
        <div>
          <label
            htmlFor="locationLat"
            className="text-theme-fg-secondary mb-2 block text-sm font-medium"
          >
            Breedtegraad
          </label>
          <input
            id="locationLat"
            type="number"
            step="0.0001"
            value={locationLat}
            onChange={(e) =>
              onLocationChange("locationLat", parseFloat(e.target.value) || 0)
            }
            className="focus:ring-theme-primary-50 focus:border-theme-primary border-theme-border bg-theme-surface text-theme-fg w-full rounded-lg border px-3 py-2 focus:ring-2"
          />
        </div>

        {/* Longitude */}
        <div>
          <label
            htmlFor="locationLon"
            className="text-theme-fg-secondary mb-2 block text-sm font-medium"
          >
            Lengtegraad
          </label>
          <input
            id="locationLon"
            type="number"
            step="0.0001"
            value={locationLon}
            onChange={(e) =>
              onLocationChange("locationLon", parseFloat(e.target.value) || 0)
            }
            className="focus:ring-theme-primary-50 focus:border-theme-primary border-theme-border bg-theme-surface text-theme-fg w-full rounded-lg border px-3 py-2 focus:ring-2"
          />
        </div>
      </div>

      {/* Sun/Moon preview */}
      {dailyInfo && (
        <div className="bg-theme-gradient-subtle border-theme-primary-30 mt-6 rounded-xl border p-4">
          <h3 className="text-theme-fg-secondary mb-3 text-sm font-medium">
            📍 Vandaag in {locationName}
          </h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="flex items-center gap-2">
              <Sun className="h-5 w-5 text-amber-500" />
              <div>
                <div className="text-theme-fg-muted text-xs">Zonsopgang</div>
                <div className="text-theme-fg font-medium">
                  {dailyInfo.sunrise ?? "-"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Sun className="h-5 w-5 text-orange-500" />
              <div>
                <div className="text-theme-fg-muted text-xs">Zonsondergang</div>
                <div className="text-theme-fg font-medium">{dailyInfo.sunset ?? "-"}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Moon className="h-5 w-5 text-indigo-500" />
              <div>
                <div className="text-theme-fg-muted text-xs">Maanfase</div>
                <div className="text-theme-fg font-medium">{dailyInfo.moonPhaseName}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Moon className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-theme-fg-muted text-xs">Verlicht</div>
                <div className="text-theme-fg font-medium">
                  {dailyInfo.moonPhasePercent}%
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Section>
  );
}
