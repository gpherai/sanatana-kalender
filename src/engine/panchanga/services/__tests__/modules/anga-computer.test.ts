import { describe, it, expect, vi } from "vitest";

const { sweCalcUt, findEventEnd } = vi.hoisted(() => ({
  sweCalcUt: vi.fn(),
  findEventEnd: vi.fn(
    async (startJD: number, getVal: ((jd: number) => Promise<number>) | null) => {
      if (getVal) await getVal(startJD);
      return startJD + 0.1;
    }
  ),
}));

vi.mock("../../../utils/astro", () => ({
  swe_calc_ut: sweCalcUt,
  findEventEnd,
}));

vi.mock("swisseph", () => ({
  SE_SUN: 0,
  SE_MOON: 1,
  swe_revjul: () => ({ year: 2025, month: 1, day: 1, hour: 0 }),
  SE_GREG_CAL: 1,
}));

import {
  computeAngaIndices,
  computeAngaEndTimes,
  computePositionsAtSunrise,
} from "../../modules/anga-computer";

describe("computePositionsAtSunrise", () => {
  it("calls swe_calc_ut for sun and moon", async () => {
    sweCalcUt
      .mockResolvedValueOnce({ longitude: 20 })
      .mockResolvedValueOnce({ longitude: 140 });

    const { sunPos, moonPos } = await computePositionsAtSunrise(100, 66);
    expect(sunPos.longitude).toBe(20);
    expect(moonPos.longitude).toBe(140);
    expect(sweCalcUt).toHaveBeenCalledWith(100, 0, 66); // SE_SUN
    expect(sweCalcUt).toHaveBeenCalledWith(100, 1, 66); // SE_MOON
  });
});

describe("computeAngaIndices", () => {
  it("computes correct indices for Shukla paksha (sun=20, moon=140)", () => {
    const sunPos = { longitude: 20 };
    const moonPos = { longitude: 140 };
    // elongation = (140-20+360)%360 = 120, tithiProg = 120/12 = 10 → tithiIdx=11
    // nakProg = 140/(360/27) = 10.5 → nakIdx=11
    // yogaProg = (160)/(360/27) = 12 → yogaIdx=13
    // karanaProg = 20 → karanaIdx=21
    const result = computeAngaIndices(sunPos, moonPos);
    expect(result.tithiIdx).toBe(11);
    expect(result.nakIdx).toBe(11);
    expect(result.yogaIdx).toBe(13);
    expect(result.karanaIdx).toBe(21);
  });

  it("computes Krishna paksha for tithi > 15", () => {
    // elongation > 180 → tithiIdx > 15
    const sunPos = { longitude: 0 };
    const moonPos = { longitude: 216 }; // elongation = 216, tithiProg = 18 → tithiIdx=19
    const result = computeAngaIndices(sunPos, moonPos);
    expect(result.tithiIdx).toBe(19);
  });

  it("returns tithiIdx=1 at new moon (elongation ~0)", () => {
    const sunPos = { longitude: 50 };
    const moonPos = { longitude: 50 };
    const result = computeAngaIndices(sunPos, moonPos);
    expect(result.tithiIdx).toBe(1);
  });
});

describe("computeAngaEndTimes", () => {
  it("calls findEventEnd 4 times (tithi, nak, yoga, karana)", async () => {
    sweCalcUt.mockResolvedValue({ longitude: 20 });
    findEventEnd.mockResolvedValue(100.5);

    const indices = { tithiIdx: 11, nakIdx: 11, yogaIdx: 13, karanaIdx: 21 };
    const result = await computeAngaEndTimes(100, 66, indices);

    expect(findEventEnd).toHaveBeenCalledTimes(4);
    expect(result.tithiEndJD).toBe(100.5);
    expect(result.nakEndJD).toBe(100.5);
    expect(result.yogaEndJD).toBe(100.5);
    expect(result.karanaEndJD).toBe(100.5);
  });

  it("returns null end times when findEventEnd returns null", async () => {
    findEventEnd.mockResolvedValue(null);
    const indices = { tithiIdx: 1, nakIdx: 1, yogaIdx: 1, karanaIdx: 1 };
    const result = await computeAngaEndTimes(100, 66, indices);
    expect(result.tithiEndJD).toBeNull();
  });
});
