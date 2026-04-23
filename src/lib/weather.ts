import type { HourlyWeather, WeatherApiResponse } from "@/types/weather";

export type HourlyItem =
  | { kind: "sep"; label: string; key: string }
  | { kind: "slot"; h: HourlyWeather };

export function owmIcon(icon: string, size: 2 | 4 = 2) {
  return `https://openweathermap.org/img/wn/${icon}@${size}x.png`;
}

export function roundWeather(n: number) {
  return Math.round(n);
}

export function kmh(ms: number) {
  return roundWeather(ms * 3.6);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function windDir(deg: number): string {
  const dirs = [
    "N",
    "NNO",
    "NO",
    "ONO",
    "O",
    "OZO",
    "ZO",
    "ZZO",
    "Z",
    "ZZW",
    "ZW",
    "WZW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ];
  return dirs[roundWeather(deg / 22.5) % 16] ?? "N";
}

/** Convert OWM moon_phase (0-1) to MoonPhase component props */
export function owmPhase(phase: number) {
  return {
    percent: Math.round(((1 - Math.cos(phase * 2 * Math.PI)) / 2) * 100),
    isWaxing: phase < 0.5,
  };
}

export function moonName(phase: number): string {
  if (phase < 0.03 || phase > 0.97) return "Nieuwe maan";
  if (phase < 0.22) return "Wassende sikkel";
  if (phase < 0.28) return "Eerste kwartier";
  if (phase < 0.47) return "Wassende maan";
  if (phase < 0.53) return "Volle maan";
  if (phase < 0.72) return "Afnemende maan";
  if (phase < 0.78) return "Laatste kwartier";
  return "Afnemende sikkel";
}

export function toLocal(unix: number, tz: number) {
  return new Date((unix + tz) * 1000);
}

export function fmtTime(unix: number, tz: number) {
  const d = toLocal(unix, tz);
  return `${d.getUTCHours().toString().padStart(2, "0")}:${d.getUTCMinutes().toString().padStart(2, "0")}`;
}

export function fmtHour(unix: number, tz: number) {
  return `${toLocal(unix, tz).getUTCHours().toString().padStart(2, "0")}:00`;
}

export function fmtDayLabel(unix: number, tz: number, nowUnix: number): string {
  const d = toLocal(unix, tz);
  const now = toLocal(nowUnix, tz);
  if (d.getUTCDate() === now.getUTCDate()) return "Vandaag";
  const tom = new Date(now);
  tom.setUTCDate(now.getUTCDate() + 1);
  if (d.getUTCDate() === tom.getUTCDate()) return "Morgen";
  return d.toLocaleDateString("nl-NL", { weekday: "long", timeZone: "UTC" });
}

export function fmtDayShort(unix: number, tz: number, nowUnix: number): string {
  const d = toLocal(unix, tz);
  const now = toLocal(nowUnix, tz);
  if (d.getUTCDate() === now.getUTCDate()) return "Vandaag";
  const tom = new Date(now);
  tom.setUTCDate(now.getUTCDate() + 1);
  if (d.getUTCDate() === tom.getUTCDate()) return "Morgen";
  return d.toLocaleDateString("nl-NL", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export function dayLength(sunrise: number, sunset: number) {
  const s = sunset - sunrise;
  return `${Math.floor(s / 3600)}u ${Math.floor((s % 3600) / 60)}m`;
}

export function dayKey(unix: number, tz: number) {
  const d = toLocal(unix, tz);
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
}

export function localDayStartUnix(unix: number, tz: number) {
  const d = toLocal(unix, tz);
  const localMidnightUtcSeconds =
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / 1000;
  return localMidnightUtcSeconds - tz;
}

const AQI_LABELS = ["Goed", "Redelijk", "Matig", "Slecht", "Zeer slecht"] as const;
const AQI_DESCS = [
  "Luchtkwaliteit is uitstekend. Geen beperkingen.",
  "Acceptabele luchtkwaliteit. Gevoelige personen kunnen lichte hinder ervaren.",
  "Gevoelige groepen (astma, hart/longen) kunnen last krijgen. Beperk langdurige inspanning buiten.",
  "Gezondheidseffecten mogelijk voor iedereen. Vermijd langdurige inspanning buiten.",
  "Ernstige gezondheidsrisico's. Blijf zoveel mogelijk binnen.",
] as const;

export function aqiLabel(aqi: number) {
  return AQI_LABELS[aqi - 1] ?? "Onbekend";
}

export function aqiDesc(aqi: number) {
  return AQI_DESCS[aqi - 1] ?? "";
}

export function aqiBadgeClass(aqi: number) {
  return (
    [
      "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300",
      "bg-lime-100 text-lime-800 dark:bg-lime-950/60 dark:text-lime-300",
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300",
      "bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300",
      "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300",
    ][aqi - 1] ?? "bg-theme-bg-subtle text-theme-fg-muted"
  );
}

export function aqiDotClass(aqi: number) {
  return (
    ["bg-green-500", "bg-lime-500", "bg-yellow-500", "bg-orange-500", "bg-red-500"][
      aqi - 1
    ] ?? "bg-theme-border-strong"
  );
}

/** Linear interpolation between 3-hour OWM slots -> approximate 1-hour resolution */
export function interpolateHourly(slots: HourlyWeather[]): HourlyWeather[] {
  if (slots.length < 2) return slots;
  const result: HourlyWeather[] = [];
  for (let i = 0; i < slots.length - 1; i++) {
    const a = slots[i]!;
    const b = slots[i + 1]!;
    for (let h = 0; h < 3; h++) {
      const t = h / 3;
      result.push({
        dt: a.dt + h * 3600,
        temp: lerp(a.temp, b.temp, t),
        feels_like: lerp(a.feels_like, b.feels_like, t),
        humidity: Math.round(lerp(a.humidity, b.humidity, t)),
        pressure: Math.round(lerp(a.pressure, b.pressure, t)),
        clouds: Math.round(lerp(a.clouds, b.clouds, t)),
        visibility: Math.round(lerp(a.visibility, b.visibility, t)),
        wind_speed: lerp(a.wind_speed, b.wind_speed, t),
        wind_deg: h < 2 ? a.wind_deg : b.wind_deg,
        wind_gust:
          a.wind_gust != null
            ? lerp(a.wind_gust, b.wind_gust ?? a.wind_gust, t)
            : undefined,
        pop: a.pop,
        rain: a.rain != null ? a.rain / 3 : undefined,
        snow: a.snow != null ? a.snow / 3 : undefined,
        weather: a.weather,
        pod: h < 2 ? a.pod : b.pod,
      });
    }
  }
  result.push(slots[slots.length - 1]!);
  return result;
}

export function buildHourlyItems(
  hourly: HourlyWeather[],
  tz: number,
  nowUnix: number
): HourlyItem[] {
  const items: HourlyItem[] = [];
  let lastKey = "";
  for (const h of hourly) {
    const k = dayKey(h.dt, tz);
    if (k !== lastKey) {
      items.push({ kind: "sep", label: fmtDayShort(h.dt, tz, nowUnix), key: k });
      lastKey = k;
    }
    items.push({ kind: "slot", h });
  }
  return items;
}

export function prepareWeatherDashboardData(
  weather: WeatherApiResponse,
  nowUnix: number
) {
  const tz = weather.timezone_offset;
  const nowKey = dayKey(nowUnix, tz);
  const todayHourly = weather.hourly.filter((h) => dayKey(h.dt, tz) === nowKey);
  const futureHourly = weather.hourly.filter((h) => dayKey(h.dt, tz) !== nowKey);
  const futureItems = buildHourlyItems(futureHourly, tz, nowUnix);
  const firstFutureSlot = futureHourly[0];
  const interpolationSource = firstFutureSlot
    ? [...todayHourly, firstFutureSlot]
    : todayHourly;
  const nextMidnightUnix = localDayStartUnix(nowUnix, tz) + 86400;
  const todayHourlyInterp = interpolateHourly(interpolationSource).filter(
    (h) => h.dt <= nextMidnightUnix
  );

  const tempMins = weather.daily.map((d) => d.temp.min);
  const tempMaxes = weather.daily.map((d) => d.temp.max);
  const allMin = tempMins.length > 0 ? Math.min(...tempMins) : 0;
  const allMax = tempMaxes.length > 0 ? Math.max(...tempMaxes) : 1;

  return {
    today: weather.daily[0],
    todayHourlyInterp,
    futureItems,
    allMin,
    tempRange: allMax - allMin || 1,
  };
}
