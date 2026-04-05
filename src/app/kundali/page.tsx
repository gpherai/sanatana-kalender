"use client";

import { useState } from "react";
import { PageLayout } from "@/components/layout";
import { Star, TriangleAlert } from "lucide-react";
import type { BirthChart, GrahaKey } from "@/server/panchanga/types";

// =============================================================================
// GRAHA DISPLAY CONFIG
// =============================================================================

const GRAHA_ORDER: GrahaKey[] = [
  "surya",
  "chandra",
  "mangala",
  "budha",
  "guru",
  "shukra",
  "shani",
  "rahu",
  "ketu",
  "uranus",
  "neptune",
  "pluto",
];

const GRAHA_SYMBOL: Record<GrahaKey, string> = {
  surya: "☉",
  chandra: "☽",
  mangala: "♂",
  budha: "☿",
  guru: "♃",
  shukra: "♀",
  shani: "♄",
  rahu: "☊",
  ketu: "☋",
  uranus: "♅",
  neptune: "♆",
  pluto: "♇",
};

// =============================================================================
// FORM STATE
// =============================================================================

interface FormState {
  day: string;
  month: string;
  year: string;
  time: string;
  lat: string;
  lon: string;
  tz: string;
}

const EMPTY_FORM: FormState = {
  day: "",
  month: "",
  year: "",
  time: "",
  lat: "",
  lon: "",
  tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
};

// =============================================================================
// HELPERS
// =============================================================================

function formatDeg(deg: number): string {
  const d = Math.floor(deg);
  const mFull = (deg - d) * 60;
  const m = Math.floor(mFull);
  const s = Math.round((mFull - m) * 60);
  return `${d}°${m.toString().padStart(2, "0")}'${s.toString().padStart(2, "0")}"`;
}

function formatLon(lon: number): string {
  const inSign = lon % 30;
  return `${formatDeg(inSign)} (${lon.toFixed(2)}°)`;
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function FormField({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-theme-fg-muted text-xs font-semibold tracking-wide uppercase">
        {label}
      </label>
      {children}
      {hint && <p className="text-theme-fg-muted text-xs">{hint}</p>}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={
        "border-theme-border bg-theme-surface text-theme-fg rounded-lg border px-3 py-2 text-sm " +
        "focus:border-theme-primary focus:ring-theme-primary-20 focus:ring-2 focus:outline-none " +
        (props.className ?? "")
      }
    />
  );
}

function GrahaRow({ grahaKey, chart }: { grahaKey: GrahaKey; chart: BirthChart }) {
  const g = chart.grahas[grahaKey];
  if (!g) return null;

  return (
    <tr className="border-theme-border border-b last:border-0">
      <td className="py-3 pr-4">
        <div className="flex items-center gap-2">
          <span className="text-theme-primary w-5 text-center text-base">
            {GRAHA_SYMBOL[grahaKey]}
          </span>
          <span className="text-theme-fg font-semibold">{g.name}</span>
          {g.retrograde && (
            <span
              className="text-theme-fg-muted rounded border border-current px-1 text-[10px]"
              title="Retrograde"
            >
              R
            </span>
          )}
        </div>
      </td>
      <td className="py-3 pr-4">
        <span className="text-theme-fg font-medium">{g.rashi.name}</span>
        <span className="text-theme-fg-muted ml-1 text-xs">
          {g.degreeInRashi.toFixed(2)}°
        </span>
      </td>
      <td className="py-3 pr-4">
        <span className="text-theme-fg">{g.nakshatra.name}</span>
        <span className="text-theme-fg-muted ml-1 text-xs">pada {g.nakshatra.pada}</span>
      </td>
      <td className="py-3 text-right">
        <span className="text-theme-fg-muted font-mono text-xs">
          {formatLon(g.longitude)}
        </span>
      </td>
    </tr>
  );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function KundaliPage() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chart, setChart] = useState<BirthChart | null>(null);

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setChart(null);
    setLoading(true);

    const lat = parseFloat(form.lat);
    const lon = parseFloat(form.lon);
    const d = parseInt(form.day, 10);
    const m = parseInt(form.month, 10);
    const y = parseInt(form.year, 10);

    if (isNaN(lat) || isNaN(lon)) {
      setError("Breedtegraad en lengtegraad moeten getallen zijn.");
      setLoading(false);
      return;
    }
    if (isNaN(d) || isNaN(m) || isNaN(y) || d < 1 || d > 31 || m < 1 || m > 12) {
      setError("Ongeldige geboortedatum.");
      setLoading(false);
      return;
    }

    const dateStr = `${y.toString().padStart(4, "0")}-${m.toString().padStart(2, "0")}-${d.toString().padStart(2, "0")}`;

    try {
      const res = await fetch("/api/kundali", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateStr, time: form.time, lat, lon, tz: form.tz }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Onbekende fout");
      } else {
        setChart(data as BirthChart);
      }
    } catch {
      setError("Kon de server niet bereiken.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageLayout width="medium" spacing>
      {/* Header */}
      <div className="flex items-center gap-3">
        <Star className="text-theme-primary h-6 w-6" />
        <div>
          <h1 className="text-theme-fg text-2xl font-bold">Kundali</h1>
          <p className="text-theme-fg-muted text-sm">
            Geboortehoroscoop — Jyotisha (Lahiri ayanamsa · Whole Sign huizen · Mean Node)
          </p>
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-theme-surface-raised rounded-xl p-6 shadow"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Geboortedatum">
            <div className="flex gap-2">
              <Input
                type="number"
                required
                min="1"
                max="31"
                placeholder="DD"
                value={form.day}
                onChange={set("day")}
                className="w-16 text-center"
              />
              <Input
                type="number"
                required
                min="1"
                max="12"
                placeholder="MM"
                value={form.month}
                onChange={set("month")}
                className="w-16 text-center"
              />
              <Input
                type="number"
                required
                min="1800"
                max="2100"
                placeholder="JJJJ"
                value={form.year}
                onChange={set("year")}
                className="w-24"
              />
            </div>
          </FormField>

          <FormField label="Geboortetijd" hint="24-uurs notatie (lokale tijd)">
            <Input
              type="time"
              required
              step="60"
              value={form.time}
              onChange={set("time")}
              className="w-32"
            />
          </FormField>

          <FormField label="Breedtegraad (lat)" hint="Bijv. 52.0893 voor Den Haag">
            <Input
              type="number"
              required
              step="any"
              min="-90"
              max="90"
              placeholder="52.0893"
              value={form.lat}
              onChange={set("lat")}
            />
          </FormField>

          <FormField label="Lengtegraad (lon)" hint="Bijv. 4.3683 voor Den Haag">
            <Input
              type="number"
              required
              step="any"
              min="-180"
              max="180"
              placeholder="4.3683"
              value={form.lon}
              onChange={set("lon")}
            />
          </FormField>

          <FormField label="Tijdzone" hint="IANA naam, bijv. Europe/Amsterdam">
            <Input
              type="text"
              required
              placeholder="Europe/Amsterdam"
              value={form.tz}
              onChange={set("tz")}
            />
          </FormField>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-theme-primary text-theme-primary-fg hover:bg-theme-primary-80 mt-6 rounded-lg px-6 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {loading ? "Berekenen..." : "Bereken Kundali"}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Result */}
      {chart && (
        <div className="space-y-6">
          {/* Lagna */}
          <div className="bg-theme-surface-raised rounded-xl p-6 shadow">
            <h2 className="text-theme-fg mb-4 text-base font-semibold">
              Lagna (Ascendant)
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-theme-fg-muted text-xs font-semibold tracking-wide uppercase">
                  Rashi
                </p>
                <p className="text-theme-fg mt-1 text-lg font-bold">
                  {chart.lagna.rashi.name}
                </p>
                <p className="text-theme-fg-muted text-xs">
                  {chart.lagna.degreeInRashi.toFixed(2)}°
                </p>
              </div>
              <div>
                <p className="text-theme-fg-muted text-xs font-semibold tracking-wide uppercase">
                  Nakshatra
                </p>
                <p className="text-theme-fg mt-1 font-semibold">
                  {chart.lagna.nakshatra.name}
                </p>
                <p className="text-theme-fg-muted text-xs">
                  pada {chart.lagna.nakshatra.pada}
                </p>
              </div>
              <div>
                <p className="text-theme-fg-muted text-xs font-semibold tracking-wide uppercase">
                  Ayanamsa
                </p>
                <p className="text-theme-fg mt-1 font-semibold">{chart.ayanamsa.name}</p>
                <p className="text-theme-fg-muted text-xs">
                  {chart.ayanamsa.degrees.toFixed(6)}°
                </p>
              </div>
            </div>
          </div>

          {/* Grahas */}
          <div className="bg-theme-surface-raised rounded-xl p-6 shadow">
            <h2 className="text-theme-fg mb-4 text-base font-semibold">Navagrahas</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-theme-border border-b">
                    <th className="text-theme-fg-muted pr-4 pb-2 text-left text-xs font-semibold tracking-wide uppercase">
                      Graha
                    </th>
                    <th className="text-theme-fg-muted pr-4 pb-2 text-left text-xs font-semibold tracking-wide uppercase">
                      Rashi
                    </th>
                    <th className="text-theme-fg-muted pr-4 pb-2 text-left text-xs font-semibold tracking-wide uppercase">
                      Nakshatra
                    </th>
                    <th className="text-theme-fg-muted pb-2 text-right text-xs font-semibold tracking-wide uppercase">
                      Longitude
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {GRAHA_ORDER.map((key) => (
                    <GrahaRow key={key} grahaKey={key} chart={chart} />
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-theme-fg-muted mt-4 text-xs">
              R = Retrograde · Mean Node voor Rahu/Ketu
            </p>
          </div>

          {/* Technical metadata */}
          <details className="text-theme-fg-muted text-xs">
            <summary className="cursor-pointer">Technische details</summary>
            <div className="mt-2 space-y-1 font-mono">
              <p>Julian Day: {chart.julianDay.toFixed(8)}</p>
              <p>
                Geboorte UTC:{" "}
                {new Date((chart.julianDay - 2440587.5) * 86400000).toISOString()}
              </p>
              <p>Ayanamsa: {chart.ayanamsa.degrees.toFixed(8)}°</p>
            </div>
          </details>
        </div>
      )}
    </PageLayout>
  );
}
