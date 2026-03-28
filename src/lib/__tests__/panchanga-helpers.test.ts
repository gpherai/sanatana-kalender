import { describe, it, expect } from "vitest";
import { detectSpecialDay, TithiInfo } from "../panchanga-helpers";

describe("Panchanga Helpers", () => {
  // =============================================================================
  // detectSpecialDay
  // =============================================================================
  describe("detectSpecialDay", () => {
    it("should identify Purnima (Full Moon)", () => {
      const tithi: TithiInfo = { number: 15, paksha: "Shukla", name: "Purnima" };
      const result = detectSpecialDay(tithi);

      expect(result).not.toBeNull();
      expect(result?.type).toBe("purnima");
      expect(result?.emoji).toBe("🌕");
    });

    it("should identify Amavasya (New Moon)", () => {
      const tithi: TithiInfo = { number: 15, paksha: "Krishna", name: "Amavasya" };
      const result = detectSpecialDay(tithi);

      expect(result?.type).toBe("amavasya");
      expect(result?.emoji).toBe("🌑");
    });

    it("should identify Ekadashi (Shukla)", () => {
      const tithi: TithiInfo = { number: 11, paksha: "Shukla", name: "Ekadashi" };
      const result = detectSpecialDay(tithi);
      expect(result?.type).toBe("ekadashi");
      expect(result?.name).toBe("Shukla Ekadashi");
    });

    it("should identify Ekadashi (Krishna)", () => {
      const tithi: TithiInfo = { number: 11, paksha: "Krishna", name: "Ekadashi" };
      const result = detectSpecialDay(tithi);
      expect(result?.type).toBe("ekadashi");
      expect(result?.name).toBe("Krishna Ekadashi");
    });

    it("should identify Vinayaka Chaturthi (Shukla 4)", () => {
      const tithi: TithiInfo = { number: 4, paksha: "Shukla", name: "Chaturthi" };
      const result = detectSpecialDay(tithi);
      expect(result?.type).toBe("chaturthi");
      expect(result?.name).toBe("Vinayaka Chaturthi");
    });

    it("should identify Sankashti Chaturthi (Krishna 4)", () => {
      const tithi: TithiInfo = { number: 4, paksha: "Krishna", name: "Chaturthi" };
      const result = detectSpecialDay(tithi);
      expect(result?.type).toBe("sankashti");
      expect(result?.name).toBe("Sankashti Chaturthi");
    });

    it("should identify Pradosham (13)", () => {
      const tithi: TithiInfo = { number: 13, paksha: "Shukla", name: "Trayodashi" };
      const result = detectSpecialDay(tithi);
      expect(result?.type).toBe("pradosham");
    });

    it("should identify Ashtami (8)", () => {
      const tithi: TithiInfo = { number: 8, paksha: "Shukla", name: "Ashtami" };
      const result = detectSpecialDay(tithi);
      expect(result?.type).toBe("ashtami");
    });

    it("should return null for non-special days (e.g. Dwitiya)", () => {
      const tithi: TithiInfo = { number: 2, paksha: "Shukla", name: "Dwitiya" };
      const result = detectSpecialDay(tithi);
      expect(result).toBeNull();
    });

    it("should return null for undefined tithi", () => {
      // @ts-expect-error - Testing invalid input
      expect(detectSpecialDay(undefined)).toBeNull();
    });
  });
});
