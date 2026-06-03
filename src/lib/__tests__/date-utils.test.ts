import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import {
  isValidDate,
  isSameDay,
  isToday,
  isTomorrow,
  isWeekend,
  getMonthDays,
  getMonthStartPadding,
  formatDate,
  formatShortDate,
  formatDateForInput,
  formatDateLocal,
  formatDateISO,
  formatDateNL,
  formatLongDate,
  formatRelativeDate,
  formatTimeAgo,
  formatIsoTimeAgo,
  parseCalendarDate,
  safeParseDate,
  addDayForDisplay,
  subtractDayFromDisplay,
  startOfDayUTC,
  endOfDayUTC,
} from "../date-utils";

describe("Date Utilities", () => {
  // =============================================================================
  // DATE VALIDATION
  // =============================================================================
  describe("isValidDate", () => {
    it("returns true for valid dates", () => {
      expect(isValidDate(new Date())).toBe(true);
    });
    it("returns false for invalid dates", () => {
      expect(isValidDate(new Date("invalid"))).toBe(false);
    });
  });

  // =============================================================================
  // DATE COMPARISON
  // =============================================================================
  describe("isSameDay", () => {
    it("should return true for the same date", () => {
      const date1 = new Date(Date.UTC(2024, 0, 1, 10, 0, 0));
      const date2 = new Date(Date.UTC(2024, 0, 1, 15, 0, 0));
      expect(isSameDay(date1, date2)).toBe(true);
    });

    it("should return false for different dates", () => {
      // Use dates that are different in both UTC and local time to avoid timezone issues
      const date1 = new Date(2024, 0, 1, 10, 0, 0);
      const date2 = new Date(2024, 0, 2, 10, 0, 0);
      expect(isSameDay(date1, date2)).toBe(false);
    });

    it("should handle year differences correctly", () => {
      const date1 = new Date(Date.UTC(2024, 0, 1));
      const date2 = new Date(Date.UTC(2025, 0, 1));
      expect(isSameDay(date1, date2)).toBe(false);
    });
  });

  describe("isToday", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(Date.UTC(2024, 2, 15, 12, 0, 0)));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should return true if the date matches the mocked current date", () => {
      const today = new Date(Date.UTC(2024, 2, 15, 9, 0, 0));
      expect(isToday(today)).toBe(true);
    });

    it("should return false for a different date", () => {
      const yesterday = new Date(Date.UTC(2024, 2, 14, 12, 0, 0));
      expect(isToday(yesterday)).toBe(false);
    });
  });

  describe("isTomorrow", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(Date.UTC(2024, 2, 15, 12, 0, 0)));
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it("should return true for tomorrow", () => {
      const tomorrow = new Date(Date.UTC(2024, 2, 16, 9, 0, 0));
      expect(isTomorrow(tomorrow)).toBe(true);
    });

    it("should return false for today", () => {
      const today = new Date(Date.UTC(2024, 2, 15, 9, 0, 0));
      expect(isTomorrow(today)).toBe(false);
    });

    it("should return false for day after tomorrow", () => {
      const dayAfter = new Date(Date.UTC(2024, 2, 17, 9, 0, 0));
      expect(isTomorrow(dayAfter)).toBe(false);
    });
  });

  describe("isWeekend", () => {
    it("should return true for Saturday", () => {
      const saturday = new Date(2024, 0, 6);
      expect(isWeekend(saturday)).toBe(true);
    });

    it("should return true for Sunday", () => {
      const sunday = new Date(2024, 0, 7);
      expect(isWeekend(sunday)).toBe(true);
    });

    it("should return false for weekdays", () => {
      const monday = new Date(2024, 0, 8);
      expect(isWeekend(monday)).toBe(false);
    });
  });

  // =============================================================================
  // CALENDAR HELPERS
  // =============================================================================
  describe("getMonthDays", () => {
    it("should return the correct number of days for January (31)", () => {
      const days = getMonthDays(2024, 0);
      expect(days).toHaveLength(31);
      expect(days[0]!.getDate()).toBe(1);
      expect(days[30]!.getDate()).toBe(31);
    });

    it("should return the correct number of days for February in a leap year (29)", () => {
      const days = getMonthDays(2024, 1);
      expect(days).toHaveLength(29);
    });

    it("should return the correct number of days for February in a non-leap year (28)", () => {
      const days = getMonthDays(2023, 1);
      expect(days).toHaveLength(28);
    });
  });

  describe("getMonthStartPadding", () => {
    it("should return correct padding for a month starting on Monday (0 padding)", () => {
      expect(getMonthStartPadding(2024, 0)).toBe(0);
    });

    it("should return correct padding for a month starting on Tuesday (1 padding)", () => {
      expect(getMonthStartPadding(2024, 9)).toBe(1);
    });

    it("should return correct padding for a month starting on Sunday (6 padding)", () => {
      expect(getMonthStartPadding(2024, 8)).toBe(6);
    });
  });

  // =============================================================================
  // DATE FORMATTING
  // =============================================================================
  describe("formatDate", () => {
    it("formats date in Dutch locale", () => {
      const date = new Date(2025, 0, 1);
      expect(formatDate(date)).toMatch(/1 januari 2025/i);
    });
    it("handles null/undefined", () => {
      expect(formatDate(null)).toBe("Geen datum");
    });
    it("handles invalid dates", () => {
      expect(formatDate("invalid")).toBe("Ongeldige datum");
    });
  });

  describe("formatShortDate", () => {
    it("formats as short Dutch date", () => {
      const date = new Date(Date.UTC(2025, 0, 4));
      expect(formatShortDate(date)).toMatch(/4/);
    });
    it("handles invalid date", () => {
      expect(formatShortDate("invalid")).toBe("Ongeldige datum");
    });
  });

  describe("formatDateForInput", () => {
    it("formats as YYYY-MM-DD", () => {
      const date = new Date(Date.UTC(2025, 0, 1));
      expect(formatDateForInput(date).startsWith("2025-01-01")).toBe(true);
    });
    it("returns empty string for null", () => {
      expect(formatDateForInput(null)).toBe("");
    });
    it("returns empty string for invalid date", () => {
      expect(formatDateForInput("invalid")).toBe("");
    });
  });

  describe("formatDateLocal", () => {
    it("formats using local components", () => {
      const date = new Date(2025, 0, 1, 15, 0, 0);
      expect(formatDateLocal(date)).toBe("2025-01-01");
    });
    it("returns empty string for null", () => {
      expect(formatDateLocal(null)).toBe("");
    });
    it("returns empty string for invalid date", () => {
      expect(formatDateLocal("invalid")).toBe("");
    });
  });

  describe("formatDateISO", () => {
    it("should format date as YYYY-MM-DD", () => {
      const date = new Date("2024-12-25T15:30:00Z");
      expect(formatDateISO(date)).toBe("2024-12-25");
    });

    it("handles toISOString returning string without T separator", () => {
      const date = new Date("2024-12-25T15:30:00Z");
      vi.spyOn(date, "toISOString").mockReturnValue("2024-12-25");
      expect(formatDateISO(date)).toBe("2024-12-25");
    });
  });

  describe("formatDateNL", () => {
    it("should format date in Dutch long format", () => {
      const spy = vi
        .spyOn(Date.prototype, "toLocaleDateString")
        .mockReturnValue("1 januari");
      const date = new Date(Date.UTC(2024, 0, 1));
      const result = formatDateNL(date);
      expect(spy).toHaveBeenCalledWith("nl-NL", {
        timeZone: "Europe/Amsterdam",
        day: "numeric",
        month: "long",
      });
      expect(result).toBe("1 januari");
      spy.mockRestore();
    });
  });

  describe("formatLongDate", () => {
    it("includes weekday, day, month and year", () => {
      const date = new Date(2025, 0, 6); // Monday 6 January 2025
      const result = formatLongDate(date);
      expect(result).toMatch(/maandag/i);
      expect(result).toMatch(/6/);
      expect(result).toMatch(/januari/i);
      expect(result).toMatch(/2025/);
    });

    it("accepts a date string", () => {
      const result = formatLongDate("2025-01-06T00:00:00Z");
      expect(result).toBeTruthy();
      expect(result).not.toBe("Ongeldige datum");
    });

    it("returns 'Ongeldige datum' for invalid input", () => {
      expect(formatLongDate("invalid")).toBe("Ongeldige datum");
    });
  });

  describe("formatRelativeDate", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(Date.UTC(2024, 2, 15, 12, 0, 0)));
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it("returns null for a past date", () => {
      expect(formatRelativeDate(new Date(Date.UTC(2024, 2, 14, 12, 0, 0)))).toBeNull();
    });

    it("returns null for the current moment", () => {
      expect(formatRelativeDate(new Date(Date.UTC(2024, 2, 15, 12, 0, 0)))).toBeNull();
    });

    it("returns a non-empty string for a future date", () => {
      const future = new Date(Date.UTC(2024, 5, 15, 12, 0, 0)); // ~3 months later
      const result = formatRelativeDate(future);
      expect(result).not.toBeNull();
      expect(typeof result).toBe("string");
      expect(result!.length).toBeGreaterThan(0);
    });

    it("returns relative string in weeks for a future date > 1 week", () => {
      const future = new Date(Date.UTC(2024, 2, 25, 12, 0, 0)); // ~10 days later
      const result = formatRelativeDate(future);
      expect(result).toBe("over 1 week");
    });

    it("returns relative string in months for exactly 5 weeks future (35 days)", () => {
      const future = new Date(Date.UTC(2024, 3, 19, 12, 0, 0)); // ~35 days later
      const result = formatRelativeDate(future);
      expect(result).toBe("over 1 maand");
    });

    it("returns relative string in months for a future date > 1 month", () => {
      const future = new Date(Date.UTC(2024, 3, 25, 12, 0, 0)); // ~40 days later
      const result = formatRelativeDate(future);
      expect(result).toBe("over 1 maand");
    });

    it("returns relative string in months for a future date > 2 months", () => {
      const future = new Date(Date.UTC(2024, 4, 25, 12, 0, 0)); // ~70 days later
      const result = formatRelativeDate(future);
      expect(result).toBe("over 2 maanden");
    });

    it("returns relative string in years for a future date > 1 year", () => {
      const future = new Date(Date.UTC(2026, 5, 15, 12, 0, 0)); // > 2 years later
      const result = formatRelativeDate(future);
      expect(result).toBe("over 2 jaar");
    });
  });

  describe("formatIsoTimeAgo", () => {
    it("should return placeholder for null", () => {
      expect(formatIsoTimeAgo(null)).toBe("—");
    });

    it("should return placeholder for invalid iso string", () => {
      expect(formatIsoTimeAgo("invalid")).toBe("—");
    });

    it("should format future time correctly", () => {
      const now = new Date("2024-01-01T12:00:00Z");
      // 2 hours 30 mins in future
      const future = new Date("2024-01-01T14:30:00Z").toISOString();
      expect(formatIsoTimeAgo(future, now)).toBe("over 2u 30m");

      // 15 mins in future
      const futureMin = new Date("2024-01-01T12:15:00Z").toISOString();
      expect(formatIsoTimeAgo(futureMin, now)).toBe("over 15m");
    });

    it("should format past time correctly", () => {
      const now = new Date("2024-01-01T12:00:00Z");
      // 1 hour 30 mins in past
      const past = new Date("2024-01-01T10:30:00Z").toISOString();
      expect(formatIsoTimeAgo(past, now)).toBe("1u 30m geleden");

      // 15 mins in past
      const pastMin = new Date("2024-01-01T11:45:00Z").toISOString();
      expect(formatIsoTimeAgo(pastMin, now)).toBe("15m geleden");
    });
  });

  describe("formatTimeAgo", () => {
    it("should return placeholder for missing time", () => {
      expect(formatTimeAgo(null)).toBe("—");
    });

    it("should return placeholder for invalid time strings", () => {
      const now = new Date("2024-01-01T12:00:00");
      expect(formatTimeAgo("bad", now)).toBe("—");
      expect(formatTimeAgo("12", now)).toBe("—");
    });

    it("should return correct string for future time", () => {
      const now = new Date("2024-01-01T12:00:00");
      const result = formatTimeAgo("14:30", now);
      expect(result).toBe("over 2u 30m");
    });

    it("should return correct string for past time", () => {
      const now = new Date("2024-01-01T12:00:00");
      const result = formatTimeAgo("10:30", now);
      expect(result).toBe("1u 30m geleden");

      const resultMin = formatTimeAgo("11:45", now);
      expect(resultMin).toBe("15m geleden");
    });

    it("should handle minutes only correctly", () => {
      const now = new Date("2024-01-01T12:00:00");
      const result = formatTimeAgo("12:15", now);
      expect(result).toBe("over 15m");
    });
  });

  // =============================================================================
  // CALENDAR DATE PARSING
  // =============================================================================
  describe("parseCalendarDate", () => {
    it("parses YYYY-MM-DD to UTC midnight", () => {
      const result = parseCalendarDate("2025-01-01");
      expect(result.toISOString()).toBe("2025-01-01T00:00:00.000Z");
    });
    it("throws on invalid format", () => {
      expect(() => parseCalendarDate("01-01-2025")).toThrow();
    });
    it("throws on calendar overflow instead of rolling over", () => {
      expect(() => parseCalendarDate("2025-13-45")).toThrow();
      expect(() => parseCalendarDate("2025-02-30")).toThrow();
    });
  });

  describe("safeParseDate", () => {
    it("returns Date for valid string", () => {
      const result = safeParseDate("2025-01-01");
      expect(result).toBeInstanceOf(Date);
      expect(result?.toISOString()).toBe("2025-01-01T00:00:00.000Z");
    });
    it("returns null for invalid format", () => {
      expect(safeParseDate("invalid")).toBeNull();
      expect(safeParseDate("01-01-2025")).toBeNull();
    });
    it("returns null for calendar overflow", () => {
      expect(safeParseDate("2025-13-45")).toBeNull();
      expect(safeParseDate("2025-02-30")).toBeNull();
    });
    it("returns null for null/undefined", () => {
      expect(safeParseDate(null)).toBeNull();
    });
  });

  // =============================================================================
  // DATE ARITHMETIC
  // =============================================================================
  describe("addDayForDisplay", () => {
    it("adds 1 day", () => {
      const start = new Date("2025-01-01T00:00:00Z");
      expect(addDayForDisplay(start).toISOString()).toBe("2025-01-02T00:00:00.000Z");
    });
  });

  describe("subtractDayFromDisplay", () => {
    it("removes 1 day", () => {
      const start = new Date("2025-01-02T00:00:00Z");
      expect(subtractDayFromDisplay(start).toISOString()).toBe(
        "2025-01-01T00:00:00.000Z"
      );
    });
  });

  // =============================================================================
  // DAY BOUNDARIES
  // =============================================================================
  describe("startOfDayUTC", () => {
    it("resets time to 00:00:00", () => {
      const date = new Date("2025-01-01T15:30:45.123Z");
      expect(startOfDayUTC(date).toISOString()).toBe("2025-01-01T00:00:00.000Z");
    });
  });

  describe("endOfDayUTC", () => {
    it("sets time to 23:59:59.999", () => {
      const date = new Date("2025-01-01T05:00:00Z");
      expect(endOfDayUTC(date).toISOString()).toBe("2025-01-01T23:59:59.999Z");
    });
  });
});
