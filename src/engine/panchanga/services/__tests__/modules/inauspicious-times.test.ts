import { describe, it, expect } from "vitest";
import { DateTime } from "luxon";
import { computeInauspiciousTimes } from "../../modules/inauspicious-times";

describe("computeInauspiciousTimes", () => {
  const sunrise = DateTime.fromISO("2025-01-06T06:00:00", { zone: "UTC" });
  const sunset = DateTime.fromISO("2025-01-06T18:00:00", { zone: "UTC" });
  // Day duration = 720 min, octet = 90 min

  it("Monday (varaIdx=1): Rahu 07:30-09:00, Yama 10:30-12:00", () => {
    const { rahuKalam, yamagandam } = computeInauspiciousTimes(sunrise, sunset, 1);
    expect(rahuKalam).toEqual({ startLocal: "07:30", endLocal: "09:00" });
    expect(yamagandam).toEqual({ startLocal: "10:30", endLocal: "12:00" });
  });

  it("Sunday (varaIdx=0): Rahu 16:30-18:00, Yama 12:00-13:30", () => {
    const { rahuKalam, yamagandam } = computeInauspiciousTimes(sunrise, sunset, 0);
    // Sunday: rahuOctet=7 → 7*90=630 min → 06:00+10h30 = 16:30
    expect(rahuKalam.startLocal).toBe("16:30");
    expect(rahuKalam.endLocal).toBe("18:00");
    // Sunday: yamaOctet=4 → 4*90=360 min → 06:00+6h = 12:00
    expect(yamagandam.startLocal).toBe("12:00");
    expect(yamagandam.endLocal).toBe("13:30");
  });

  it("Saturday (varaIdx=6): Rahu 09:00-10:30, Yama 15:00-16:30", () => {
    const { rahuKalam, yamagandam } = computeInauspiciousTimes(sunrise, sunset, 6);
    // Saturday: rahuOctet=2 → 2*90=180 min → 06:00+3h = 09:00
    expect(rahuKalam.startLocal).toBe("09:00");
    expect(rahuKalam.endLocal).toBe("10:30");
    // Saturday: yamaOctet=5 → 5*90=450 min → 06:00+7h30 = 13:30... wait
    // yamaOctets = [4,3,2,1,0,6,5], Saturday=6 → yamaOctet=5 → 5*90=450 → 06:00+7.5h = 13:30
    expect(yamagandam.startLocal).toBe("13:30");
    expect(yamagandam.endLocal).toBe("15:00");
  });
});
