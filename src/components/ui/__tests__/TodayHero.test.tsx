import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TodayHero, TodayHeroProps } from "../TodayHero";
import { DailyInfoResponse } from "@/types";

// Mock child components to simplify testing
vi.mock("./MoonPhase", () => ({
  MoonPhase: () => <div data-testid="moon-phase">MoonPhase Mock</div>,
}));

// Mock daily info response
const MOCK_DAILY_INFO = {
  date: "2025-01-01",
  locationName: "Den Haag",
  sunrise: "08:00",
  sunset: "16:00",
  moonrise: "20:00",
  moonset: "09:00",
  moonPhasePercent: 50,
  moonPhaseName: "Eerste Kwartier",
  isWaxing: true,
  maas: { name: "Margashirsha" },
  tithi: { name: "Pratipada", paksha: "Shukla", endTime: "12:00" },
  nakshatra: { name: "Ashwini", pada: 1 },
};

const MOCK_TODAY_EVENTS = [
  {
    id: "1",
    name: "New Year Puja",
    date: "2025-01-01",
    category: {
      id: "1",
      icon: "🐘",
      name: "Ganesha",
      color: "orange",
      displayName: "Ganesha",
      sortOrder: 1,
      description: null,
      colorDark: null,
    },
    eventType: "PUJA",
  },
];

describe("TodayHero Component", () => {
  it("renders daily info directly", () => {
    render(
      <TodayHero
        dailyInfo={MOCK_DAILY_INFO as unknown as DailyInfoResponse}
        todayEvents={[]}
        currentWeather={null}
      />
    );

    // Check header info
    expect(screen.getByText("Margashirsha Maas")).toBeInTheDocument();
    expect(screen.getByText(/Pratipada/)).toBeInTheDocument();

    // Check sun times
    expect(screen.getByText("08:00")).toBeInTheDocument();
    expect(screen.getByText("16:00")).toBeInTheDocument();
  });

  it("renders today events", () => {
    render(
      <TodayHero
        dailyInfo={MOCK_DAILY_INFO as unknown as DailyInfoResponse}
        todayEvents={MOCK_TODAY_EVENTS as unknown as TodayHeroProps["todayEvents"]}
        currentWeather={null}
      />
    );

    expect(screen.getByText("New Year Puja")).toBeInTheDocument();
    expect(screen.getByText("🐘")).toBeInTheDocument();
  });
});
