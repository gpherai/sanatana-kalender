import { describe, it, expect } from "vitest";
import { DateTime } from "luxon";
import { computeInauspiciousTimes } from "../../modules/inauspicious-times";

// All tests use a 12-hour day (720 min): octet = 90 min, muhurta = 48 min
const sunrise = DateTime.fromISO("2025-01-06T06:00:00", { zone: "UTC" });
const sunset = DateTime.fromISO("2025-01-06T18:00:00", { zone: "UTC" });

describe("Rahu Kalam + Yamagandam (existing)", () => {
  it("Monday (varaIdx=1): Rahu 07:30-09:00, Yama 10:30-12:00", () => {
    const { rahuKalam, yamagandam } = computeInauspiciousTimes(sunrise, sunset, 1);
    expect(rahuKalam).toEqual({ startLocal: "07:30", endLocal: "09:00" });
    expect(yamagandam).toEqual({ startLocal: "10:30", endLocal: "12:00" });
  });

  it("Sunday (varaIdx=0): Rahu 16:30-18:00, Yama 12:00-13:30", () => {
    const { rahuKalam, yamagandam } = computeInauspiciousTimes(sunrise, sunset, 0);
    expect(rahuKalam.startLocal).toBe("16:30");
    expect(rahuKalam.endLocal).toBe("18:00");
    expect(yamagandam.startLocal).toBe("12:00");
    expect(yamagandam.endLocal).toBe("13:30");
  });

  it("Saturday (varaIdx=6): Rahu 09:00-10:30, Yama 13:30-15:00", () => {
    const { rahuKalam, yamagandam } = computeInauspiciousTimes(sunrise, sunset, 6);
    expect(rahuKalam.startLocal).toBe("09:00");
    expect(rahuKalam.endLocal).toBe("10:30");
    expect(yamagandam.startLocal).toBe("13:30");
    expect(yamagandam.endLocal).toBe("15:00");
  });
});

describe("Gulika Kalam", () => {
  // GULI_OCTETS = [6,5,4,3,2,1,0]: Sun=6th octet, Mon=5th, ..., Sat=0th
  // 12h day: octet=90min

  it("Saturday (varaIdx=6): Gulika 06:00-07:30 (octet 0)", () => {
    const { gulikaKalam } = computeInauspiciousTimes(sunrise, sunset, 6);
    // Sat: guliOctet=0 → 0*90=0 min → 06:00-07:30
    expect(gulikaKalam.startLocal).toBe("06:00");
    expect(gulikaKalam.endLocal).toBe("07:30");
  });

  it("Friday (varaIdx=5): Gulika 07:30-09:00 (octet 1)", () => {
    const { gulikaKalam } = computeInauspiciousTimes(sunrise, sunset, 5);
    // Fri: guliOctet=1 → 1*90=90 min → 07:30-09:00
    expect(gulikaKalam.startLocal).toBe("07:30");
    expect(gulikaKalam.endLocal).toBe("09:00");
  });

  it("Sunday (varaIdx=0): Gulika 15:00-16:30 (octet 6)", () => {
    const { gulikaKalam } = computeInauspiciousTimes(sunrise, sunset, 0);
    // Sun: guliOctet=6 → 6*90=540 min → 06:00+9h = 15:00-16:30
    expect(gulikaKalam.startLocal).toBe("15:00");
    expect(gulikaKalam.endLocal).toBe("16:30");
  });

  it("Wednesday (varaIdx=3): Gulika 12:00-13:30 (octet 3)", () => {
    const { gulikaKalam } = computeInauspiciousTimes(sunrise, sunset, 3);
    // Wed: guliOctet=3 → 3*90=270 min → 06:00+4.5h = 10:30-12:00
    expect(gulikaKalam.startLocal).toBe("10:30");
    expect(gulikaKalam.endLocal).toBe("12:00");
  });
});

describe("Abhijit Muhurta", () => {
  // 12h day: muhurta=48min, abhijit=7th index → start=7*48=336min, end=8*48=384min
  // 06:00 + 336min = 06:00 + 5h36 = 11:36
  // 06:00 + 384min = 06:00 + 6h24 = 12:24

  it("any weekday: Abhijit 11:36-12:24 (8th of 15 muhurtas)", () => {
    const { abhijitMuhurta } = computeInauspiciousTimes(sunrise, sunset, 1);
    expect(abhijitMuhurta.startLocal).toBe("11:36");
    expect(abhijitMuhurta.endLocal).toBe("12:24");
  });

  it("same time regardless of weekday", () => {
    const mon = computeInauspiciousTimes(sunrise, sunset, 1).abhijitMuhurta;
    const fri = computeInauspiciousTimes(sunrise, sunset, 5).abhijitMuhurta;
    expect(mon).toEqual(fri);
  });

  it("scales with day length (8h day: octet=60min, muhurta=32min)", () => {
    const shortSunset = DateTime.fromISO("2025-01-06T14:00:00", { zone: "UTC" });
    // 8h = 480 min, muhurta=32min, abhijit start=7*32=224min → 06:00+3h44=09:44
    const { abhijitMuhurta } = computeInauspiciousTimes(sunrise, shortSunset, 1);
    expect(abhijitMuhurta.startLocal).toBe("09:44");
    expect(abhijitMuhurta.endLocal).toBe("10:16");
  });
});
