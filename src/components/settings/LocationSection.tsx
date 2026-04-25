"use client";

import { MapPin, Sun, Moon } from "lucide-react";
import { Section } from "@/components/ui/Section";

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
}

// =============================================================================
// COMPONENT
// =============================================================================

export function LocationSection({
  locationName,
  locationLat,
  locationLon,
  dailyInfo,
}: LocationSectionProps) {
  return (
    <Section
      title="Locatie"
      description="Vaste centrale locatie voor zon-, maan-, weer- en kalenderberekeningen"
      icon={MapPin}
      iconColor="accent"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <div className="text-theme-fg-secondary mb-2 block text-sm font-medium">
            Naam
          </div>
          <div className="border-theme-border bg-theme-bg-muted text-theme-fg rounded-lg border px-3 py-2">
            {locationName}
          </div>
        </div>

        <div>
          <div className="text-theme-fg-secondary mb-2 block text-sm font-medium">
            Breedtegraad
          </div>
          <div className="border-theme-border bg-theme-bg-muted text-theme-fg rounded-lg border px-3 py-2">
            {locationLat}
          </div>
        </div>

        <div>
          <div className="text-theme-fg-secondary mb-2 block text-sm font-medium">
            Lengtegraad
          </div>
          <div className="border-theme-border bg-theme-bg-muted text-theme-fg rounded-lg border px-3 py-2">
            {locationLon}
          </div>
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
