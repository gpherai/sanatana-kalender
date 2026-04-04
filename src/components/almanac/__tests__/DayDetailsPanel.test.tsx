/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DayDetailsPanel } from "../DayDetailsPanel";
import type { DailyInfoResponse } from "@/types";

// Mock dependencies
vi.mock("@/components/ui/MoonPhase", () => ({
  MoonPhase: () => <div data-testid="moon-phase">MoonPhase</div>,
}));

const MOCK_DATE = new Date("2025-01-01");

const MOCK_INFO = {
  date: "2025-01-01T00:00:00.000Z",
  locationName: "Den Haag",
  locationLat: 52.0705,
  locationLon: 4.3007,
  sunrise: "08:00",
  sunset: "16:00",
  moonrise: "20:00",
  moonset: "09:00",
  moonPhasePercent: 50,
  moonPhaseName: "First Quarter",
  moonPhaseType: "FIRST_QUARTER",
  moonPhaseEmoji: "🌓",
  isWaxing: true,
  maas: { name: "Margashirsha" },
  tithi: { number: 1, name: "Pratipada", paksha: "Shukla" as const, endTime: "12:00" },
  nakshatra: { number: 1, name: "Ashwini", pada: 1 as const, endTime: "14:00" },
  yoga: { number: 1, name: "Vishkumbha", endTime: "10:00" },
  karana: { number: 1, name: "Bava", type: "Movable", endTime: "11:00" },
  vara: { name: "Budhavara" },
  rahuKalam: { start: "12:00", end: "13:30" },
} as unknown as DailyInfoResponse;

const MOCK_EVENTS = [
  {
    id: "1",
    eventId: "evt_1",
    title: "Test Event",
    start: "2025-01-01",
    end: "2025-01-01",
    allDay: true,
    resource: {
      categories: [
        { id: "cat_1", name: "test", displayName: "Test", color: "red", icon: "🧪" },
      ],
      eventType: "OTHER",
      description: "Test description",
      tags: ["test"],
    },
  },
];

describe("DayDetailsPanel", () => {
  it("renders header info and covers Today badge", () => {
    const today = new Date();
    render(
      <DayDetailsPanel
        selectedDate={today}
        selectedDayInfo={{ ...MOCK_INFO, date: today.toISOString() }}
        selectedDayEvents={[]}
        selectedDaySpecial={[]}
        onEventClick={vi.fn()}
        showEvents={true}
        showSpecialDays={true}
      />
    );
    expect(screen.getByText(/Vandaag/i)).toBeDefined();
  });

  it("covers branch where Sanskrit day find returns undefined", () => {
    render(
      <DayDetailsPanel
        selectedDate={MOCK_DATE}
        selectedDayInfo={{ ...MOCK_INFO, vara: { name: "NonExistent" } }}
        selectedDayEvents={[]}
        selectedDaySpecial={[]}
        onEventClick={vi.fn()}
        showEvents={true}
        showSpecialDays={true}
      />
    );
    expect(screen.queryByText("Budhavara")).toBeNull();
  });

  it("renders sections correctly and handles event click", () => {
    const onEventClick = vi.fn();
    render(
      <DayDetailsPanel
        selectedDate={MOCK_DATE}
        selectedDayInfo={MOCK_INFO}
        selectedDayEvents={MOCK_EVENTS as any}
        selectedDaySpecial={[{ name: "Special Day", emoji: "✨", description: "Test" }]}
        onEventClick={onEventClick}
        showEvents={true}
        showSpecialDays={true}
      />
    );

    expect(screen.getByText(/Margashirsha/i)).toBeDefined();
    expect(screen.getByText(/Pratipada/i)).toBeDefined();
    expect(screen.getByText(/Bava/i)).toBeDefined();

    const eventCard = screen.getByText("Test Event");
    fireEvent.click(eventCard);
    expect(onEventClick).toHaveBeenCalledWith(MOCK_EVENTS[0]);
  });

  it("handles missing info and hidden sections", () => {
    render(
      <DayDetailsPanel
        selectedDate={MOCK_DATE}
        selectedDayInfo={null as any}
        selectedDayEvents={MOCK_EVENTS as any}
        selectedDaySpecial={[]}
        onEventClick={vi.fn()}
        showEvents={false}
        showSpecialDays={false}
      />
    );
    expect(screen.queryByText("Test Event")).toBeNull();
    expect(screen.queryByText(/Panchanga Details/i)).toBeNull();
  });
});
