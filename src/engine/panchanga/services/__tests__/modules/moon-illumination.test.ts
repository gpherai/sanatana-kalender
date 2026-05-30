import { describe, it, expect, vi } from "vitest";

const { swePhenoUt } = vi.hoisted(() => ({
  swePhenoUt: vi.fn(),
}));

vi.mock("../../../utils/astro", () => ({
  swe_pheno_ut: swePhenoUt,
}));

vi.mock("swisseph", () => ({
  SE_MOON: 1,
  SEFLG_SWIEPH: 2,
  SEFLG_SIDEREAL: 64,
  SEFLG_SPEED: 256,
}));

import { computeMoonIllumination } from "../../modules/moon-illumination";

describe("computeMoonIllumination", () => {
  it("returns illumination as phaseIllum * 100", async () => {
    swePhenoUt.mockResolvedValue({ phaseIllum: 0.42, phaseAngle: 90 });
    const result = await computeMoonIllumination(
      100,
      66,
      { longitude: 20 },
      { longitude: 140 }
    );
    expect(result.illumination).toBe(42);
    expect(result.phaseAngle).toBe(90);
  });

  it("waxing=true when elongation < 180", async () => {
    swePhenoUt.mockResolvedValue({ phaseIllum: 0.5, phaseAngle: 90 });
    const result = await computeMoonIllumination(
      100,
      66,
      { longitude: 0 },
      { longitude: 90 } // elongation = 90
    );
    expect(result.waxing).toBe(true);
  });

  it("waxing=false when elongation >= 180", async () => {
    swePhenoUt.mockResolvedValue({ phaseIllum: 0.8, phaseAngle: 200 });
    const result = await computeMoonIllumination(
      100,
      66,
      { longitude: 0 },
      { longitude: 200 } // elongation = 200
    );
    expect(result.waxing).toBe(false);
  });

  it("handles negative elongation (moon before sun in longitude)", async () => {
    swePhenoUt.mockResolvedValue({ phaseIllum: 0.3, phaseAngle: 50 });
    const result = await computeMoonIllumination(
      100,
      66,
      { longitude: 200 },
      { longitude: 150 } // elongation = -50 → +310 after normalize
    );
    expect(result.waxing).toBe(false); // 310 >= 180
  });
});
