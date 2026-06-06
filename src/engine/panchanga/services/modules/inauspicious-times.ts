import { DateTime } from "luxon";

// Octet positions per weekday (Sunday=0 .. Saturday=6)
// Each value is the 0-indexed octet number (0 = first 1/8 of day from sunrise)
const RAHU_OCTETS = [7, 1, 6, 4, 5, 3, 2];
const YAMA_OCTETS = [4, 3, 2, 1, 0, 6, 5];
// Gulika (Mandi): countdown from Saturday — Sat=0th, Fri=1st, ... Sun=6th
const GULI_OCTETS = [6, 5, 4, 3, 2, 1, 0];

export function computeInauspiciousTimes(
  sunriseTime: DateTime,
  sunsetTime: DateTime,
  varaIdx: number
) {
  const dayDurationMin = sunsetTime.diff(sunriseTime, "minutes").minutes;
  const octet = dayDurationMin / 8;
  const muhurta = dayDurationMin / 15;

  const rStartMin = RAHU_OCTETS[varaIdx]! * octet;
  const yStartMin = YAMA_OCTETS[varaIdx]! * octet;
  const gStartMin = GULI_OCTETS[varaIdx]! * octet;
  // Abhijit = 8th of 15 day-muhurtas (index 7, midday window)
  const abhijitStartMin = 7 * muhurta;
  const abhijitEndMin = 8 * muhurta;
  // Vijay = 11th of 15 day-muhurtas (index 10, afternoon window)
  const vijayStartMin = 10 * muhurta;
  const vijayEndMin = 11 * muhurta;

  const rahuStart = sunriseTime.plus({ minutes: rStartMin });
  const rahuEnd = sunriseTime.plus({ minutes: rStartMin + octet });
  const yamaStart = sunriseTime.plus({ minutes: yStartMin });
  const yamaEnd = sunriseTime.plus({ minutes: yStartMin + octet });
  const guliStart = sunriseTime.plus({ minutes: gStartMin });
  const guliEnd = sunriseTime.plus({ minutes: gStartMin + octet });
  // Wednesday (varaIdx=3): Abhijit overlaps Dur Muhurta → shastrically void
  const abhijitMuhurta =
    varaIdx !== 3
      ? {
          startLocal: sunriseTime.plus({ minutes: abhijitStartMin }).toFormat("HH:mm"),
          endLocal: sunriseTime.plus({ minutes: abhijitEndMin }).toFormat("HH:mm"),
        }
      : undefined;

  const vijayMuhurta = {
    startLocal: sunriseTime.plus({ minutes: vijayStartMin }).toFormat("HH:mm"),
    endLocal: sunriseTime.plus({ minutes: vijayEndMin }).toFormat("HH:mm"),
  };

  return {
    rahuKalam: {
      startLocal: rahuStart.toFormat("HH:mm"),
      endLocal: rahuEnd.toFormat("HH:mm"),
    },
    yamagandam: {
      startLocal: yamaStart.toFormat("HH:mm"),
      endLocal: yamaEnd.toFormat("HH:mm"),
    },
    gulikaKalam: {
      startLocal: guliStart.toFormat("HH:mm"),
      endLocal: guliEnd.toFormat("HH:mm"),
    },
    abhijitMuhurta,
    vijayMuhurta,
  };
}
