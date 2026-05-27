"use client";

import { FormField, Input } from "./kundali-ui";
import type { FormState } from "./useKundaliForm";

interface Props {
  form: FormState;
  loading: boolean;
  hasSaved: boolean;
  onFieldChange: (
    field: keyof FormState
  ) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClearSaved: () => void;
}

export function KundaliForm({
  form,
  loading,
  hasSaved,
  onFieldChange,
  onSubmit,
  onClearSaved,
}: Props) {
  return (
    <form onSubmit={onSubmit} className="bg-theme-surface-raised rounded-xl p-6 shadow">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Geboortedatum">
          <div className="flex gap-2" role="group" aria-label="Geboortedatum">
            <Input
              type="number"
              inputMode="numeric"
              required
              min="1"
              max="31"
              placeholder="DD"
              value={form.day}
              onChange={onFieldChange("day")}
              className="w-16 text-center"
            />
            <Input
              type="number"
              inputMode="numeric"
              required
              min="1"
              max="12"
              placeholder="MM"
              value={form.month}
              onChange={onFieldChange("month")}
              className="w-16 text-center"
            />
            <Input
              type="number"
              inputMode="numeric"
              required
              min="1800"
              max="2100"
              placeholder="JJJJ"
              value={form.year}
              onChange={onFieldChange("year")}
              className="w-24"
            />
          </div>
        </FormField>

        <FormField
          label="Geboortetijd"
          hint="24-uurs notatie (lokale tijd)"
          id="birth-time"
        >
          <Input
            id="birth-time"
            type="time"
            required
            step="60"
            value={form.time}
            onChange={onFieldChange("time")}
            className="w-32"
          />
        </FormField>

        <FormField
          label="Breedtegraad (lat)"
          hint="Bijv. 52.0893 voor Den Haag"
          id="birth-lat"
        >
          <Input
            id="birth-lat"
            type="number"
            inputMode="decimal"
            required
            step="any"
            min="-90"
            max="90"
            placeholder="52.0893"
            value={form.lat}
            onChange={onFieldChange("lat")}
          />
        </FormField>

        <FormField
          label="Lengtegraad (lon)"
          hint="Bijv. 4.3683 voor Den Haag"
          id="birth-lon"
        >
          <Input
            id="birth-lon"
            type="number"
            inputMode="decimal"
            required
            step="any"
            min="-180"
            max="180"
            placeholder="4.3683"
            value={form.lon}
            onChange={onFieldChange("lon")}
          />
        </FormField>

        <FormField
          label="Tijdzone"
          hint="IANA naam, bijv. Europe/Amsterdam"
          id="birth-tz"
        >
          <Input
            id="birth-tz"
            type="text"
            required
            placeholder="Europe/Amsterdam"
            value={form.tz}
            onChange={onFieldChange("tz")}
          />
        </FormField>
      </div>

      <div className="mt-6 flex items-center gap-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-theme-primary text-theme-primary-fg hover:bg-theme-primary-80 cursor-pointer rounded-lg px-6 py-2.5 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Berekenen..." : "Bereken Kundali"}
        </button>
        {hasSaved && (
          <p className="text-theme-fg-muted text-xs">
            Gegevens opgeslagen ·{" "}
            <button
              type="button"
              onClick={onClearSaved}
              className="text-theme-primary focus-visible:ring-theme-primary cursor-pointer rounded hover:underline focus-visible:ring-2 focus-visible:outline-none"
            >
              Wissen
            </button>
          </p>
        )}
      </div>
    </form>
  );
}
