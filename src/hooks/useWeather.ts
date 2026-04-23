"use client";

import { useCallback, useEffect, useState } from "react";
import type { WeatherApiResponse } from "@/types/weather";

export function useWeather() {
  const [weather, setWeather] = useState<WeatherApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Selected location (null means use backend defaults)
  const [locationParams, setLocationParams] = useState<{
    lat: string;
    lon: string;
    name: string;
  } | null>(null);

  const fetchWeather = useCallback(
    async (isRefresh = false, signal?: AbortSignal) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
        setError(null);
      }

      try {
        let url = "/api/weer";
        if (locationParams) {
          const params = new URLSearchParams({
            lat: locationParams.lat,
            lon: locationParams.lon,
            name: locationParams.name,
          });
          url += `?${params.toString()}`;
        }

        const res = await fetch(url, { cache: "no-store", signal });
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
    },
    [locationParams]
  );

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetchWeather owns the loading/error state for this fetch cycle
    void fetchWeather(false, controller.signal);
    return () => controller.abort();
  }, [fetchWeather]);

  const refresh = useCallback(() => {
    void fetchWeather(true);
  }, [fetchWeather]);

  const retry = useCallback(() => {
    void fetchWeather();
  }, [fetchWeather]);

  const setLocation = useCallback((lat: number, lon: number, name: string) => {
    setLocationParams({ lat: String(lat), lon: String(lon), name });
  }, []);

  return {
    weather,
    loading,
    error,
    lastUpdated,
    refreshing,
    refresh,
    retry,
    setLocation,
  };
}
