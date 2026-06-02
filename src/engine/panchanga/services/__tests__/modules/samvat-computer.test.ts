import { describe, it, expect } from "vitest";
import { computeSamvatData } from "../../modules/samvat-computer";

describe("computeSamvatData", () => {
  it("2025-05, maasIdx=4 (not Chaitra) → vikrama=2082, shaka=1947", () => {
    const result = computeSamvatData(2025, 5, 4, false);
    expect(result.vikramaYear).toBe(2082);
    expect(result.shakaYear).toBe(1947);
  });

  it("adhika Chaitra (maasIdx=0, isAdhika=true) does NOT increment Vikrama year", () => {
    // Adhika Chaitra is before the Nija-Chaitra new year → subtract 1
    const regular = computeSamvatData(2025, 5, 4, false);
    const adhika = computeSamvatData(2025, 3, 0, true);
    expect(adhika.vikramaYear).toBe(regular.vikramaYear - 1);
  });

  it("Phalguna (maasIdx=11) subtracts 1 from vikrama year", () => {
    const phalguna = computeSamvatData(2025, 3, 11, false);
    const other = computeSamvatData(2025, 5, 4, false);
    expect(phalguna.vikramaYear).toBe(other.vikramaYear - 1);
  });

  it("Nija Chaitra (maasIdx=0, isAdhika=false) does NOT subtract", () => {
    const nija = computeSamvatData(2025, 4, 0, false);
    const other = computeSamvatData(2025, 5, 4, false);
    expect(nija.vikramaYear).toBe(other.vikramaYear);
  });

  // ── B15 regression: pre-Chaitra Jan–Feb months must subtract 1 ──────────────
  it("Magha (maasIdx=10) in January belongs to the previous Samvat year", () => {
    // Jan 15 2026 = Magha. Vikrama 2082 (Kalayukta) / Shaka 1947, NOT 2083/1948.
    const magha = computeSamvatData(2026, 1, 10, false);
    expect(magha.vikramaYear).toBe(2082);
    expect(magha.shakaYear).toBe(1947);
  });

  it("Pausha (maasIdx=9) subtracts only in its January portion, not December", () => {
    const paushaJan = computeSamvatData(2026, 1, 9, false);
    const paushaDec = computeSamvatData(2026, 12, 9, false);
    // December Pausha is still in the open Samvat year; January Pausha is the previous one.
    expect(paushaDec.vikramaYear).toBe(2083);
    expect(paushaJan.vikramaYear).toBe(2082);
  });

  it("samvatsara names are defined strings", () => {
    const result = computeSamvatData(2025, 5, 4, false);
    expect(typeof result.vikramaSamvatsaraName).toBe("string");
    expect(result.vikramaSamvatsaraName).not.toBe("Unknown");
    expect(typeof result.shakaSamvatsaraName).toBe("string");
    expect(result.shakaSamvatsaraName).not.toBe("Unknown");
  });
});
