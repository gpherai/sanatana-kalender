import { describe, it, expect, beforeEach, vi } from "vitest";
import { DEFAULT_LOCATION } from "@/lib/domain";

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("GET /api/weer", () => {
  const originalEnv = { ...process.env };

  async function getResponse() {
    const { GET } = await import("../weer/route");
    return GET();
  }

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      DATABASE_URL:
        originalEnv.DATABASE_URL ?? "postgresql://user:pass@localhost:5432/test",
      OPENWEATHER_API_KEY: "test-key",
    };
    global.fetch = mockFetch;
  });

  const mockWeather = {
    dt: 1649073600,
    weather: [{ id: 800, main: "Clear", description: "onbewolkt", icon: "01d" }],
    main: {
      temp: 15,
      feels_like: 14,
      temp_min: 12,
      temp_max: 18,
      pressure: 1013,
      humidity: 50,
      sea_level: 1013,
      grnd_level: 1010,
    },
    visibility: 10000,
    wind: { speed: 5, deg: 200, gust: 8 },
    clouds: { all: 0 },
    sys: { sunrise: 1649050000, sunset: 1649100000, country: "NL" },
    timezone: 3600,
    name: "Den Haag",
    rain: { "1h": 0.5 },
  };

  const mockForecast = {
    list: [
      {
        dt: 1649073600,
        main: {
          temp: 15,
          feels_like: 14,
          temp_min: 12,
          temp_max: 18,
          pressure: 1013,
          humidity: 50,
        },
        weather: [{ id: 800, main: "Clear", description: "onbewolkt", icon: "01d" }],
        clouds: { all: 0 },
        wind: { speed: 5, deg: 200, gust: 8 },
        visibility: 10000,
        pop: 0.1,
        sys: { pod: "d" },
      },
      {
        dt: 1649103600,
        main: {
          temp: 10,
          feels_like: 9,
          temp_min: 8,
          temp_max: 12,
          pressure: 1015,
          humidity: 60,
        },
        weather: [{ id: 801, main: "Clouds", description: "licht bewolkt", icon: "02n" }],
        clouds: { all: 20 },
        wind: { speed: 4, deg: 210 },
        visibility: 10000,
        pop: 0.2,
        sys: { pod: "n" },
      },
    ],
  };

  const mockAirPollution = {
    list: [
      {
        dt: 1649073600,
        main: { aqi: 1 },
        components: {
          co: 200,
          no: 0.1,
          no2: 5,
          o3: 50,
          so2: 1,
          pm2_5: 5,
          pm10: 10,
          nh3: 1,
        },
      },
    ],
  };

  const mockAlerts = {
    items: [
      {
        date: "2022-04-04T12:00:00+00:00",
        date_epoch: 1649073600,
        alerts: [
          {
            source: "KNMI",
            title: "Code geel voor windstoten",
            industry: [
              { description: "Kans op zware windstoten.", severity: "moderate" },
            ],
            certainty: "likely",
            urgency: "expected",
            tag: "Wind",
          },
        ],
      },
    ],
  };

  function jsonResponse(body: unknown) {
    return { ok: true, status: 200, json: () => Promise.resolve(body) };
  }

  function statusResponse(status: number) {
    return { ok: false, status, json: () => Promise.resolve({}) };
  }

  function mockSuccessfulWeatherFetch({
    weather = mockWeather,
    forecast = mockForecast,
    air = mockAirPollution,
    alerts = { items: [] },
  }: {
    weather?: unknown;
    forecast?: unknown;
    air?: unknown;
    alerts?: unknown;
  } = {}) {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("/weather?")) return Promise.resolve(jsonResponse(weather));
      if (url.includes("/forecast?")) return Promise.resolve(jsonResponse(forecast));
      if (url.includes("/air_pollution?")) return Promise.resolve(jsonResponse(air));
      if (url.includes("/alerts/1.0?")) return Promise.resolve(jsonResponse(alerts));
      return Promise.reject(new Error("Unknown URL"));
    });
  }

  it("returns 503 if API key is missing", async () => {
    delete process.env.OPENWEATHER_API_KEY;
    const response = await getResponse();
    const json = await response.json();
    expect(response.status).toBe(503);
    expect(json.message).toContain("niet geconfigureerd");
  });

  it("returns weather data when API calls are successful", async () => {
    mockSuccessfulWeatherFetch({ alerts: mockAlerts });

    const response = await getResponse();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.location).toBeDefined();
    expect(json.current.temp).toBe(15);
    expect(json.hourly).toHaveLength(2);
    expect(json.daily).toHaveLength(1);
    expect(json.air_quality.aqi).toBe(1);
    expect(json.alerts).toHaveLength(1);
    expect(json.alerts[0]).toMatchObject({
      sender_name: "KNMI",
      event: "Code geel voor windstoten",
      title: "Code geel voor windstoten",
      description: "Kans op zware windstoten.",
      severity: "moderate",
      tags: ["Wind"],
    });
    expect(json.daily[0].moon_phase).toBeDefined();
  });

  it("uses DEFAULT_LOCATION for weather requests", async () => {
    mockSuccessfulWeatherFetch();

    const response = await getResponse();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.location).toBe(DEFAULT_LOCATION.name);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(`lat=${DEFAULT_LOCATION.lat}`),
      expect.any(Object)
    );
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(`lon=${DEFAULT_LOCATION.lon}`),
      expect.any(Object)
    );
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(
        encodeURIComponent(
          JSON.stringify({
            type: "Point",
            coordinates: [DEFAULT_LOCATION.lon, DEFAULT_LOCATION.lat],
          })
        )
      ),
      expect.any(Object)
    );
  });

  it("returns 503 for invalid API key (401)", async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("/weather?")) return Promise.resolve(statusResponse(401));
      if (url.includes("/forecast?")) return Promise.resolve(jsonResponse(mockForecast));
      return Promise.reject(new Error("Unexpected optional call"));
    });
    const response = await getResponse();
    const json = await response.json();
    expect(response.status).toBe(503);
    expect(json.message).toContain("Ongeldige");
  });

  it("returns 500 for other OpenWeather errors", async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("/weather?")) return Promise.resolve(statusResponse(500));
      if (url.includes("/forecast?")) return Promise.resolve(jsonResponse(mockForecast));
      return Promise.reject(new Error("Unexpected optional call"));
    });
    const response = await getResponse();
    const json = await response.json();
    expect(response.status).toBe(500);
    expect(json.message).toContain("OpenWeather fout");
  });

  it("returns 500 on fetch rejection", async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("/weather?")) return Promise.reject(new Error("Network error"));
      if (url.includes("/forecast?")) return Promise.resolve(jsonResponse(mockForecast));
      return Promise.reject(new Error("Unexpected optional call"));
    });
    const response = await getResponse();
    const json = await response.json();
    expect(response.status).toBe(500);
    expect(json.message).toContain("Kon weerdata niet ophalen");
  });

  it("handles missing air quality data gracefully", async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("/weather?")) return Promise.resolve(jsonResponse(mockWeather));
      if (url.includes("/forecast?")) return Promise.resolve(jsonResponse(mockForecast));
      if (url.includes("/air_pollution?")) return Promise.resolve(statusResponse(404));
      if (url.includes("/alerts/1.0?"))
        return Promise.resolve(jsonResponse({ items: [] }));
      return Promise.reject(new Error("Unknown URL"));
    });

    const response = await getResponse();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.air_quality).toBeNull();
  });

  it("keeps weather available when optional air quality fetch rejects", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("/weather?")) return Promise.resolve(jsonResponse(mockWeather));
      if (url.includes("/forecast?")) return Promise.resolve(jsonResponse(mockForecast));
      if (url.includes("/air_pollution?"))
        return Promise.reject(new Error("Air unavailable"));
      if (url.includes("/alerts/1.0?"))
        return Promise.resolve(jsonResponse({ items: [] }));
      return Promise.reject(new Error("Unknown URL"));
    });

    try {
      const response = await getResponse();
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.air_quality).toBeNull();
    } finally {
      consoleError.mockRestore();
    }
  });

  it("keeps weather available when OpenWeather Alerts access is unavailable", async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("/weather?")) return Promise.resolve(jsonResponse(mockWeather));
      if (url.includes("/forecast?")) return Promise.resolve(jsonResponse(mockForecast));
      if (url.includes("/air_pollution?"))
        return Promise.resolve(jsonResponse(mockAirPollution));
      if (url.includes("/alerts/1.0?")) return Promise.resolve(statusResponse(401));
      return Promise.reject(new Error("Unknown URL"));
    });

    const response = await getResponse();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.alerts).toEqual([]);
  });

  it("correctly calculates dew point and handles optional fields", async () => {
    const weatherNoRain = { ...mockWeather, rain: undefined, snow: { "1h": 0.1 } };
    mockSuccessfulWeatherFetch({ weather: weatherNoRain });

    const response = await getResponse();
    const json = await response.json();

    expect(json.current.rain).toBeUndefined();
    expect(json.current.snow).toEqual({ "1h": 0.1 });
    expect(json.current.dew_point).toBe(5); // 15 - (100-50)*0.2 = 15 - 10 = 5
  });

  it("covers moon phase calculation for early months (Jan/Feb)", async () => {
    const febTs = 1643716800; // Feb 1, 2022
    const febWeather = { ...mockWeather, dt: febTs };
    const febForecast = {
      list: [
        { ...mockForecast.list[0], dt: febTs, sys: { pod: "d" } },
        { ...mockForecast.list[1], dt: febTs + 10800, sys: { pod: "n" } },
      ],
    };

    mockSuccessfulWeatherFetch({ weather: febWeather, forecast: febForecast });

    const response = await getResponse();
    const json = await response.json();
    expect(json.daily[0].moon_phase).toBeDefined();
  });

  it("covers more fallbacks and branches", async () => {
    const weatherMinimal = {
      ...mockWeather,
      main: { ...mockWeather.main, sea_level: undefined, grnd_level: undefined },
      wind: { ...mockWeather.wind, gust: undefined },
      rain: undefined,
      snow: undefined,
    };
    const forecastMinimal = {
      list: [
        {
          ...mockForecast.list[0]!,
          sys: { pod: "n" }, // No daytime entry
          wind: { ...mockForecast.list[0]!.wind, gust: undefined },
        },
      ],
    };

    mockSuccessfulWeatherFetch({ weather: weatherMinimal, forecast: forecastMinimal });

    const response = await getResponse();
    const json = await response.json();
    expect(json.current.sea_level).toBe(json.current.pressure);
    expect(json.current.grnd_level).toBe(json.current.pressure);
    expect(json.daily[0].wind_gust_max).toBeUndefined();
  });

  it("handles empty air pollution list", async () => {
    mockSuccessfulWeatherFetch({ air: { list: [] } });

    const response = await getResponse();
    const json = await response.json();
    expect(json.air_quality).toBeNull();
  });
});
