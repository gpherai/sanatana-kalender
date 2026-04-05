/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import WeatherPage from "../page";

// Mock next/image
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
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

describe("WeatherPage 100% Coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  const generateMockData = (overrides: any = {}) => {
    const defaultAQI = {
      aqi: 1,
      components: { pm2_5: 5, pm10: 10, no2: 2, o3: 40, so2: 1, co: 1, nh3: 1, no: 1 },
      dt: 1700000000,
    };

    const tz = 3600;
    const now = Math.floor(Date.now() / 1000);

    return {
      current: {
        dt: now,
        temp: 15.5,
        feels_like: 14.2,
        humidity: 60,
        pressure: 1012,
        uvi: 2.5,
        visibility: 10000,
        wind_speed: 5.5,
        wind_deg: 180,
        weather: [{ icon: "01d", description: "onbewolkt" }],
        sunrise: now - 3600,
        sunset: now + 3600,
        dew_point: 10,
        sea_level: 1012,
        grnd_level: 1000,
        ...(overrides.current || {}),
      },
      air_quality: overrides.air_quality || defaultAQI,
      hourly: Array(40)
        .fill(null)
        .map((_, i) => ({
          dt: now + i * 3600,
          temp: 15 + i,
          weather: [{ icon: "01d", description: "clear" }],
          pop: 0.1,
          feels_like: 14,
          humidity: 50,
          clouds: 10,
          wind_speed: 5,
          wind_deg: 180,
          visibility: 10000,
          pressure: 1012,
        })),
      daily: Array(8)
        .fill(null)
        .map((_, i) => ({
          dt: now + i * 86400,
          temp: { min: 10, max: 20 },
          weather: [{ icon: "01d", description: "clear" }],
          moon_phase: i * 0.125,
          summary: "Summary",
          pop: 0.2,
          wind_speed: 5,
          wind_gust: 8,
          sunrise: now - 3600,
          sunset: now + 3600,
          moonrise: now,
          moonset: now + 4000,
          rain_total: 0,
          snow_total: 0,
        })),
      location: "Den Haag",
      country: "NL",
      alerts: overrides.alerts || [],
      timezone_offset: tz,
    };
  };

  it("covers alerts, refresh and retry", async () => {
    const fetchMock = vi.mocked(fetch);
    // Failure first
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "FAIL" }),
    } as any);

    render(<WeatherPage />);
    expect(await screen.findByText(/FAIL/i)).toBeInTheDocument();

    // Retry (line 364)
    const alertData = generateMockData({
      alerts: [
        {
          event: "Storm",
          description: "Test",
          sender_name: "KNMI",
          start: 1700000000,
          end: 1700040000,
        },
      ],
    });
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => alertData } as any);
    fireEvent.click(screen.getByText(/Opnieuw proberen/i));

    await screen.findAllByText(/Den Haag/i);
    expect(screen.getByText("Storm")).toBeInTheDocument();

    // Refresh
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => alertData } as any);
    fireEvent.click(screen.getByLabelText("Vernieuwen"));
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("covers wind directions and AQI descriptions", async () => {
    const testData = generateMockData({
      current: { wind_deg: 45 },
      air_quality: {
        aqi: 5,
        components: generateMockData().air_quality.components,
        dt: 1700000000,
      },
    });
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => testData,
    } as any);
    render(<WeatherPage />);
    await screen.findAllByText(/Den Haag/i);
    expect(
      (await screen.findAllByText(/Ernstige gezondheidsrisico's/i)).length
    ).toBeGreaterThan(0);
  });
});
