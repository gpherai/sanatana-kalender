import { describe, it, expect, vi, beforeEach } from "vitest";

const { sweCalcUt, sweJulday } = vi.hoisted(() => ({
  sweCalcUt: vi.fn(),
  sweJulday: vi.fn().mockResolvedValue(100),
}));

vi.mock("../../../utils/astro", () => ({
  swe_calc_ut: sweCalcUt,
  swe_julday: sweJulday,
}));

vi.mock("swisseph", () => ({
  SE_SUN: 0,
  SE_MOON: 1,
  SEFLG_SWIEPH: 2,
  SEFLG_SIDEREAL: 64,
  SE_GREG_CAL: 1,
  swe_revjul: () => ({ year: 2025, month: 1, day: 1, hour: 12 }),
}));

import { detectMoonPhaseEvent } from "../../modules/moon-phase-detector";

const location = { name: "Test", lat: 1, lon: 2, tz: "UTC" };

describe("detectMoonPhaseEvent", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns null when no phase crossing occurs", async () => {
    sweJulday.mockResolvedValueOnce(100).mockResolvedValueOnce(101);
    // e1 = 45, e2 = 80 — no crossing of 0/90/180/270
    sweCalcUt
      .mockResolvedValueOnce({ longitude: 0 })
      .mockResolvedValueOnce({ longitude: 45 }) // e1=45
      .mockResolvedValueOnce({ longitude: 0 })
      .mockResolvedValueOnce({ longitude: 80 }); // e2=80

    const result = await detectMoonPhaseEvent("2025-01-01", location);
    expect(result).toBeNull();
  });

  it("detects full moon crossing (e1 < 180, e2 >= 180)", async () => {
    sweJulday.mockResolvedValueOnce(100).mockResolvedValueOnce(101);
    sweCalcUt
      .mockResolvedValueOnce({ longitude: 0 })
      .mockResolvedValueOnce({ longitude: 170 }) // e1=170
      .mockResolvedValueOnce({ longitude: 0 })
      .mockResolvedValueOnce({ longitude: 190 }) // e2=190
      // binary search (30 iterations)
      .mockResolvedValueOnce({ longitude: 0 })
      .mockResolvedValueOnce({ longitude: 185 }) // eMid > 180 → hi=mid
      .mockResolvedValueOnce({ longitude: 0 })
      .mockResolvedValueOnce({ longitude: 175 }) // eMid < 180 → lo=mid
      .mockResolvedValue({ longitude: 0 });

    const result = await detectMoonPhaseEvent("2025-01-01", location);
    expect(result).not.toBeNull();
    expect(result?.type).toBe("full");
    expect(typeof result?.timeLocal).toBe("string");
  });

  it("detects new moon crossing (e1 > 340, e2 < 15)", async () => {
    sweJulday.mockResolvedValueOnce(100).mockResolvedValueOnce(101);
    sweCalcUt
      .mockResolvedValueOnce({ longitude: 0 })
      .mockResolvedValueOnce({ longitude: 350 }) // e1=350 > 340
      .mockResolvedValueOnce({ longitude: 0 })
      .mockResolvedValueOnce({ longitude: 10 }) // e2=10 < 15
      // binary search
      .mockResolvedValueOnce({ longitude: 0 })
      .mockResolvedValueOnce({ longitude: 355 }) // eMid > 180 → lo=mid
      .mockResolvedValueOnce({ longitude: 0 })
      .mockResolvedValueOnce({ longitude: 5 }) // eMid <= 180 → hi=mid
      .mockResolvedValue({ longitude: 0 });

    const result = await detectMoonPhaseEvent("2025-01-01", location);
    expect(result).not.toBeNull();
    expect(result?.type).toBe("new");
  });
});
