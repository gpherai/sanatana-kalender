import { DateTime } from "luxon";

// Rahu Kalam and Yamagandam octet positions per weekday (Sunday=0 .. Saturday=6)
const RAHU_OCTETS = [7, 1, 6, 4, 5, 3, 2];
const YAMA_OCTETS = [4, 3, 2, 1, 0, 6, 5];

export function computeInauspiciousTimes(
  sunriseTime: DateTime,
  sunsetTime: DateTime,
  varaIdx: number
) {
  const dayDurationMin = sunsetTime.diff(sunriseTime, "minutes").minutes;
  const octet = dayDurationMin / 8;

  const rStartMin = RAHU_OCTETS[varaIdx]! * octet;
  const yStartMin = YAMA_OCTETS[varaIdx]! * octet;

  const rahuStart = sunriseTime.plus({ minutes: rStartMin });
  const rahuEnd = sunriseTime.plus({ minutes: rStartMin + octet });
  const yamaStart = sunriseTime.plus({ minutes: yStartMin });
  const yamaEnd = sunriseTime.plus({ minutes: yStartMin + octet });

  return {
    rahuKalam: {
      startLocal: rahuStart.toFormat("HH:mm"),
      endLocal: rahuEnd.toFormat("HH:mm"),
    },
    yamagandam: {
      startLocal: yamaStart.toFormat("HH:mm"),
      endLocal: yamaEnd.toFormat("HH:mm"),
    },
  };
}
