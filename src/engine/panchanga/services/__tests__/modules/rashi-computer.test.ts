import { describe, it, expect, vi, beforeEach } from "vitest";

const { sweCalcUt, findEventEnd } = vi.hoisted(() => ({
  sweCalcUt: vi.fn(),
  findEventEnd: vi.fn(async (startJD: number): Promise<number | null> => startJD + 0.1),
}));

vi.mock("../../../utils/astro", () => ({
  swe_calc_ut: sweCalcUt,
  findEventEnd,
}));

vi.mock("swisseph", () => ({
  SE_SUN: 0,
  SE_MOON: 1,
  SEFLG_SWIEPH: 2,
  SEFLG_SIDEREAL: 64,
  swe_revjul: () => ({ year: 2025, month: 1, day: 1, hour: 0 }),
  SE_GREG_CAL: 1,
}));

import { getSunRashi, computeRashiTransitions } from "../../modules/rashi-computer";

describe("getSunRashi", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns rashi index 0-11 based on sidereal longitude", async () => {
    sweCalcUt.mockResolvedValue({ longitude: 45 }); // 45° → rashi 1 (Vrishabha)
    const result = await getSunRashi(100);
    expect(result).toBe(1);
  });

  it("returns rashi 0 for longitude 0-29°", async () => {
    sweCalcUt.mockResolvedValue({ longitude: 15 });
    expect(await getSunRashi(100)).toBe(0);
  });

  it("returns rashi 11 for longitude 330-359°", async () => {
    sweCalcUt.mockResolvedValue({ longitude: 340 });
    expect(await getSunRashi(100)).toBe(11);
  });

  it("returns null on swe_calc_ut error", async () => {
    sweCalcUt.mockRejectedValue(new Error("ephe error"));
    const result = await getSunRashi(100);
    expect(result).toBeNull();
  });
});

describe("computeRashiTransitions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls findEventEnd twice (sun sign + moon sign)", async () => {
    sweCalcUt.mockResolvedValue({ longitude: 45 });
    findEventEnd.mockResolvedValue(null);

    await computeRashiTransitions(100, 66, { longitude: 45 }, { longitude: 90 }, "UTC");
    expect(findEventEnd).toHaveBeenCalledTimes(2);
  });

  it("returns correct rashi names from indices", async () => {
    sweCalcUt.mockResolvedValue({ longitude: 45 });
    findEventEnd.mockResolvedValue(null);

    const result = await computeRashiTransitions(
      100,
      66,
      { longitude: 45 }, // sunSignIdx = 1 (Vrishabha)
      { longitude: 90 }, // moonSignIdx = 3 (Karka)
      "UTC"
    );
    expect(result.sunSignIdx).toBe(1);
    expect(result.moonSignIdx).toBe(3);
    expect(result.sunSignName).not.toBe("Unknown");
    expect(result.moonSignName).not.toBe("Unknown");
  });
});
