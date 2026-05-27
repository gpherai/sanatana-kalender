"use client";

import { useState, useSyncExternalStore } from "react";
import type { BirthChart } from "@/engine/panchanga/types";

export interface FormState {
  day: string;
  month: string;
  year: string;
  time: string;
  lat: string;
  lon: string;
  tz: string;
}

export type ResultView =
  | "d1-chart"
  | "d1-table"
  | "d9-chart"
  | "d9-table"
  | "d10-chart"
  | "d10-table";

const STORAGE_KEY = "kundali-form";

export const EMPTY_FORM: FormState = {
  day: "",
  month: "",
  year: "",
  time: "",
  lat: "",
  lon: "",
  tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
};

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

export function useKundaliForm() {
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

  const setField = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
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

  return {
    form,
    loading,
    error,
    chart,
    resultView,
    setResultView,
    hasSaved,
    setField,
    clearSaved,
    handleSubmit,
  };
}
