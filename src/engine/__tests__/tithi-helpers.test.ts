import { describe, it, expect } from "vitest";
import {
  isConsecutiveDay,
  groupConsecutiveDays,
  selectFirstPerYear,
  isPredecessorEndsAfterSunrise,
  isNishitakalDateShiftNeeded,
  computeTithiOccurrence,
  applyRatriVyapiniDateRule,
} from "../tithi-helpers";
import type { PrevDayInfo } from "../types";

describe("tithi-helpers", () => {
  describe("isConsecutiveDay", () => {
    it("returns true for consecutive days", () => {
      const d1 = new Date(Date.UTC(2025, 0, 1));
      const d2 = new Date(Date.UTC(2025, 0, 2));
      expect(isConsecutiveDay(d1, d2)).toBe(true);
    });

    it("returns false for same day", () => {
      const d1 = new Date(Date.UTC(2025, 0, 1));
      const d2 = new Date(Date.UTC(2025, 0, 1));
      expect(isConsecutiveDay(d1, d2)).toBe(false);
    });

    it("returns false for non-consecutive days", () => {
      const d1 = new Date(Date.UTC(2025, 0, 1));
      const d2 = new Date(Date.UTC(2025, 0, 3));
      expect(isConsecutiveDay(d1, d2)).toBe(false);
    });
  });

  describe("groupConsecutiveDays", () => {
    it("groups consecutive dates together", () => {
      const d1 = { date: new Date(Date.UTC(2025, 0, 1)) };
      const d2 = { date: new Date(Date.UTC(2025, 0, 2)) };
      const d4 = { date: new Date(Date.UTC(2025, 0, 4)) };

      const windows = groupConsecutiveDays([d1, d2, d4]);
      expect(windows).toHaveLength(2);
      expect(windows[0]).toEqual({ firstDay: d1, lastDay: d2 });
      expect(windows[1]).toEqual({ firstDay: d4, lastDay: d4 });
    });

    it("handles empty array", () => {
      expect(groupConsecutiveDays([])).toEqual([]);
    });
  });

  describe("selectFirstPerYear", () => {
    it("selects first occurrence per year", () => {
      const rows = [
        { date: new Date(Date.UTC(2025, 0, 1)), maas: "Chaitra" },
        { date: new Date(Date.UTC(2025, 1, 1)), maas: "Vaisakha" },
        { date: new Date(Date.UTC(2026, 0, 1)), maas: "Chaitra" },
      ];

      const res = selectFirstPerYear(rows, null, false);
      expect(res).toHaveLength(2);
      expect(res[0]?.date.getUTCFullYear()).toBe(2025);
      expect(res[1]?.date.getUTCFullYear()).toBe(2026);
    });

    it("filters by maas values", () => {
      const rows = [
        { date: new Date(Date.UTC(2025, 0, 1)), maas: "Chaitra" },
        { date: new Date(Date.UTC(2025, 1, 1)), maas: "Vaisakha" },
      ];

      const res = selectFirstPerYear(rows, ["Chaitra"], false);
      expect(res).toHaveLength(1);
      expect(res[0]?.maas).toBe("Chaitra");
    });

    it("selects first occurrence per year and maas when isMultiMaas is true", () => {
      const rows = [
        { date: new Date(Date.UTC(2025, 0, 1)), maas: "Chaitra" },
        { date: new Date(Date.UTC(2025, 0, 15)), maas: "Chaitra" },
        { date: new Date(Date.UTC(2025, 1, 1)), maas: "Vaisakha" },
      ];

      const res = selectFirstPerYear(rows, null, true);
      expect(res).toHaveLength(2);
      expect(res[0]?.maas).toBe("Chaitra");
      expect(res[1]?.maas).toBe("Vaisakha");
    });

    it("handles missing maas when isMultiMaas is true", () => {
      const rows = [
        { date: new Date(Date.UTC(2025, 0, 1)), maas: null },
        { date: new Date(Date.UTC(2025, 0, 15)), maas: null },
      ];
      const res = selectFirstPerYear(rows, null, true);
      expect(res).toHaveLength(1);
    });
  });

  describe("isPredecessorEndsAfterSunrise", () => {
    // With sunset available: only evening/night starts (>= sunset) shift the occurrence.
    // A daytime start (between sunrise and sunset) belongs to the next day via Udaya Tithi.
    it("returns false when tithiEndTime is during the day (after sunrise, before sunset)", () => {
      const prev: PrevDayInfo = {
        tithiEndTime: "10:48",
        sunrise: "06:00",
        sunset: "20:00",
      };
      expect(isPredecessorEndsAfterSunrise(prev)).toBe(false);
    });

    it("returns true when tithiEndTime is in the evening (>= sunset)", () => {
      const prev: PrevDayInfo = {
        tithiEndTime: "21:00",
        sunrise: "06:00",
        sunset: "20:00",
      };
      expect(isPredecessorEndsAfterSunrise(prev)).toBe(true);
    });

    it("returns true when tithiEndTime is exactly at sunset", () => {
      const prev: PrevDayInfo = {
        tithiEndTime: "20:00",
        sunrise: "06:00",
        sunset: "20:00",
      };
      expect(isPredecessorEndsAfterSunrise(prev)).toBe(true);
    });

    it("returns false when tithiEndTime is before sunrise", () => {
      const prev: PrevDayInfo = {
        tithiEndTime: "05:00",
        sunrise: "06:00",
        sunset: "20:00",
      };
      expect(isPredecessorEndsAfterSunrise(prev)).toBe(false);
    });

    // Without sunset: falls back to sunrise threshold (legacy behaviour)
    it("falls back to sunrise threshold when sunset is unavailable", () => {
      const afterSunrise: PrevDayInfo = { tithiEndTime: "10:00", sunrise: "06:00" };
      expect(isPredecessorEndsAfterSunrise(afterSunrise)).toBe(true);

      const beforeSunrise: PrevDayInfo = { tithiEndTime: "05:00", sunrise: "06:00" };
      expect(isPredecessorEndsAfterSunrise(beforeSunrise)).toBe(false);
    });

    it("returns false if times are missing or invalid", () => {
      expect(
        isPredecessorEndsAfterSunrise({ tithiEndTime: null, sunrise: "06:00" })
      ).toBe(false);
      expect(
        isPredecessorEndsAfterSunrise({ tithiEndTime: "10:00", sunrise: null })
      ).toBe(false);
      expect(
        isPredecessorEndsAfterSunrise({ tithiEndTime: "invalid", sunrise: "06:00" })
      ).toBe(false);
    });
  });

  describe("isNishitakalDateShiftNeeded", () => {
    it("returns false if any required data is missing", () => {
      const prev: PrevDayInfo = {
        tithiEndTime: "20:00",
        sunrise: "06:00",
        sunset: "18:00",
      };
      expect(isNishitakalDateShiftNeeded(prev, null)).toBe(false);
      expect(isNishitakalDateShiftNeeded({ ...prev, tithiEndTime: null }, "06:00")).toBe(
        false
      );
      expect(isNishitakalDateShiftNeeded({ ...prev, sunrise: null }, "06:00")).toBe(
        false
      );
      expect(isNishitakalDateShiftNeeded({ ...prev, sunset: null }, "06:00")).toBe(false);
    });

    it("returns false if tithi started BEFORE sunrise on previous day", () => {
      const prev: PrevDayInfo = {
        tithiEndTime: "05:00",
        sunrise: "06:00",
        sunset: "18:00",
      };
      expect(isNishitakalDateShiftNeeded(prev, "06:00")).toBe(false);
    });

    it("returns true when tithi starts at least one muhurta before Nishitakal", () => {
      const prev: PrevDayInfo = {
        tithiEndTime: "22:00",
        sunrise: "06:00",
        sunset: "18:00",
      };
      expect(isNishitakalDateShiftNeeded(prev, "06:00")).toBe(true);
    });

    it("returns false when tithi starts less than one muhurta before Nishitakal", () => {
      const prev: PrevDayInfo = {
        tithiEndTime: "23:00",
        sunrise: "06:00",
        sunset: "18:00",
      };
      expect(isNishitakalDateShiftNeeded(prev, "06:00")).toBe(false);
    });

    it("handles invalid time strings gracefully", () => {
      const prev: PrevDayInfo = {
        tithiEndTime: "invalid",
        sunrise: "06:00",
        sunset: "18:00",
      };
      expect(isNishitakalDateShiftNeeded(prev, "06:00")).toBe(false);
    });
  });

  describe("computeTithiOccurrence", () => {
    it("computes occurrence for a single day", () => {
      const firstDay = { date: new Date(Date.UTC(2025, 0, 2)), tithiEndTime: "15:00:30" };
      const lastDay = firstDay;
      const prevMap = new Map<string, PrevDayInfo>();

      const res = computeTithiOccurrence(firstDay, lastDay, prevMap);
      expect(res.date.toISOString()).toBe("2025-01-02T00:00:00.000Z");
      expect(res.endTime).toBe("15:00");
      expect(res.startTime).toBeUndefined();
      expect(res.endDate).toBeUndefined();
    });

    it("computes occurrence spanning multiple days", () => {
      const firstDay = { date: new Date(Date.UTC(2025, 0, 2)), tithiEndTime: null };
      const lastDay = { date: new Date(Date.UTC(2025, 0, 3)), tithiEndTime: "10:00" };
      const prevMap = new Map<string, PrevDayInfo>();

      const res = computeTithiOccurrence(firstDay, lastDay, prevMap);
      expect(res.date.toISOString()).toBe("2025-01-02T00:00:00.000Z");
      expect(res.endDate?.toISOString()).toBe("2025-01-03T00:00:00.000Z");
      expect(res.endTime).toBe("10:00");
    });

    it("shifts date and sets startTime if predecessor ended in the evening (evening start)", () => {
      const firstDay = { date: new Date(Date.UTC(2025, 0, 2)), tithiEndTime: "15:00" };
      const lastDay = firstDay;
      const prevMap = new Map<string, PrevDayInfo>();
      // Tithi started at 20:00 on Jan 1 — after sunset → shift to Jan 1
      prevMap.set("2025-01-02", {
        tithiEndTime: "20:00:15",
        sunrise: "06:00",
        sunset: "18:30",
      });

      const res = computeTithiOccurrence(firstDay, lastDay, prevMap);
      expect(res.date.toISOString()).toBe("2025-01-01T00:00:00.000Z");
      expect(res.startTime).toBe("20:00");
      expect(res.endDate?.toISOString()).toBe("2025-01-02T00:00:00.000Z");
      expect(res.endTime).toBe("15:00");
    });

    it("does NOT shift date when tithi started during the day (Udaya Tithi convention)", () => {
      const firstDay = { date: new Date(Date.UTC(2026, 4, 20)), tithiEndTime: "15:15" };
      const lastDay = firstDay;
      const prevMap = new Map<string, PrevDayInfo>();
      // Tithi started at 10:48 on May 19 — before sunset → stays on May 20
      prevMap.set("2026-05-20", {
        tithiEndTime: "10:48",
        sunrise: "05:44",
        sunset: "20:05",
      });

      const res = computeTithiOccurrence(firstDay, lastDay, prevMap);
      expect(res.date.toISOString()).toBe("2026-05-20T00:00:00.000Z");
      expect(res.startTime).toBeUndefined();
    });

    it("keeps invalid time format unchanged instead of formatting", () => {
      const firstDay = { date: new Date(Date.UTC(2025, 0, 2)), tithiEndTime: "invalid" };
      const lastDay = firstDay;
      const prevMap = new Map<string, PrevDayInfo>();

      const res = computeTithiOccurrence(firstDay, lastDay, prevMap);
      expect(res.endTime).toBe("invalid");
    });

    it("returns undefined endTime if lastDay tithiEndTime is null", () => {
      const firstDay = { date: new Date(Date.UTC(2025, 0, 2)), tithiEndTime: null };
      const lastDay = firstDay;
      const prevMap = new Map<string, PrevDayInfo>();

      const res = computeTithiOccurrence(firstDay, lastDay, prevMap);
      expect(res.endTime).toBeUndefined();
    });
  });

  describe("applyRatriVyapiniDateRule", () => {
    // Setup: sunset 18:00, next sunrise 06:00 → nightDuration=720min, pradoshEnd=18:00+144=20:24
    const firstDay = { date: new Date(Date.UTC(2025, 0, 2)), tithiEndTime: "15:00" };
    const lastDay = firstDay;
    const prevInfo: PrevDayInfo = {
      tithiEndTime: "19:00", // 1140 min — before pradoshEnd 20:24 → observe prevDay
      sunrise: "06:00",
      sunset: "18:00",
    };
    const firstDaySunrise = "06:00";

    it("returns firstDay when prevInfo is undefined", () => {
      const res = applyRatriVyapiniDateRule(
        firstDay,
        lastDay,
        undefined,
        firstDaySunrise
      );
      expect(res.date.toISOString()).toBe("2025-01-02T00:00:00.000Z");
      expect(res.startTime).toBeUndefined();
    });

    it("returns firstDay when prevInfo.tithiEndTime is missing", () => {
      const res = applyRatriVyapiniDateRule(
        firstDay,
        lastDay,
        { ...prevInfo, tithiEndTime: null },
        firstDaySunrise
      );
      expect(res.date.toISOString()).toBe("2025-01-02T00:00:00.000Z");
    });

    it("returns firstDay when prevInfo.sunset is missing", () => {
      const res = applyRatriVyapiniDateRule(
        firstDay,
        lastDay,
        { ...prevInfo, sunset: null },
        firstDaySunrise
      );
      expect(res.date.toISOString()).toBe("2025-01-02T00:00:00.000Z");
    });

    it("returns firstDay when firstDaySunrise is null", () => {
      const res = applyRatriVyapiniDateRule(firstDay, lastDay, prevInfo, null);
      expect(res.date.toISOString()).toBe("2025-01-02T00:00:00.000Z");
    });

    it("shifts to prevDay when tithi starts before Pradosh ends (19:00 < 20:24)", () => {
      const res = applyRatriVyapiniDateRule(firstDay, lastDay, prevInfo, firstDaySunrise);
      // prevDay = Jan 1
      expect(res.date.toISOString()).toBe("2025-01-01T00:00:00.000Z");
      expect(res.startTime).toBe("19:00");
      // endDate = lastDay (Jan 2) since lastDay !== prevDate
      expect(res.endDate?.toISOString()).toBe("2025-01-02T00:00:00.000Z");
      expect(res.endTime).toBe("15:00");
    });

    it("stays on firstDay when tithi starts after Pradosh ends (21:00 > 20:24)", () => {
      const lateStart: PrevDayInfo = { ...prevInfo, tithiEndTime: "21:00" };
      const res = applyRatriVyapiniDateRule(
        firstDay,
        lastDay,
        lateStart,
        firstDaySunrise
      );
      expect(res.date.toISOString()).toBe("2025-01-02T00:00:00.000Z");
      expect(res.startTime).toBeUndefined();
    });

    it("treats past-midnight tithiStart (03:00) as on nextDay timeline — after Pradosh", () => {
      // 03:00 = 180 min < prevSunrise 360 → tithiOnPrevTimeline = 180+1440 = 1620 > 1224
      const midnightStart: PrevDayInfo = { ...prevInfo, tithiEndTime: "03:00" };
      const res = applyRatriVyapiniDateRule(
        firstDay,
        lastDay,
        midnightStart,
        firstDaySunrise
      );
      expect(res.date.toISOString()).toBe("2025-01-02T00:00:00.000Z");
      expect(res.startTime).toBeUndefined();
    });

    it("sets no endDate when lastDay equals prevDate (single-day prevDay window)", () => {
      // Make lastDay the same date as prevDate (Jan 1)
      const prevDayAsLast = {
        date: new Date(Date.UTC(2025, 0, 1)),
        tithiEndTime: "15:00",
      };
      const res = applyRatriVyapiniDateRule(
        firstDay,
        prevDayAsLast,
        prevInfo,
        firstDaySunrise
      );
      expect(res.date.toISOString()).toBe("2025-01-01T00:00:00.000Z");
      expect(res.endDate).toBeUndefined();
    });

    it("sets endDate to lastDay when multi-day window and prevDay shift applies", () => {
      const multiLast = { date: new Date(Date.UTC(2025, 0, 3)), tithiEndTime: "10:00" };
      const res = applyRatriVyapiniDateRule(
        firstDay,
        multiLast,
        prevInfo,
        firstDaySunrise
      );
      expect(res.date.toISOString()).toBe("2025-01-01T00:00:00.000Z");
      expect(res.endDate?.toISOString()).toBe("2025-01-03T00:00:00.000Z");
      expect(res.endTime).toBe("10:00");
    });
  });
});
