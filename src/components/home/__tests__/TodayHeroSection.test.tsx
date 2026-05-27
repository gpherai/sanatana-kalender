/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DateTime } from "luxon";
import { TodayHeroSection } from "../TodayHeroSection";

vi.mock("@/components/ui/TodayHero", () => ({
  TodayHero: ({ todayEvents }: { todayEvents: Array<{ id: string; name: string }> }) => (
    <section data-testid="today-hero">
      {todayEvents.map((e) => (
        <span key={e.id}>Vandaag: {e.name}</span>
      ))}
    </section>
  ),
}));

vi.mock("@/lib/api-transformers", () => ({
  transformToApiResponse: vi.fn().mockReturnValue({}),
}));

const today = DateTime.fromISO("2026-04-25", { zone: "Europe/Amsterdam" });
const baseEvent = {
  id: "evt_1",
  name: "Test Event",
  eventType: "VRAT",
  categories: [],
};

function makeOccurrence(
  id: string,
  date: string,
  endDate: string | null = null,
  name = baseEvent.name
) {
  return {
    id,
    date: new Date(date),
    endDate: endDate ? new Date(endDate) : null,
    event: { ...baseEvent, id: `evt_${id}`, name },
  };
}

describe("TodayHeroSection", () => {
  it("shows events that start today", async () => {
    const ui = await TodayHeroSection({
      panchangaPromise: Promise.resolve({} as any),
      eventsPromise: Promise.resolve([
        makeOccurrence("1", "2026-04-25T00:00:00.000Z"),
      ] as any),
      weatherPromise: Promise.resolve(null),
      today,
    });
    render(ui);
    expect(screen.getByText("Vandaag: Test Event")).toBeInTheDocument();
  });

  it("shows ongoing multi-day events overlapping today", async () => {
    const ui = await TodayHeroSection({
      panchangaPromise: Promise.resolve({} as any),
      eventsPromise: Promise.resolve([
        makeOccurrence(
          "1",
          "2026-04-24T00:00:00.000Z",
          "2026-04-26T00:00:00.000Z",
          "Doorlopende Vrat"
        ),
      ] as any),
      weatherPromise: Promise.resolve(null),
      today,
    });
    render(ui);
    expect(screen.getByText("Vandaag: Doorlopende Vrat")).toBeInTheDocument();
  });

  it("excludes future events", async () => {
    const ui = await TodayHeroSection({
      panchangaPromise: Promise.resolve({} as any),
      eventsPromise: Promise.resolve([
        makeOccurrence("1", "2026-04-26T00:00:00.000Z"),
      ] as any),
      weatherPromise: Promise.resolve(null),
      today,
    });
    render(ui);
    expect(screen.queryByText(/Vandaag:/)).not.toBeInTheDocument();
  });

  it("renders without crash when weather promise resolves null", async () => {
    const ui = await TodayHeroSection({
      panchangaPromise: Promise.resolve({} as any),
      eventsPromise: Promise.resolve([] as any),
      weatherPromise: Promise.resolve(null),
      today,
    });
    render(ui);
    expect(screen.getByTestId("today-hero")).toBeInTheDocument();
  });
});
