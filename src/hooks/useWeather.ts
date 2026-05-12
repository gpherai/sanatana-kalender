"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { WeatherApiResponse } from "@/types/weather";

export function useWeather() {
  const [weather, setWeather] = useState<WeatherApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const manualCtrlRef = useRef<AbortController | null>(null);

  const fetchWeather = useCallback(async (isRefresh = false, signal?: AbortSignal) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
      setError(null);
    }

    try {
      const res = await fetch("/api/weer", { cache: "no-store", signal });
      if (signal?.aborted) return;

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        setError(body.message ?? "Kon weerdata niet ophalen");
        return;
      }

      setWeather((await res.json()) as WeatherApiResponse);
      setLastUpdated(new Date());
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError("Verbindingsfout bij het ophalen van weerdata");
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetchWeather owns the loading/error state for this fetch cycle
    void fetchWeather(false, controller.signal);
    return () => controller.abort();
  }, [fetchWeather]);

  // Abort any in-flight manual fetch on unmount
  useEffect(() => {
    return () => {
      manualCtrlRef.current?.abort();
    };
  }, []);

  const refresh = useCallback(() => {
    manualCtrlRef.current?.abort();
    const ctrl = new AbortController();
    manualCtrlRef.current = ctrl;
    void fetchWeather(true, ctrl.signal);
  }, [fetchWeather]);

  const retry = useCallback(() => {
    manualCtrlRef.current?.abort();
    const ctrl = new AbortController();
    manualCtrlRef.current = ctrl;
    void fetchWeather(false, ctrl.signal);
  }, [fetchWeather]);

  return {
    weather,
    loading,
    error,
    lastUpdated,
    refreshing,
    refresh,
    retry,
  };
}
