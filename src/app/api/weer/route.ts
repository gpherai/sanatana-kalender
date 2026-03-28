import { NextResponse } from "next/server";
import { serverError, errorResponse } from "@/lib/api-response";
import { DEFAULT_LOCATION } from "@/lib/domain";
import type { WeatherCondition, AirQuality } from "@/types/weather";

// =============================================================================
// CONFIG
// =============================================================================

const LAT = process.env.DEFAULT_LOCATION_LAT ?? String(DEFAULT_LOCATION.lat);
const LON = process.env.DEFAULT_LOCATION_LON ?? String(DEFAULT_LOCATION.lon);
const LOCATION_NAME = process.env.DEFAULT_LOCATION_NAME ?? DEFAULT_LOCATION.name;
const BASE = "https://api.openweathermap.org/data/2.5";

// =============================================================================
// TYPES — raw OpenWeatherMap response shapes (internal to this route)
// =============================================================================

// WeatherCondition is imported from @/types/weather — same structure in raw OWM responses

interface CurrentResponse {
  dt: number;
  weather: WeatherCondition[];
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
    sea_level?: number;
    grnd_level?: number;
  };
  visibility: number;
  wind: { speed: number; deg: number; gust?: number };
  clouds: { all: number };
  sys: { sunrise: number; sunset: number; country: string };
  timezone: number;
  name: string;
  rain?: { "1h"?: number };
  snow?: { "1h"?: number };
}

interface ForecastItem {
  dt: number;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  weather: WeatherCondition[];
  clouds: { all: number };
  wind: { speed: number; deg: number; gust?: number };
  visibility: number;
  pop: number;
  rain?: { "3h"?: number };
  snow?: { "3h"?: number };
  sys: { pod: string };
}

interface ForecastResponse {
  list: ForecastItem[];
}

interface AirPollutionResponse {
  list: Array<{
    dt: number;
    main: { aqi: number };
    components: {
      co: number;
      no: number;
      no2: number;
      o3: number;
      so2: number;
      pm2_5: number;
      pm10: number;
      nh3: number;
    };
  }>;
}

// =============================================================================
// MOON PHASE  (Meeus algorithm — matches OWM One Call 0–1 format)
// =============================================================================

function calculateMoonPhase(unixTs: number): number {
  const date = new Date(unixTs * 1000);
  let year = date.getUTCFullYear();
  let month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  if (month < 3) {
    year -= 1;
    month += 12;
  }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  const jd =
    Math.floor(365.25 * (year + 4716)) +
    Math.floor(30.6001 * (month + 1)) +
    day +
    B -
    1524.5;
  const KNOWN_NEW_MOON_JD = 2451550.1; // 2000-01-06
  const SYNODIC_MONTH = 29.53058867;
  const elapsed = jd - KNOWN_NEW_MOON_JD;
  return (((elapsed % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH) / SYNODIC_MONTH;
}

// =============================================================================
// MAPPERS
// =============================================================================

function mapCurrent(w: CurrentResponse) {
  const dew_point = w.main.temp - (100 - w.main.humidity) * 0.2;
  return {
    dt: w.dt,
    sunrise: w.sys.sunrise,
    sunset: w.sys.sunset,
    temp: w.main.temp,
    feels_like: w.main.feels_like,
    temp_min: w.main.temp_min,
    temp_max: w.main.temp_max,
    pressure: w.main.pressure,
    sea_level: w.main.sea_level ?? w.main.pressure,
    grnd_level: w.main.grnd_level ?? w.main.pressure,
    humidity: w.main.humidity,
    dew_point: Math.round(dew_point * 10) / 10,
    clouds: w.clouds.all,
    visibility: w.visibility,
    wind_speed: w.wind.speed,
    wind_deg: w.wind.deg,
    wind_gust: w.wind.gust,
    weather: w.weather,
    rain: w.rain?.["1h"] != null ? { "1h": w.rain["1h"] as number } : undefined,
    snow: w.snow?.["1h"] != null ? { "1h": w.snow["1h"] as number } : undefined,
    country: w.sys.country,
    city_name: w.name,
  };
}

function mapHourly(list: ForecastItem[]) {
  // Return all 40 slots (5 days × 8 per day)
  return list.map((item) => ({
    dt: item.dt,
    temp: item.main.temp,
    feels_like: item.main.feels_like,
    humidity: item.main.humidity,
    pressure: item.main.pressure,
    clouds: item.clouds.all,
    visibility: item.visibility,
    wind_speed: item.wind.speed,
    wind_deg: item.wind.deg,
    wind_gust: item.wind.gust,
    pop: item.pop,
    rain: item.rain?.["3h"],
    snow: item.snow?.["3h"],
    weather: item.weather,
    pod: item.sys.pod,
  }));
}

function mapDaily(list: ForecastItem[], tzOffset: number) {
  const byDay = new Map<string, ForecastItem[]>();

  for (const item of list) {
    const d = new Date((item.dt + tzOffset) * 1000);
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
    const group = byDay.get(key) ?? [];
    group.push(item);
    byDay.set(key, group);
  }

  return Array.from(byDay.values()).map((items) => {
    const first = items[0]!;
    const daytime = items.find((i) => i.sys.pod === "d") ?? first;
    const gustSpeeds = items.filter((i) => i.wind.gust != null).map((i) => i.wind.gust!);

    return {
      dt: first.dt,
      moon_phase: calculateMoonPhase(first.dt),
      temp: {
        min: Math.min(...items.map((i) => i.main.temp_min)),
        max: Math.max(...items.map((i) => i.main.temp_max)),
      },
      humidity_avg: Math.round(
        items.reduce((s, i) => s + i.main.humidity, 0) / items.length
      ),
      pressure_avg: Math.round(
        items.reduce((s, i) => s + i.main.pressure, 0) / items.length
      ),
      clouds_avg: Math.round(items.reduce((s, i) => s + i.clouds.all, 0) / items.length),
      wind_max: Math.max(...items.map((i) => i.wind.speed)),
      wind_gust_max: gustSpeeds.length > 0 ? Math.max(...gustSpeeds) : undefined,
      pop_max: Math.max(...items.map((i) => i.pop)),
      rain_total:
        Math.round(items.reduce((s, i) => s + (i.rain?.["3h"] ?? 0), 0) * 10) / 10,
      snow_total:
        Math.round(items.reduce((s, i) => s + (i.snow?.["3h"] ?? 0), 0) * 10) / 10,
      weather: daytime.weather,
    };
  });
}

function mapAirQuality(data: AirPollutionResponse): AirQuality | null {
  const item = data.list[0];
  if (!item) return null;
  return {
    aqi: item.main.aqi,
    components: item.components,
    dt: item.dt,
  };
}

// =============================================================================
// HANDLER
// =============================================================================

export async function GET() {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    return errorResponse(
      "OpenWeather API sleutel niet geconfigureerd (stel OPENWEATHER_API_KEY in)",
      503
    );
  }

  const params = `lat=${LAT}&lon=${LON}&units=metric&lang=nl&appid=${apiKey}`;
  const airParams = `lat=${LAT}&lon=${LON}&appid=${apiKey}`;
  const opts = { next: { revalidate: 600 } } as const;

  try {
    const [weatherRes, forecastRes, airRes] = await Promise.all([
      fetch(`${BASE}/weather?${params}`, opts),
      fetch(`${BASE}/forecast?${params}`, opts),
      fetch(`${BASE}/air_pollution?${airParams}`, opts),
    ]);

    if (!weatherRes.ok || !forecastRes.ok) {
      const failed = !weatherRes.ok ? weatherRes : forecastRes;
      if (failed.status === 401)
        return errorResponse("Ongeldige OpenWeather API sleutel", 503);
      return serverError(`OpenWeather fout: ${failed.status}`);
    }

    const weather = (await weatherRes.json()) as CurrentResponse;
    const forecast = (await forecastRes.json()) as ForecastResponse;
    const tzOffset = weather.timezone;

    const air_quality = airRes.ok
      ? mapAirQuality((await airRes.json()) as AirPollutionResponse)
      : null;

    return NextResponse.json({
      location: LOCATION_NAME,
      country: weather.sys.country,
      timezone_offset: tzOffset,
      current: mapCurrent(weather),
      hourly: mapHourly(forecast.list),
      daily: mapDaily(forecast.list, tzOffset),
      alerts: [],
      air_quality,
    });
  } catch {
    return serverError("Kon weerdata niet ophalen");
  }
}
