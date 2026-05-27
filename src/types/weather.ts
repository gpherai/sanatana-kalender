/**
 * Weather API Types
 *
 * Shared types for the /api/weer endpoint.
 * These represent the *mapped output* of the route (not the raw OpenWeatherMap
 * response shapes, which are internal implementation details of the route).
 *
 * Consumer: src/components/weather/*
 * Producer: src/services/weather.service.ts via src/app/api/weer/route.ts
 */

export interface WeatherCondition {
  id: number;
  main: string;
  description: string;
  icon: string;
}

export interface CurrentWeather {
  coord: { lat: number; lon: number };
  dt: number;
  sunrise: number;
  sunset: number;
  temp: number;
  feels_like: number;
  /** Today's minimum temperature from the current-weather endpoint */
  temp_min: number;
  /** Today's maximum temperature from the current-weather endpoint */
  temp_max: number;
  /** Atmospheric pressure at sea level (hPa) */
  pressure: number;
  sea_level: number;
  grnd_level: number;
  humidity: number;
  /** Dew point approximated via Magnus formula (°C) */
  dew_point: number;
  clouds: number;
  /** Visibility in metres (max 10 000 = 10 km) */
  visibility: number;
  wind_speed: number;
  wind_deg: number;
  wind_gust?: number;
  weather: WeatherCondition[];
  rain?: { "1h": number };
  snow?: { "1h": number };
  country: string;
  city_name: string;
}

/** One 3-hour forecast slot from the /data/2.5/forecast endpoint */
export interface HourlyWeather {
  dt: number;
  temp: number;
  feels_like: number;
  humidity: number;
  pressure: number;
  clouds: number;
  visibility: number;
  wind_speed: number;
  wind_deg: number;
  wind_gust?: number;
  /** Probability of precipitation (0–1) */
  pop: number;
  /** Precipitation amount over the 3-hour window (mm) */
  rain?: number;
  snow?: number;
  weather: WeatherCondition[];
  /** "d" = daytime, "n" = night-time */
  pod: string;
}

/** One calendar day, aggregated from the 3-hour forecast slots */
export interface DailyWeather {
  dt: number;
  /** Moon phase (0 = new moon … 0.5 = full moon … 1 = new moon) */
  moon_phase: number;
  temp: { min: number; max: number };
  humidity_avg: number;
  pressure_avg: number;
  clouds_avg: number;
  wind_max: number;
  wind_gust_max?: number;
  /** Highest precipitation probability among the day's slots (0–1) */
  pop_max: number;
  /** Total rain accumulated across all 3-hour slots (mm) */
  rain_total: number;
  snow_total: number;
  weather: WeatherCondition[];
}

export interface WeatherAlert {
  sender_name: string;
  event: string;
  title?: string;
  /** Unix timestamp */
  start: number;
  end: number;
  description: string;
  severity?: string;
  certainty?: string;
  urgency?: string;
  tags?: string[];
  regions?: string[];
}

export interface AirQualityComponents {
  /** Carbon monoxide (μg/m³) */
  co: number;
  /** Nitrogen monoxide (μg/m³) */
  no: number;
  /** Nitrogen dioxide (μg/m³) */
  no2: number;
  /** Ozone (μg/m³) */
  o3: number;
  /** Sulphur dioxide (μg/m³) */
  so2: number;
  /** Fine particles < 2.5 μm (μg/m³) */
  pm2_5: number;
  /** Coarse particles < 10 μm (μg/m³) */
  pm10: number;
  /** Ammonia (μg/m³) */
  nh3: number;
}

export interface AirQuality {
  /** 1 = Good · 2 = Fair · 3 = Moderate · 4 = Poor · 5 = Very Poor */
  aqi: number;
  components: AirQualityComponents;
  dt: number;
}

export interface WeatherApiResponse {
  location: string;
  country: string;
  /** Timezone offset from UTC in seconds (e.g. 3600 = UTC+1) */
  timezone_offset: number;
  current: CurrentWeather;
  /** All 40 forecast slots (5 days × 8 per day, 3-hour intervals) */
  hourly: HourlyWeather[];
  daily: DailyWeather[];
  alerts: WeatherAlert[];
  /** Air quality from OWM Air Pollution API — null if unavailable */
  air_quality: AirQuality | null;
}
