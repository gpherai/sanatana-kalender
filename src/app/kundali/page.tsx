"use client";

import { useState } from "react";
import { PageLayout } from "@/components/layout";
import { Star, TriangleAlert, Grid2x2, Table2, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BirthChart, GrahaKey } from "@/server/panchanga/types";
import { KundaliChart, RASHI_NAMES } from "./KundaliChart";
import { NavamshaChart, navamshaRashi } from "./NavamshaChart";
import { VimshottariDasha } from "./VimshottariDasha";
import { getGrahaDignity, DIGNITY_LABEL, type Dignity } from "./graha-dignity";

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

const DIGNITY_STYLE: Record<NonNullable<Dignity>, string> = {
  uchcha: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  neecha: "bg-red-500/15 text-red-600 dark:text-red-400",
  moolatrikona: "bg-theme-primary-10 text-theme-primary",
  swarashi: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
};

function GrahaRow({ grahaKey, chart }: { grahaKey: GrahaKey; chart: BirthChart }) {
  const g = chart.grahas[grahaKey];
  if (!g) return null;

  const dignity = getGrahaDignity(grahaKey, g.rashi.number, g.degreeInRashi);

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
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-theme-fg font-medium">{g.rashi.name}</span>
          <span className="text-theme-fg-muted text-xs">
            {g.degreeInRashi.toFixed(2)}°
          </span>
          {dignity && (
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                DIGNITY_STYLE[dignity]
              )}
            >
              {DIGNITY_LABEL[dignity]}
            </span>
          )}
        </div>
      </td>
      <td className="py-3 pr-4">
        <span className="text-theme-fg">{g.nakshatra.name}</span>
        <span className="text-theme-fg-muted ml-1 text-xs">pada {g.nakshatra.pada}</span>
      </td>
      <td className="py-3 pr-4 text-right">
        <span className="text-theme-fg-muted font-mono text-xs">
          {formatLon(g.longitude)}
        </span>
      </td>
      <td className="py-3 text-right">
        <span
          className={cn(
            "font-mono text-xs",
            g.retrograde ? "text-theme-error" : "text-theme-fg-muted"
          )}
        >
          {g.speed >= 0 ? "+" : ""}
          {g.speed.toFixed(3)}°/d
        </span>
      </td>
    </tr>
  );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

type ResultView = "d1-chart" | "d1-table" | "d9-chart" | "d9-table";

export default function KundaliPage() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chart, setChart] = useState<BirthChart | null>(null);
  const [resultView, setResultView] = useState<ResultView>("d1-chart");

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
    // Validate using Date rollover: new Date(2023,1,31) → March, not Feb
    const testDate = new Date(y, m - 1, d);
    if (
      isNaN(d) ||
      isNaN(m) ||
      isNaN(y) ||
      testDate.getFullYear() !== y ||
      testDate.getMonth() !== m - 1 ||
      testDate.getDate() !== d
    ) {
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
        <div className="border-theme-error flex items-start gap-3 rounded-xl border bg-[var(--theme-error-bg)] p-4">
          <TriangleAlert className="text-theme-error mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-sm text-[var(--theme-error-fg)]">{error}</p>
        </div>
      )}

      {/* Result */}
      {chart && (
        <div className="space-y-6">
          {/* Lagna summary bar */}
          <div className="bg-theme-surface-raised rounded-xl p-4 shadow">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-6">
                <div>
                  <p className="text-theme-fg-muted text-xs font-semibold tracking-wide uppercase">
                    Lagna
                  </p>
                  <p className="text-theme-fg mt-0.5 text-lg font-bold">
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
                  <p className="text-theme-fg mt-0.5 font-semibold">
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
                  <p className="text-theme-fg mt-0.5 font-semibold">
                    {chart.ayanamsa.name}
                  </p>
                  <p className="text-theme-fg-muted text-xs">
                    {chart.ayanamsa.degrees.toFixed(4)}°
                  </p>
                </div>
              </div>

              {/* View toggle */}
              <div className="bg-theme-surface border-theme-border flex items-center gap-1 rounded-lg border p-1">
                <button
                  onClick={() => setResultView("d1-chart")}
                  style={{ touchAction: "manipulation" }}
                  title="D1 Grafiek"
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                    resultView === "d1-chart"
                      ? "bg-theme-primary-15 text-theme-primary"
                      : "text-theme-fg-muted hover:text-theme-fg"
                  )}
                >
                  <Grid2x2 className="h-3.5 w-3.5" />
                  D1
                </button>
                <button
                  onClick={() => setResultView("d1-table")}
                  style={{ touchAction: "manipulation" }}
                  title="D1 Tabel"
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                    resultView === "d1-table"
                      ? "bg-theme-primary-15 text-theme-primary"
                      : "text-theme-fg-muted hover:text-theme-fg"
                  )}
                >
                  <Table2 className="h-3.5 w-3.5" />
                </button>
                <div className="bg-theme-border mx-0.5 h-4 w-px shrink-0" />
                <button
                  onClick={() => setResultView("d9-chart")}
                  style={{ touchAction: "manipulation" }}
                  title="D9 Grafiek"
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                    resultView === "d9-chart"
                      ? "bg-theme-primary-15 text-theme-primary"
                      : "text-theme-fg-muted hover:text-theme-fg"
                  )}
                >
                  <Layers className="h-3.5 w-3.5" />
                  D9
                </button>
                <button
                  onClick={() => setResultView("d9-table")}
                  style={{ touchAction: "manipulation" }}
                  title="D9 Tabel"
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                    resultView === "d9-table"
                      ? "bg-theme-primary-15 text-theme-primary"
                      : "text-theme-fg-muted hover:text-theme-fg"
                  )}
                >
                  <Table2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* D1 chart */}
          {resultView === "d1-chart" && (
            <div className="mx-auto w-full max-w-2xl">
              <KundaliChart chart={chart} />
            </div>
          )}

          {/* D1 table */}
          {resultView === "d1-table" && (
            <div className="bg-theme-surface-raised rounded-xl p-6 shadow">
              <h2 className="text-theme-fg mb-4 text-base font-semibold">
                Navagrahas — D1
              </h2>
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
                      <th className="text-theme-fg-muted pr-4 pb-2 text-right text-xs font-semibold tracking-wide uppercase">
                        Longitude
                      </th>
                      <th className="text-theme-fg-muted pb-2 text-right text-xs font-semibold tracking-wide uppercase">
                        Snelheid
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
                R = Retrograde · Mean Node voor Rahu/Ketu ·{" "}
                <span className="text-amber-600 dark:text-amber-400">Uchcha</span> =
                verheven · <span className="text-red-600 dark:text-red-400">Neecha</span>{" "}
                = verzwakt · <span className="text-theme-primary">Mūlatrik.</span> =
                moolatrikona ·{" "}
                <span className="text-emerald-600 dark:text-emerald-400">Swarashi</span> =
                eigen teken
              </p>
            </div>
          )}

          {/* D9 chart */}
          {resultView === "d9-chart" && (
            <div className="mx-auto w-full max-w-2xl">
              <NavamshaChart chart={chart} />
            </div>
          )}

          {/* D9 table */}
          {resultView === "d9-table" && (
            <div className="bg-theme-surface-raised rounded-xl p-6 shadow">
              <h2 className="text-theme-fg mb-4 text-base font-semibold">
                Navagrahas — D9 Navamsha
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-theme-border border-b">
                      <th className="text-theme-fg-muted pr-4 pb-2 text-left text-xs font-semibold tracking-wide uppercase">
                        Graha
                      </th>
                      <th className="text-theme-fg-muted pr-4 pb-2 text-left text-xs font-semibold tracking-wide uppercase">
                        D1 Rashi
                      </th>
                      <th className="text-theme-fg-muted pr-4 pb-2 text-left text-xs font-semibold tracking-wide uppercase">
                        D9 Rashi
                      </th>
                      <th className="text-theme-fg-muted pb-2 text-right text-xs font-semibold tracking-wide uppercase">
                        D9 Graad
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {GRAHA_ORDER.map((key) => {
                      const g = chart.grahas[key];
                      if (!g) return null;
                      const d9Rashi = navamshaRashi(g.longitude);
                      const d9Deg = (g.degreeInRashi % (30 / 9)) * 9;
                      const d9Dignity = getGrahaDignity(key, d9Rashi, d9Deg);
                      return (
                        <tr
                          key={key}
                          className="border-theme-border border-b last:border-0"
                        >
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2">
                              <span className="text-theme-primary w-5 text-center text-base">
                                {GRAHA_SYMBOL[key]}
                              </span>
                              <span className="text-theme-fg font-semibold">
                                {g.name}
                              </span>
                              {g.retrograde && (
                                <span className="text-theme-fg-muted rounded border border-current px-1 text-[10px]">
                                  R
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 pr-4">
                            <span className="text-theme-fg-muted">{g.rashi.name}</span>
                          </td>
                          <td className="py-3 pr-4">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-theme-fg font-medium">
                                {RASHI_NAMES[d9Rashi]}
                              </span>
                              {d9Dignity && (
                                <span
                                  className={cn(
                                    "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                                    DIGNITY_STYLE[d9Dignity]
                                  )}
                                >
                                  {DIGNITY_LABEL[d9Dignity]}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 text-right">
                            <span className="text-theme-fg-muted font-mono text-xs">
                              {d9Deg.toFixed(2)}°
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-theme-fg-muted mt-4 text-xs">
                R = Retrograde · Mean Node voor Rahu/Ketu
              </p>
            </div>
          )}

          {/* Vimshottari Dasha */}
          <VimshottariDasha chart={chart} />

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
