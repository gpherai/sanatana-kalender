import { describe, it, expect, vi, beforeEach } from "vitest";

const { sweCalcUt, findEventEnd } = vi.hoisted(() => ({
  sweCalcUt: vi.fn(),
  findEventEnd: vi.fn(),
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

// Mock getSunRashi from rashi-computer so maas-detector tests are isolated
const { getSunRashiMock } = vi.hoisted(() => ({
  getSunRashiMock: vi.fn(),
}));
vi.mock("../../modules/rashi-computer", () => ({
  getSunRashi: getSunRashiMock,
}));

import { findNearestAmavasya, computeMaasData } from "../../modules/maas-detector";

describe("findNearestAmavasya", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null if no Amavasya is found near the date", async () => {
    // getTithiProgress returns 15 (Full Moon) → tithiAtDay=16, not near Amavasya
    sweCalcUt.mockResolvedValue({ longitude: 0 }); // sun and moon same → tithiProg=0 → tithiIdx=1
    // tithiIdx=1 is <= 2, so it enters the block but findEventEnd returns null
    findEventEnd.mockResolvedValue(null);

    const result = await findNearestAmavasya(100, "forward");
    expect(result).toBeNull();
  });

  it("returns conjunction JD if found in correct direction", async () => {
    // Make tithiAtDay close to Amavasya (tithiIdx >= 28)
    // elongation = 29.5 * 12 = 354 → moon - sun = 354 → sun=0, moon=354
    sweCalcUt
      .mockResolvedValueOnce({ longitude: 0 }) // sun
      .mockResolvedValueOnce({ longitude: 354 }) // moon → tithiProg=29.5 → tithiIdx=30
      .mockResolvedValue({ longitude: 0 });

    findEventEnd
      .mockResolvedValueOnce(104) // amavasyaStart
      .mockResolvedValueOnce(105); // conjunction

    const result = await findNearestAmavasya(100, "forward");
    expect(result).toBe(105);
  });

  it("returns null if conjunction is in wrong direction", async () => {
    sweCalcUt
      .mockResolvedValueOnce({ longitude: 0 })
      .mockResolvedValueOnce({ longitude: 354 })
      .mockResolvedValue({ longitude: 0 });

    // conjunction < fromJD (100) while direction=forward
    findEventEnd.mockResolvedValueOnce(104).mockResolvedValueOnce(95); // behind fromJD

    const result = await findNearestAmavasya(100, "forward");
    expect(result).toBeNull();
  });
});

describe("computeMaasData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Make findNearestAmavasya not find Amavasya (sweCalcUt returns tithi far from Amavasya)
    sweCalcUt.mockResolvedValue({ longitude: 90 }); // sun at 90, moon at 90 → elongation=0 → tithiIdx=1 (not near 28-30)
    findEventEnd.mockResolvedValue(null);
  });

  it("isAdhika=true when prev and next Amavasya have same Sun rashi", async () => {
    // Override findNearestAmavasya via mocked sweCalcUt to find Amavasyas
    sweCalcUt
      .mockResolvedValueOnce({ longitude: 0 })
      .mockResolvedValueOnce({ longitude: 354 }) // tithiIdx=30 → near Amavasya
      .mockResolvedValue({ longitude: 0 });

    findEventEnd
      .mockResolvedValueOnce(50) // backward: amavasyaStart
      .mockResolvedValueOnce(55) // backward: conjunction (< fromJD=100)
      .mockResolvedValueOnce(150) // forward: amavasyaStart
      .mockResolvedValueOnce(155); // forward: conjunction (> fromJD=100)

    getSunRashiMock
      .mockResolvedValueOnce(2) // prev Amavasya rashi
      .mockResolvedValueOnce(2); // next Amavasya rashi — same → adhika!

    const result = await computeMaasData(100, 11, 2);
    expect(result.isAdhika).toBe(true);
  });

  it("lunarDay = tithiIdx - 15 for Krishna paksha (tithiIdx > 15)", async () => {
    getSunRashiMock.mockResolvedValue(null);
    findEventEnd.mockResolvedValue(null);
    sweCalcUt.mockResolvedValue({ longitude: 90 });

    const result = await computeMaasData(100, 20, 3);
    expect(result.lunarDay).toBe(5); // 20 - 15
  });

  it("lunarDay = tithiIdx + 15 for Shukla paksha (tithiIdx <= 15)", async () => {
    getSunRashiMock.mockResolvedValue(null);
    findEventEnd.mockResolvedValue(null);
    sweCalcUt.mockResolvedValue({ longitude: 90 });

    const result = await computeMaasData(100, 5, 3);
    expect(result.lunarDay).toBe(20); // 5 + 15
  });

  it("Amavasya (tithiIdx=30) uses next Amavasya rashi, not sunSignIdx", async () => {
    // Simulates Dec 15 2028: sun at sunrise = Scorpio (rashi 7, sunSignIdx=7 → Margashirsha)
    // but conjunction happens later when sun has crossed into Sagittarius (rashi 8 → Pausha).
    sweCalcUt
      .mockResolvedValueOnce({ longitude: 0 })
      .mockResolvedValueOnce({ longitude: 354 }) // tithiIdx=30 → near Amavasya
      .mockResolvedValue({ longitude: 0 });

    findEventEnd
      .mockResolvedValueOnce(50) // backward: amavasyaStart
      .mockResolvedValueOnce(55) // backward: conjunction (< fromJD=100)
      .mockResolvedValueOnce(150) // forward: amavasyaStart
      .mockResolvedValueOnce(105); // forward: conjunction (> fromJD=100)

    getSunRashiMock
      .mockResolvedValueOnce(7) // prev Amavasya rashi = Scorpio
      .mockResolvedValueOnce(8); // next Amavasya rashi = Sagittarius → Pausha

    const sunSignIdx = 7; // sun at sunrise still in Scorpio
    const result = await computeMaasData(100, 30, sunSignIdx);
    // maasIdx = (8+1)%12 = 9 = Pausha, NOT (7+1)%12=8 = Margashirsha
    expect(result.maasIdx).toBe(9);
  });
});
