"use client";

import { Calendar } from "lucide-react";
import { Section } from "@/components/ui";

// =============================================================================
// TYPES
// =============================================================================

interface CalendarSectionProps {
  defaultView: string;
  weekStartsOn: number;
  timezone: string;
  onFieldChange: (field: string, value: string | number) => void;
}

const VIEW_OPTIONS = [
  { value: "month", label: "Maand" },
  { value: "week", label: "Week" },
  { value: "day", label: "Dag" },
  { value: "agenda", label: "Agenda" },
] as const;

const WEEK_START_OPTIONS = [
  { value: 0, label: "Zondag" },
  { value: 1, label: "Maandag" },
  { value: 6, label: "Zaterdag" },
] as const;

const TIMEZONE_OPTIONS = [
  { value: "Europe/Amsterdam", label: "Amsterdam (CET/CEST)" },
  { value: "Europe/London", label: "Londen (GMT/BST)" },
  { value: "Asia/Kolkata", label: "India (IST)" },
  { value: "America/New_York", label: "New York (EST/EDT)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
] as const;

// =============================================================================
// COMPONENT
// =============================================================================

export function CalendarSection({
  defaultView,
  weekStartsOn,
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
            className="mb-2 block text-sm font-medium text-theme-fg-secondary"
          >
            Standaard weergave
          </label>
          <select
            id="defaultView"
            value={defaultView}
            onChange={(e) => onFieldChange("defaultView", e.target.value)}
            className="focus:ring-theme-primary-50 focus:border-theme-primary w-8/12 rounded-lg border border-theme-border bg-theme-surface px-3 py-2 text-theme-fg focus:ring-2"
          >
            {VIEW_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Week starts on */}
        <div>
          <label
            htmlFor="weekStartsOn"
            className="mb-2 block text-sm font-medium text-theme-fg-secondary"
          >
            Week begint op
          </label>
          <select
            id="weekStartsOn"
            value={weekStartsOn}
            onChange={(e) => onFieldChange("weekStartsOn", parseInt(e.target.value))}
            className="focus:ring-theme-primary-50 focus:border-theme-primary w-8/12 rounded-lg border border-theme-border bg-theme-surface px-3 py-2 text-theme-fg focus:ring-2"
          >
            {WEEK_START_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Timezone */}
        <div className="sm:col-span-2">
          <label
            htmlFor="timezone"
            className="mb-2 block text-sm font-medium text-theme-fg-secondary"
          >
            Tijdzone
          </label>
          <select
            id="timezone"
            value={timezone}
            onChange={(e) => onFieldChange("timezone", e.target.value)}
            className="focus:ring-theme-primary-50 focus:border-theme-primary w-full rounded-lg border border-theme-border bg-theme-surface px-3 py-2 text-theme-fg focus:ring-2 sm:w-8/12"
          >
            {TIMEZONE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </Section>
  );
}
