import { describe, it, expect } from "vitest";
import {
  parseTimeToMinutes,
  formatMinutesToTime,
  addMinutesToTime,
  calculateNishitaKaal,
  calculatePradoshKaal,
  calculateSunriseWindow,
  calculateSunsetWindow,
  calculateMadhyahna,
  calculateTimingWindow,
} from "../timing-utils";
import { TimingType } from "@/generated/prisma/client";

describe("timing-utils", () => {
  describe("parseTimeToMinutes", () => {
    it("parses valid HH:MM", () => {
      expect(parseTimeToMinutes("00:00")).toBe(0);
      expect(parseTimeToMinutes("12:30")).toBe(750);
      expect(parseTimeToMinutes("23:59")).toBe(1439);
    });

    it("parses valid HH:MM:SS, ignoring seconds", () => {
      expect(parseTimeToMinutes("12:30:45")).toBe(750);
    });

    it("returns null for invalid inputs", () => {
      expect(parseTimeToMinutes("invalid")).toBeNull();
      expect(parseTimeToMinutes("24:00")).toBeNull();
      expect(parseTimeToMinutes("12:60")).toBeNull();
      expect(parseTimeToMinutes("123:45")).toBeNull();
    });
  });

  describe("formatMinutesToTime", () => {
    it("formats valid minutes", () => {
      expect(formatMinutesToTime(0)).toBe("00:00");
      expect(formatMinutesToTime(750)).toBe("12:30");
      expect(formatMinutesToTime(1439)).toBe("23:59");
    });

    it("wraps around 24 hours", () => {
      expect(formatMinutesToTime(1440)).toBe("00:00");
      expect(formatMinutesToTime(1500)).toBe("01:00");
    });

    it("handles negative minutes correctly", () => {
      expect(formatMinutesToTime(-60)).toBe("23:00");
      expect(formatMinutesToTime(-1)).toBe("23:59");
    });
  });

  describe("addMinutesToTime", () => {
    it("adds minutes correctly", () => {
      expect(addMinutesToTime("12:00", 30)).toBe("12:30");
      expect(addMinutesToTime("23:30", 60)).toBe("00:30");
    });

    it("subtracts minutes correctly", () => {
      expect(addMinutesToTime("12:00", -30)).toBe("11:30");
      expect(addMinutesToTime("00:30", -60)).toBe("23:30");
    });

    it("returns null for invalid time strings", () => {
      expect(addMinutesToTime("invalid", 30)).toBeNull();
    });
  });

  describe("calculateNishitaKaal", () => {
    it("calculates window correctly", () => {
      // 18:00 to 06:00 is 12 hours (720 minutes)
      // Midpoint: 18:00 + 6 hours = 00:00
      // Muhurta = 720 / 15 = 48 minutes
      // Window: 23:12 to 00:48
      const res = calculateNishitaKaal("18:00", "06:00");
      expect(res).toEqual({ startTime: "23:12", endTime: "00:48" });
    });

    it("returns null for invalid inputs", () => {
      expect(calculateNishitaKaal("invalid", "06:00")).toBeNull();
      expect(calculateNishitaKaal("18:00", "invalid")).toBeNull();
    });
  });

  describe("calculatePradoshKaal", () => {
    it("calculates window correctly", () => {
      const res = calculatePradoshKaal("18:00");
      expect(res).toEqual({ startTime: "18:00", endTime: "20:24" });
    });

    it("returns null for invalid inputs", () => {
      expect(calculatePradoshKaal("invalid")).toBeNull();
    });
  });

  describe("calculateSunriseWindow", () => {
    it("calculates window correctly", () => {
      const res = calculateSunriseWindow("06:00");
      expect(res).toEqual({ startTime: "06:00", endTime: "08:00" });
    });

    it("calculates window stripping seconds", () => {
      const res = calculateSunriseWindow("06:15:30");
      expect(res).toEqual({ startTime: "06:15", endTime: "08:15" });
    });

    it("returns null for invalid inputs", () => {
      expect(calculateSunriseWindow("invalid")).toBeNull();
    });
  });

  describe("calculateSunsetWindow", () => {
    it("calculates window correctly", () => {
      const res = calculateSunsetWindow("18:00");
      expect(res).toEqual({ startTime: "17:30", endTime: "19:00" });
    });

    it("returns null for invalid inputs", () => {
      expect(calculateSunsetWindow("invalid")).toBeNull();
    });
  });

  describe("calculateMadhyahna", () => {
    it("calculates window correctly", () => {
      // 06:00 to 18:00 is 12 hours (720 minutes)
      // Muhurta = 720 / 5 = 144 minutes
      // Start = 06:00 + (144 * 2) = 06:00 + 288 mins = 10:48
      // End = 06:00 + (144 * 3) = 06:00 + 432 mins = 13:12
      const res = calculateMadhyahna("06:00", "18:00");
      expect(res).toEqual({ startTime: "10:48", endTime: "13:12" });
    });

    it("returns null for invalid inputs", () => {
      expect(calculateMadhyahna("invalid", "18:00")).toBeNull();
      expect(calculateMadhyahna("06:00", "invalid")).toBeNull();
    });

    it("returns null if sunset is before sunrise (e.g. invalid duration)", () => {
      expect(calculateMadhyahna("18:00", "06:00")).toBeNull();
      expect(calculateMadhyahna("06:00", "06:00")).toBeNull();
    });
  });

  describe("calculateTimingWindow", () => {
    const validInputs = { sunset: "18:00", nextSunrise: "06:00", sunrise: "06:00" };

    it("calculates NISHITA_KAAL", () => {
      const res = calculateTimingWindow(TimingType.NISHITA_KAAL, validInputs);
      expect(res).toEqual({ startTime: "23:12", endTime: "00:48" });
    });

    it("returns null for NISHITA_KAAL if inputs are missing", () => {
      expect(
        calculateTimingWindow(TimingType.NISHITA_KAAL, { sunset: "18:00" })
      ).toBeNull();
      expect(
        calculateTimingWindow(TimingType.NISHITA_KAAL, { nextSunrise: "06:00" })
      ).toBeNull();
    });

    it("calculates PRADOSH_KAAL", () => {
      const res = calculateTimingWindow(TimingType.PRADOSH_KAAL, validInputs);
      expect(res).toEqual({ startTime: "18:00", endTime: "20:24" });
    });

    it("returns null for PRADOSH_KAAL if input is missing", () => {
      expect(calculateTimingWindow(TimingType.PRADOSH_KAAL, {})).toBeNull();
    });

    it("calculates SUNRISE", () => {
      const res = calculateTimingWindow(TimingType.SUNRISE, validInputs);
      expect(res).toEqual({ startTime: "06:00", endTime: "08:00" });
    });

    it("returns null for SUNRISE if input is missing", () => {
      expect(calculateTimingWindow(TimingType.SUNRISE, {})).toBeNull();
    });

    it("calculates SUNSET", () => {
      const res = calculateTimingWindow(TimingType.SUNSET, validInputs);
      expect(res).toEqual({ startTime: "17:30", endTime: "19:00" });
    });

    it("returns null for SUNSET if input is missing", () => {
      expect(calculateTimingWindow(TimingType.SUNSET, {})).toBeNull();
    });

    it("calculates MADHYAHNA", () => {
      const res = calculateTimingWindow(TimingType.MADHYAHNA, validInputs);
      expect(res).toEqual({ startTime: "10:48", endTime: "13:12" });
    });

    it("returns null for MADHYAHNA if input is missing", () => {
      expect(calculateTimingWindow(TimingType.MADHYAHNA, { sunset: "18:00" })).toBeNull();
      expect(
        calculateTimingWindow(TimingType.MADHYAHNA, { sunrise: "06:00" })
      ).toBeNull();
    });

    it("returns null for unknown or unsupported timing types", () => {
      expect(calculateTimingWindow("UNKNOWN" as TimingType, validInputs)).toBeNull();
    });
  });
});
