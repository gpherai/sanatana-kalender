import { describe, it, expect } from "vitest";
import { computeSamvatData } from "../../modules/samvat-computer";

describe("computeSamvatData", () => {
  it("2025, maasIdx=4 (not Chaitra) → vikrama=2082, shaka=1947", () => {
    const result = computeSamvatData(2025, 4, false);
    expect(result.vikramaYear).toBe(2082);
    expect(result.shakaYear).toBe(1947);
  });

  it("adhika Chaitra (maasIdx=0, isAdhika=true) does NOT increment Vikrama year", () => {
    // isNewYearOpen = maasIdx !== 11 && !(maasIdx === 0 && isAdhika) = false → subtract 1
    const regular = computeSamvatData(2025, 4, false);
    const adhika = computeSamvatData(2025, 0, true);
    expect(adhika.vikramaYear).toBe(regular.vikramaYear - 1);
  });

  it("Phalguna (maasIdx=11) subtracts 1 from vikrama year", () => {
    const phalguna = computeSamvatData(2025, 11, false);
    const other = computeSamvatData(2025, 4, false);
    expect(phalguna.vikramaYear).toBe(other.vikramaYear - 1);
  });

  it("Nija Chaitra (maasIdx=0, isAdhika=false) does NOT subtract", () => {
    const nija = computeSamvatData(2025, 0, false);
    const other = computeSamvatData(2025, 4, false);
    expect(nija.vikramaYear).toBe(other.vikramaYear);
  });

  it("samvatsara names are defined strings", () => {
    const result = computeSamvatData(2025, 4, false);
    expect(typeof result.vikramaSamvatsaraName).toBe("string");
    expect(result.vikramaSamvatsaraName).not.toBe("Unknown");
    expect(typeof result.shakaSamvatsaraName).toBe("string");
    expect(result.shakaSamvatsaraName).not.toBe("Unknown");
  });
});
