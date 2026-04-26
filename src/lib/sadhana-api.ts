"use client";

import type { DayInfoMap } from "@/components/sadhana/types";
import { localDateString } from "@/lib/sadhana-utils";

// =============================================================================
// API BASE
// =============================================================================

export const API = "/api/sadhana";

export async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...opts?.headers },
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// =============================================================================
// PANCHANGA FETCH
// =============================================================================

type DayInfoRaw = {
  date: string;
  tithi?: { name: string; paksha: "Shukla" | "Krishna" };
  specialDay?: { name: string; emoji: string; type: string } | null;
  moonPhaseEvent?: { type: "new" | "first_quarter" | "full" | "last_quarter" } | null;
};

export async function fetchDayInfoMap(start: string, end: string): Promise<DayInfoMap> {
  const startDate = new Date(start + "T00:00:00");
  const endDate = new Date(end + "T00:00:00");

  // Build all chunk ranges up-front, then fetch all in parallel
  const chunks: Array<{ s: string; e: string }> = [];
  let current = new Date(startDate);
  while (current <= endDate) {
    const chunkEnd = new Date(current);
    chunkEnd.setDate(chunkEnd.getDate() + 85); // Safety margin (API limit is 90)
    const actualEnd = chunkEnd > endDate ? endDate : chunkEnd;
    chunks.push({ s: localDateString(current), e: localDateString(actualEnd) });
    current = new Date(actualEnd);
    current.setDate(current.getDate() + 1);
  }

  const results = await Promise.all(
    chunks.map(async ({ s, e }) => {
      try {
        const res = await fetch(`/api/daily-info?start=${s}&end=${e}`);
        if (!res.ok) return [] as DayInfoRaw[];
        return (await res.json()) as DayInfoRaw[];
      } catch (err) {
        console.error("Chunk fetch failed:", s, e, err);
        return [] as DayInfoRaw[];
      }
    })
  );

  const map: DayInfoMap = new Map();
  for (const arr of results) {
    for (const d of arr) {
      map.set(d.date.slice(0, 10), {
        tithi: d.tithi,
        specialDay: d.specialDay,
        moonPhaseEvent: d.moonPhaseEvent,
      });
    }
  }
  return map;
}
