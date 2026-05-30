import { DateTime } from "luxon";
import * as swisseph from "swisseph";

export function norm360(x: number): number {
  return ((x % 360) + 360) % 360;
}

export function getTithiProgress(sunLongitude: number, moonLongitude: number): number {
  const elongation = (moonLongitude - sunLongitude + 360) % 360;
  return elongation / 12;
}

export function jdToLocal(jd: number, tz: string): DateTime {
  const dateUTC = swisseph.swe_revjul(jd, swisseph.SE_GREG_CAL as 0 | 1);
  const h = Math.floor(dateUTC.hour);
  const remainder = (dateUTC.hour - h) * 60;
  const m = Math.floor(remainder);
  const s = Math.floor((remainder - m) * 60);
  return DateTime.utc(dateUTC.year, dateUTC.month, dateUTC.day, h, m, s).setZone(tz);
}

export function formatTime(dt: DateTime | null): string | undefined {
  return dt ? dt.toFormat("HH:mm:ss") : undefined;
}

export function formatIso(dt: DateTime | null): string | undefined {
  return dt ? (dt.toUTC().toISO() ?? undefined) : undefined;
}
