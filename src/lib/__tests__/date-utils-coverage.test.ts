import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isValidDate,
  formatDate,
  formatShortDate,
  formatDateForInput,
  formatDateNL,
  formatLongDate,
  formatRelativeDate,
  formatTimeAgo,
  formatIsoTimeAgo,
} from "../date-utils";

describe("date-utils coverage", () => {
  it("isValidDate validates correctly", () => {
    expect(isValidDate(new Date())).toBe(true);
    expect(isValidDate(new Date("invalid"))).toBe(false);
  });

  it("formatDate handles invalid inputs", () => {
    expect(formatDate(null)).toBe("Geen datum");
    expect(formatDate("invalid")).toBe("Ongeldige datum");
    expect(formatDate(new Date("2024-01-01"))).toMatch(/januari/i);
  });

  it("formatShortDate handles invalid inputs", () => {
    expect(formatShortDate("invalid")).toBe("Ongeldige datum");
    expect(formatShortDate(new Date("2024-01-01"))).toBe("1 jan");
  });

  it("formatDateForInput handles invalid inputs", () => {
    expect(formatDateForInput(null)).toBe("");
    expect(formatDateForInput("invalid")).toBe("");
  });

  it("formatDateNL / formatLongDate handles invalid inputs", () => {
    expect(formatLongDate("invalid")).toBe("Ongeldige datum");
    expect(formatDateNL(new Date("2024-01-01"))).toBe("1 januari");
  });

  describe("formatRelativeDate", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("returns null for past dates", () => {
      expect(formatRelativeDate(new Date("2023-12-31"))).toBeNull();
    });

    it("formats relative dates correctly", () => {
      expect(formatRelativeDate(new Date("2024-01-02"))).toBe("over 1 dag");
      expect(formatRelativeDate(new Date("2024-01-08"))).toBe("over 1 week");
      expect(formatRelativeDate(new Date("2024-02-01"))).toBe("over 4 weken");
      expect(formatRelativeDate(new Date("2025-01-01"))).toBe("over 1 jaar");
    });
  });

  describe("formatTimeAgo / formatIsoTimeAgo", () => {
    const NOW = new Date("2024-01-01T10:00:00Z");

    it("formatTimeAgo handles edge cases", () => {
      expect(formatTimeAgo(null)).toBe("—");
      expect(formatTimeAgo("invalid")).toBe("—");
      // formatTimeAgo uses local date based on NOW
      const nowLocal = new Date(NOW.getTime() + NOW.getTimezoneOffset() * 60000);
      expect(formatTimeAgo("11:00", nowLocal)).toBe("over 1u 0m");
      expect(formatTimeAgo("09:00", nowLocal)).toBe("1u 0m geleden");
    });

    it("formatIsoTimeAgo handles edge cases", () => {
      expect(formatIsoTimeAgo(null)).toBe("—");
      expect(formatIsoTimeAgo("invalid")).toBe("—");
      expect(formatIsoTimeAgo("2024-01-01T12:00:00Z", NOW)).toBe("over 2u 0m");
    });
  });
});
