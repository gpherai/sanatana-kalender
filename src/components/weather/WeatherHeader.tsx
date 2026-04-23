"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin, RefreshCw, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import type { LocationSearchResult } from "@/types/weather";

interface WeatherHeaderProps {
  location: string;
  country: string;
  lastUpdated: Date | null;
  refreshing: boolean;
  onRefresh: () => void;
  onLocationSelect: (lat: number, lon: number, name: string) => void;
}

export function WeatherHeader({
  location,
  country,
  lastUpdated,
  refreshing,
  onRefresh,
  onLocationSelect,
}: WeatherHeaderProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 500);
  const [results, setResults] = useState<LocationSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearching(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const trimmedQuery = debouncedQuery.trim();

    if (trimmedQuery.length < 2) {
      return;
    }

    let cancelled = false;

    async function search() {
      setLoading(true);
      try {
        const res = await fetch(`/api/weer/search?q=${encodeURIComponent(trimmedQuery)}`);
        if (!cancelled && res.ok) {
          setResults((await res.json()) as LocationSearchResult[]);
        } else if (!cancelled) {
          setResults([]);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Geocoding fout", err);
          setResults([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void search();

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const canShowResults = debouncedQuery.trim().length >= 2;
  const visibleResults = canShowResults ? results : [];
  const visibleLoading = canShowResults && loading;

  const handleSelect = (lat: number, lon: number, name: string) => {
    onLocationSelect(lat, lon, name);
    setIsSearching(false);
    setQuery("");
  };

  return (
    <div className="relative flex items-center justify-between" ref={searchRef}>
      {!isSearching ? (
        <button
          onClick={() => setIsSearching(true)}
          className="hover:bg-theme-hover group -ml-2 flex cursor-pointer flex-wrap items-center gap-x-2 gap-y-0.5 rounded-xl px-2 py-1 transition-colors"
          aria-label="Locatie zoeken"
        >
          <MapPin className="text-theme-primary h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
          <span className="text-theme-fg font-semibold">{location}</span>
          <span className="text-theme-fg-muted text-sm">{country}</span>
          {lastUpdated && (
            <span className="text-theme-fg-muted hidden text-xs sm:inline">
              · bijgewerkt{" "}
              {lastUpdated.toLocaleTimeString("nl-NL", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </button>
      ) : (
        <div className="relative max-w-sm flex-1">
          <div className="relative flex items-center">
            <Search className="text-theme-fg-muted absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Zoek een stad..."
              className="bg-theme-bg-muted/50 border-theme-border text-theme-fg placeholder:text-theme-fg-muted focus:ring-theme-primary w-full rounded-xl border py-2 pr-10 pl-9 shadow-sm backdrop-blur-sm transition-all focus:border-transparent focus:ring-2 focus:outline-none"
            />
            <button
              onClick={() => setIsSearching(false)}
              className="text-theme-fg-muted hover:text-theme-fg hover:bg-theme-hover absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer rounded-lg p-1 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {/* Results Dropdown */}
          {(visibleResults.length > 0 || visibleLoading) && (
            <div className="bg-theme-bg/95 border-theme-border absolute top-full right-0 left-0 z-50 mt-2 overflow-hidden rounded-xl border shadow-lg backdrop-blur-md">
              {visibleLoading ? (
                <div className="text-theme-fg-muted flex items-center gap-2 px-4 py-3 text-sm">
                  <RefreshCw className="h-3 w-3 animate-spin" /> Zoeken...
                </div>
              ) : (
                <ul className="max-h-60 overflow-y-auto">
                  {visibleResults.map((result, i) => (
                    <li key={`${result.lat}-${result.lon}-${i}`}>
                      <button
                        onClick={() => handleSelect(result.lat, result.lon, result.name)}
                        className="hover:bg-theme-hover focus:bg-theme-hover flex w-full cursor-pointer flex-col px-4 py-3 text-left transition-colors"
                      >
                        <span className="text-theme-fg font-medium">
                          {result.name} {result.state ? `, ${result.state}` : ""}
                        </span>
                        <span className="text-theme-fg-muted text-xs">
                          {result.country}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {!isSearching && (
        <button
          onClick={onRefresh}
          disabled={refreshing}
          aria-label="Vernieuwen"
          className="text-theme-fg-muted hover:text-theme-fg hover:bg-theme-hover flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-xl transition-colors disabled:opacity-40"
        >
          <RefreshCw
            className={cn(
              "h-4 w-4",
              refreshing && "animate-spin motion-reduce:animate-none"
            )}
          />
        </button>
      )}
    </div>
  );
}
