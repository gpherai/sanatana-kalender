/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import WeatherPage from "../page";

// Mock next/image
vi.mock("next/image", () => ({
  default: (props: any) => <img {...props} alt={props.alt || "weather icon"} />,
}));

// Mock components
vi.mock("@/components/layout", () => ({
  PageLayout: ({ children, loading }: any) => (
    <div data-testid="page-layout">{loading ? "Loading..." : children}</div>
  ),
}));

vi.mock("@/components/ui/MoonPhase", () => ({
  MoonPhase: () => <div data-testid="moon-phase" />,
}));

describe("WeatherPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  const mockWeatherData = {
    current: {
      dt: 1700000000,
      temp: 15.5,
      feels_like: 14.2,
      humidity: 60,
      pressure: 1012,
      uvi: 2.5,
      visibility: 10000,
      wind_speed: 5.5,
      wind_deg: 180,
      weather: [{ icon: "01d", description: "onbewolkt" }],
      sunrise: 1700000000,
      sunset: 1700040000,
    },
    hourly: Array(24)
      .fill(null)
      .map((_, i) => ({
        dt: 1700000000 + i * 3600,
        temp: 15 + i,
        weather: [{ icon: "01d", description: "clear" }],
        pop: 0.1,
      })),
    daily: Array(8)
      .fill(null)
      .map((_, i) => ({
        dt: 1700000000 + i * 86400,
        temp: { min: 10, max: 20 },
        weather: [{ icon: "01d", description: "clear" }],
        moon_phase: 0.5,
        summary: "Zonnig",
        pop: 0,
      })),
    aqi: {
      list: [{ main: { aqi: 1 }, components: { pm2_5: 5, pm10: 10, no2: 2, o3: 40 } }],
    },
    location: "Den Haag",
    alerts: [],
    timezone_offset: 3600,
  };

  it("renders correctly", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockWeatherData,
    } as any);

    render(<WeatherPage />);
    await screen.findByText("Den Haag");
    expect(screen.getAllByText(/16/)[0]).toBeInTheDocument();
  });

  it("handles error state", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false, status: 500 } as any);
    render(<WeatherPage />);
    await waitFor(() => {
      expect(screen.getByText(/Weerdata niet beschikbaar/i)).toBeInTheDocument();
    });
  });
});
