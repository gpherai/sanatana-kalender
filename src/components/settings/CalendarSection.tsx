"use client";

import { Calendar } from "lucide-react";
import { Section } from "@/components/ui/Section";

// =============================================================================
// TYPES
// =============================================================================

interface CalendarSectionProps {
  defaultView: string;
  timezone: string;
  onFieldChange: (field: string, value: string | number) => void;
}

const VIEW_OPTIONS = [
  { value: "month", label: "Maand" },
  { value: "week", label: "Week" },
  { value: "day", label: "Dag" },
  { value: "agenda", label: "Agenda" },
] as const;

// =============================================================================
// COMPONENT
// =============================================================================

export function CalendarSection({
  defaultView,
  timezone,
  onFieldChange,
}: CalendarSectionProps) {
  return (
    <Section
      title="Kalender"
      description="Standaard weergave en instellingen"
      icon={Calendar}
      iconColor="secondary"
    >
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Default view */}
        <div>
          <label
            htmlFor="defaultView"
            className="text-theme-fg-secondary mb-2 block text-sm font-medium"
          >
            Standaard weergave
          </label>
          <select
            id="defaultView"
            value={defaultView}
            onChange={(e) => onFieldChange("defaultView", e.target.value)}
            className="focus:ring-theme-primary-50 focus:border-theme-primary border-theme-border bg-theme-surface text-theme-fg w-8/12 rounded-lg border px-3 py-2 focus:ring-2"
          >
            {VIEW_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Timezone */}
        <div>
          <div className="text-theme-fg-secondary mb-2 block text-sm font-medium">
            Tijdzone
          </div>
          <div
            aria-label="Tijdzone"
            className="border-theme-border bg-theme-bg-muted text-theme-fg w-full rounded-lg border px-3 py-2 sm:w-8/12"
          >
            {timezone}
          </div>
          <p className="text-theme-fg-muted mt-2 text-xs">
            Vast gekoppeld aan de centrale app-locatie.
          </p>
        </div>
      </div>
    </Section>
  );
}
