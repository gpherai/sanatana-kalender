import { describe, it, expect, vi, afterEach } from "vitest";
import {
  calendarDate,
  convertTithiToEnum,
  getMoonPhaseType,
  mapNakshatraToEnum,
} from "@/scripts/seed-helpers";

describe("seed helpers", () => {
  describe("calendarDate", () => {
    it("returns a local midnight date for the provided components", () => {
      const date = calendarDate(2025, 1, 2);

      expect(date.getFullYear()).toBe(2025);
      expect(date.getMonth()).toBe(0);
      expect(date.getDate()).toBe(2);
      expect(date.getHours()).toBe(0);
      expect(date.getMinutes()).toBe(0);
    });
  });

  describe("convertTithiToEnum", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("maps shukla tithi numbers to enums", () => {
      expect(convertTithiToEnum(1, "Shukla")).toBe("PRATIPADA_SHUKLA");
      expect(convertTithiToEnum(15, "Shukla")).toBe("PURNIMA");
    });

    it("maps krishna tithi numbers to enums", () => {
      expect(convertTithiToEnum(16, "Krishna")).toBe("PRATIPADA_KRISHNA");
      expect(convertTithiToEnum(30, "Krishna")).toBe("AMAVASYA");
    });

    it("returns null and logs for invalid tithi ranges", () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(convertTithiToEnum(0, "Shukla")).toBeNull();
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe("mapNakshatraToEnum", () => {
    it("maps valid nakshatra numbers", () => {
      expect(mapNakshatraToEnum(1)).toBe("ASHWINI");
      expect(mapNakshatraToEnum(27)).toBe("REVATI");
    });

    it("returns null for out of range values", () => {
      expect(mapNakshatraToEnum(0)).toBeNull();
      expect(mapNakshatraToEnum(28)).toBeNull();
    });
  });

  describe("getMoonPhaseType", () => {
    it("handles new and full moon edges", () => {
      expect(getMoonPhaseType(2, true)).toBe("NEW_MOON");
      expect(getMoonPhaseType(98, false)).toBe("FULL_MOON");
    });

    it("maps waxing ranges", () => {
      expect(getMoonPhaseType(10, true)).toBe("WAXING_CRESCENT");
      expect(getMoonPhaseType(30, true)).toBe("FIRST_QUARTER");
      expect(getMoonPhaseType(60, true)).toBe("WAXING_GIBBOUS");
      expect(getMoonPhaseType(80, true)).toBe("FULL_MOON");
    });

    it("maps waning ranges", () => {
      expect(getMoonPhaseType(80, false)).toBe("WANING_GIBBOUS");
      expect(getMoonPhaseType(60, false)).toBe("LAST_QUARTER");
      expect(getMoonPhaseType(40, false)).toBe("WANING_CRESCENT");
      expect(getMoonPhaseType(20, false)).toBe("NEW_MOON");
    });
  });
});
