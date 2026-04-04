import { describe, it, expect } from "vitest";
import {
  isConsecutiveDay,
  groupConsecutiveDays,
  selectFirstPerYear,
  isPredecessorEndsAfterSunrise,
  computeTithiOccurrence,
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
  });

  describe("isPredecessorEndsAfterSunrise", () => {
    it("returns true when tithiEndTime >= sunrise", () => {
      const prev: PrevDayInfo = { tithiEndTime: "10:00", sunrise: "06:00" };
      expect(isPredecessorEndsAfterSunrise(prev)).toBe(true);
    });

    it("returns false when tithiEndTime < sunrise", () => {
      const prev: PrevDayInfo = { tithiEndTime: "05:00", sunrise: "06:00" };
      expect(isPredecessorEndsAfterSunrise(prev)).toBe(false);
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

    it("shifts date and sets startTime if predecessor ended after sunrise (kshaya start)", () => {
      const firstDay = { date: new Date(Date.UTC(2025, 0, 2)), tithiEndTime: "15:00" };
      const lastDay = firstDay;
      const prevMap = new Map<string, PrevDayInfo>();
      // Predecessor ended after sunrise on Jan 1
      prevMap.set("2025-01-02", { tithiEndTime: "20:00:15", sunrise: "06:00" });

      const res = computeTithiOccurrence(firstDay, lastDay, prevMap);
      expect(res.date.toISOString()).toBe("2025-01-01T00:00:00.000Z"); // Shifted back to Jan 1
      expect(res.startTime).toBe("20:00");
      expect(res.endDate?.toISOString()).toBe("2025-01-02T00:00:00.000Z");
      expect(res.endTime).toBe("15:00");
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
});
