import { describe, expect, it } from "vitest";
import { fmtDayShort, prepareWeatherDashboardData } from "../weather";
import type { DailyWeather, HourlyWeather, WeatherApiResponse } from "@/types/weather";

const condition = { id: 800, main: "Clear", description: "onbewolkt", icon: "01d" };

function daily(dt: number, min: number, max: number): DailyWeather {
  return {
    dt,
    moon_phase: 0.25,
    temp: { min, max },
    humidity_avg: 50,
    pressure_avg: 1013,
    clouds_avg: 10,
    wind_max: 4,
    pop_max: 0.1,
    rain_total: 0,
    snow_total: 0,
    weather: [condition],
  };
}

function hourly(dt: number): HourlyWeather {
  return {
    dt,
    temp: 15,
    feels_like: 14,
    humidity: 50,
    pressure: 1013,
    clouds: 10,
    visibility: 10000,
    wind_speed: 4,
    wind_deg: 180,
    pop: 0.1,
    weather: [condition],
    pod: "d",
  };
}

function weatherResponse(partial: Partial<WeatherApiResponse>): WeatherApiResponse {
  return {
    location: "Den Haag",
    country: "NL",
    timezone_offset: 0,
    current: {
      coord: { lat: 52.0705, lon: 4.3007 },
      dt: 0,
      sunrise: 0,
      sunset: 0,
      temp: 15,
      feels_like: 14,
      temp_min: 12,
      temp_max: 18,
      pressure: 1013,
      sea_level: 1013,
      grnd_level: 1013,
      humidity: 50,
      dew_point: 5,
      clouds: 10,
      visibility: 10000,
      wind_speed: 4,
      wind_deg: 180,
      weather: [condition],
      country: "NL",
      city_name: "Den Haag",
    },
    hourly: [],
    daily: [],
    alerts: [],
    air_quality: null,
    ...partial,
  };
}

describe("weather view helpers", () => {
  it("compares full local day keys instead of day-of-month only", () => {
    const now = Date.UTC(2026, 0, 1, 12) / 1000;
    const sameDayNumberNextMonth = Date.UTC(2026, 1, 1, 12) / 1000;

    expect(fmtDayShort(sameDayNumberNextMonth, 0, now)).not.toBe("Vandaag");
  });

  it("selects today's daily forecast by local day key", () => {
    const now = Date.UTC(2026, 4, 27, 12) / 1000;
    const today = daily(Date.UTC(2026, 4, 27, 9) / 1000, 11, 19);
    const tomorrow = daily(Date.UTC(2026, 4, 28, 9) / 1000, 12, 20);

    const data = prepareWeatherDashboardData(
      weatherResponse({
        daily: [tomorrow, today],
        hourly: [hourly(Date.UTC(2026, 4, 27, 15) / 1000)],
      }),
      now
    );

    expect(data.today).toBe(today);
  });

  it("keeps tomorrow midnight out of today's interpolated hourly row", () => {
    const now = Date.UTC(2026, 4, 27, 12) / 1000;
    const nextMidnight = Date.UTC(2026, 4, 28, 0) / 1000;

    const data = prepareWeatherDashboardData(
      weatherResponse({
        daily: [daily(Date.UTC(2026, 4, 27, 9) / 1000, 11, 19)],
        hourly: [hourly(Date.UTC(2026, 4, 27, 21) / 1000), hourly(nextMidnight)],
      }),
      now
    );

    expect(data.todayHourlyInterp.some((item) => item.dt === nextMidnight)).toBe(false);
  });
});
