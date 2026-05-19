"use client";

import { useState, useSyncExternalStore } from "react";
import { PageLayout } from "@/components/layout";
import { Star, TriangleAlert, Grid2x2, Table2, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BirthChart } from "@/engine/panchanga/types";
import { KundaliChart, RASHI_NAMES } from "@/components/kundali/KundaliChart";
import { NavamshaChart, navamshaRashi } from "@/components/kundali/NavamshaChart";
import { VimshottariDasha } from "@/components/kundali/VimshottariDasha";
import { GrahaAspects } from "@/components/kundali/GrahaAspects";
import { DashamshaChart, dashamshaRashi } from "@/components/kundali/DashamshaChart";
import {
  FormField,
  Input,
  GrahaRow,
  NavamshaTableRow,
  DashamshaTableRow,
  GRAHA_ORDER,
} from "@/components/kundali/kundali-ui";

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

const STORAGE_KEY = "kundali-form";

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

function isValidTimeZone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

function apiErrorMessage(data: unknown): string {
  if (!data || typeof data !== "object") return "Onbekende fout";

  const payload = data as {
    error?: unknown;
    message?: unknown;
    details?: unknown;
  };

  if (Array.isArray(payload.details)) {
    const firstDetail = payload.details.find(
      (detail): detail is { message: string } =>
        !!detail &&
        typeof detail === "object" &&
        "message" in detail &&
        typeof detail.message === "string"
    );
    if (firstDetail) return firstDetail.message;
  }

  if (typeof payload.message === "string") return payload.message;
  if (typeof payload.error === "string") return payload.error;
  return "Onbekende fout";
}

// =============================================================================
// LOCAL STORAGE SYNC
// =============================================================================

let cachedRaw: string | null = null;
let cachedParsed: FormState | null = null;

function getSnapshot() {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedParsed = raw ? JSON.parse(raw) : null;
    } catch {
      cachedParsed = null;
    }
  }
  return cachedParsed;
}

function getServerSnapshot() {
  return null;
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

// =============================================================================
// MAIN PAGE
// =============================================================================

type ResultView =
  | "d1-chart"
  | "d1-table"
  | "d9-chart"
  | "d9-table"
  | "d10-chart"
  | "d10-table";

export default function KundaliPage() {
  const savedForm = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [prevSaved, setPrevSaved] = useState<FormState | null>(null);

  // Sync external store to local state during render (avoids cascading useEffects)
  if (savedForm !== prevSaved) {
    setPrevSaved(savedForm);
    if (savedForm) setForm(savedForm);
  }

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chart, setChart] = useState<BirthChart | null>(null);
  const [resultView, setResultView] = useState<ResultView>("d1-chart");
  const hasSaved = savedForm !== null;

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  function clearSaved() {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event("storage"));
    setForm(EMPTY_FORM);
  }

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
    const tz = form.tz.trim();

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      setError("Breedtegraad en lengtegraad moeten getallen zijn.");
      setLoading(false);
      return;
    }
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      setError(
        "Breedtegraad moet tussen -90 en 90 zijn; lengtegraad tussen -180 en 180."
      );
      setLoading(false);
      return;
    }
    if (!tz || !isValidTimeZone(tz)) {
      setError(
        "Tijdzone moet een geldige IANA naam zijn, bijvoorbeeld Europe/Amsterdam."
      );
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
        body: JSON.stringify({ date: dateStr, time: form.time, lat, lon, tz }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(apiErrorMessage(data));
      } else {
        setChart(data as BirthChart);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
        window.dispatchEvent(new Event("storage"));
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
            <div className="flex gap-2" role="group" aria-label="Geboortedatum">
              <Input
                type="number"
                inputMode="numeric"
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
                inputMode="numeric"
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
                inputMode="numeric"
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
              onChange={set("time")}
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
              onChange={set("lat")}
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
              onChange={set("lon")}
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
              onChange={set("tz")}
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
                onClick={clearSaved}
                className="text-theme-primary focus-visible:ring-theme-primary cursor-pointer rounded hover:underline focus-visible:ring-2 focus-visible:outline-none"
              >
                Wissen
              </button>
            </p>
          )}
        </div>
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
                    Chandra Rashi
                  </p>
                  <p className="text-theme-fg mt-0.5 text-lg font-bold">
                    {chart.grahas.chandra.rashi.name}
                  </p>
                  <p className="text-theme-fg-muted text-xs">
                    {chart.grahas.chandra.degreeInRashi.toFixed(2)}°
                  </p>
                </div>
                <div>
                  <p className="text-theme-fg-muted text-xs font-semibold tracking-wide uppercase">
                    Janma Nakshatra
                  </p>
                  <p className="text-theme-fg mt-0.5 font-semibold">
                    {chart.grahas.chandra.nakshatra.name}
                  </p>
                  <p className="text-theme-fg-muted text-xs">
                    pada {chart.grahas.chandra.nakshatra.pada}
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
                {(resultView === "d9-chart" || resultView === "d9-table") && (
                  <div>
                    <p className="text-theme-fg-muted text-xs font-semibold tracking-wide uppercase">
                      D9 Lagna
                    </p>
                    <p className="text-theme-fg mt-0.5 text-lg font-bold">
                      {RASHI_NAMES[navamshaRashi(chart.lagna.longitude)]}
                    </p>
                    <p className="text-theme-fg-muted text-xs">Navamsha</p>
                  </div>
                )}
                {(resultView === "d10-chart" || resultView === "d10-table") && (
                  <div>
                    <p className="text-theme-fg-muted text-xs font-semibold tracking-wide uppercase">
                      D10 Lagna
                    </p>
                    <p className="text-theme-fg mt-0.5 text-lg font-bold">
                      {RASHI_NAMES[dashamshaRashi(chart.lagna.longitude)]}
                    </p>
                    <p className="text-theme-fg-muted text-xs">Dashamsha</p>
                  </div>
                )}
              </div>

              {/* View toggle */}
              <div className="bg-theme-surface border-theme-border flex items-center gap-1 rounded-lg border p-1">
                <button
                  onClick={() => setResultView("d1-chart")}
                  style={{ touchAction: "manipulation" }}
                  title="D1 Grafiek"
                  aria-label="D1 Grafiek"
                  className={cn(
                    "focus-visible:ring-theme-primary flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none",
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
                  aria-label="D1 Tabel"
                  className={cn(
                    "focus-visible:ring-theme-primary flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none",
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
                  aria-label="D9 Grafiek"
                  className={cn(
                    "focus-visible:ring-theme-primary flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none",
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
                  aria-label="D9 Tabel"
                  className={cn(
                    "focus-visible:ring-theme-primary flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none",
                    resultView === "d9-table"
                      ? "bg-theme-primary-15 text-theme-primary"
                      : "text-theme-fg-muted hover:text-theme-fg"
                  )}
                >
                  <Table2 className="h-3.5 w-3.5" />
                </button>
                <div className="bg-theme-border mx-0.5 h-4 w-px shrink-0" />
                <button
                  onClick={() => setResultView("d10-chart")}
                  style={{ touchAction: "manipulation" }}
                  title="D10 Grafiek"
                  aria-label="D10 Grafiek"
                  className={cn(
                    "focus-visible:ring-theme-primary flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none",
                    resultView === "d10-chart"
                      ? "bg-theme-primary-15 text-theme-primary"
                      : "text-theme-fg-muted hover:text-theme-fg"
                  )}
                >
                  <Layers className="h-3.5 w-3.5" />
                  D10
                </button>
                <button
                  onClick={() => setResultView("d10-table")}
                  style={{ touchAction: "manipulation" }}
                  title="D10 Tabel"
                  aria-label="D10 Tabel"
                  className={cn(
                    "focus-visible:ring-theme-primary flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none",
                    resultView === "d10-table"
                      ? "bg-theme-primary-15 text-theme-primary"
                      : "text-theme-fg-muted hover:text-theme-fg"
                  )}
                >
                  <Table2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Janma Panchanga */}
          <div className="bg-theme-surface-raised rounded-xl px-6 py-4 shadow">
            <p className="text-theme-fg-muted mb-3 text-xs font-semibold tracking-wide uppercase">
              Janma Panchanga
            </p>
            <div className="flex flex-wrap gap-x-8 gap-y-3">
              <div>
                <p className="text-theme-fg-muted text-xs">Vara</p>
                <p className="text-theme-fg mt-0.5 font-semibold">
                  {chart.janmaPanchanga.vara.name}
                </p>
              </div>
              <div>
                <p className="text-theme-fg-muted text-xs">Tithi</p>
                <p className="text-theme-fg mt-0.5 font-semibold">
                  {chart.janmaPanchanga.tithi.name}
                </p>
                <p className="text-theme-fg-muted text-xs">
                  {chart.janmaPanchanga.tithi.paksha} · #
                  {chart.janmaPanchanga.tithi.number}
                </p>
              </div>
              <div>
                <p className="text-theme-fg-muted text-xs">Nakshatra</p>
                <p className="text-theme-fg mt-0.5 font-semibold">
                  {chart.janmaPanchanga.nakshatra.name}
                </p>
                <p className="text-theme-fg-muted text-xs">
                  pada {chart.janmaPanchanga.nakshatra.pada}
                </p>
              </div>
              <div>
                <p className="text-theme-fg-muted text-xs">Yoga</p>
                <p className="text-theme-fg mt-0.5 font-semibold">
                  {chart.janmaPanchanga.yoga.name}
                </p>
                <p className="text-theme-fg-muted text-xs">
                  #{chart.janmaPanchanga.yoga.number}
                </p>
              </div>
              <div>
                <p className="text-theme-fg-muted text-xs">Karana</p>
                <p className="text-theme-fg mt-0.5 font-semibold">
                  {chart.janmaPanchanga.karana.name}
                </p>
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
                <span className="text-theme-accent">Uchcha</span> = verheven ·{" "}
                <span className="text-theme-error">Neecha</span> = verzwakt ·{" "}
                <span className="text-theme-primary">Mūlatrik.</span> = moolatrikona ·{" "}
                <span className="text-theme-success">Swarashi</span> = eigen teken
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
                    {GRAHA_ORDER.map((key) => (
                      <NavamshaTableRow key={key} grahaKey={key} chart={chart} />
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-theme-fg-muted mt-4 text-xs">
                R = Retrograde · Mean Node voor Rahu/Ketu
              </p>
            </div>
          )}

          {/* D10 chart */}
          {resultView === "d10-chart" && (
            <div className="mx-auto w-full max-w-2xl">
              <DashamshaChart chart={chart} />
            </div>
          )}

          {/* D10 table */}
          {resultView === "d10-table" && (
            <div className="bg-theme-surface-raised rounded-xl p-6 shadow">
              <h2 className="text-theme-fg mb-4 text-base font-semibold">
                Navagrahas — D10 Dashamsha
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
                        D10 Rashi
                      </th>
                      <th className="text-theme-fg-muted pb-2 text-right text-xs font-semibold tracking-wide uppercase">
                        D10 Graad
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {GRAHA_ORDER.map((key) => (
                      <DashamshaTableRow key={key} grahaKey={key} chart={chart} />
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-theme-fg-muted mt-4 text-xs">
                R = Retrograde · Mean Node voor Rahu/Ketu
              </p>
            </div>
          )}

          {/* Graha Aspecten */}
          <GrahaAspects chart={chart} />

          {/* Vimshottari Dasha */}
          <VimshottariDasha chart={chart} />

          {/* Technical metadata */}
          <details className="text-theme-fg-muted text-xs">
            <summary className="focus-visible:ring-theme-primary cursor-pointer rounded focus-visible:ring-2 focus-visible:outline-none">
              Technische details
            </summary>
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
