/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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

  const generateMockData = (overrides = {}) => ({
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
      dew_point: 10,
      sea_level: 1012,
      grnd_level: 1000,
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
        moon_phase: i * 0.125,
        summary: "Summary",
        pop: 0.2,
        wind_speed: 10,
        wind_gust: 15,
      })),
    aqi: {
      list: [{ main: { aqi: 1 }, components: { pm2_5: 5, pm10: 10, no2: 2, o3: 40 } }],
    },
    location: "Den Haag",
    alerts: [],
    timezone_offset: 3600,
    ...overrides,
  });

  it("covers various wind directions, AQIs and alerts", async () => {
    const directions = [0, 45, 90, 135, 180, 225, 270, 315];
    const aqis = [1, 2, 3, 4, 5];

    // Test a combination that covers most
    for (let i = 0; i < directions.length; i++) {
      const data = generateMockData({
        current: { ...generateMockData().current, wind_deg: directions[i] },
        aqi: {
          list: [
            {
              main: { aqi: aqis[i] || 1 },
              components: { pm2_5: 10, pm10: 20, no2: 20, o3: 50 },
            },
          ],
        },
        alerts:
          i === 0
            ? [
                {
                  event: "Storm",
                  description: "Test",
                  sender_name: "KNMI",
                  start: 1700000000,
                  end: 1700040000,
                },
              ]
            : [],
      });

      vi.mocked(fetch).mockResolvedValueOnce({ ok: true, json: async () => data } as any);
      const { unmount } = render(<WeatherPage />);
      await screen.findByText("Den Haag");
      unmount();
    }
  });

  it("covers extreme daily conditions", async () => {
    // Daily wind > 12 triggers different icon/logic
    const data = generateMockData({
      daily: generateMockData().daily.map((d) => ({
        ...d,
        wind_speed: 15,
        wind_gust: 20,
        pop: 0.9,
        weather: [{ icon: "13d", description: "snow" }],
      })),
    });
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => data } as any);
    render(<WeatherPage />);
    await screen.findByText("Den Haag");
  });
});
