import { describe, it, expect, vi } from "vitest";
import { DateTime } from "luxon";

vi.mock("swisseph", () => ({
  swe_revjul: vi.fn((jd: number) => {
    if (jd === 2460000) return { year: 2023, month: 6, day: 1, hour: 12.5 };
    return { year: 2025, month: 1, day: 1, hour: 0 };
  }),
  SE_GREG_CAL: 1,
}));

import {
  norm360,
  getTithiProgress,
  jdToLocal,
  formatTime,
  formatIso,
} from "../../modules/panchanga-utils";

describe("norm360", () => {
  it("keeps value in [0, 360)", () => {
    expect(norm360(0)).toBe(0);
    expect(norm360(180)).toBe(180);
    expect(norm360(359)).toBe(359);
  });

  it("wraps 360 to 0", () => {
    expect(norm360(360)).toBe(0);
    expect(norm360(720)).toBe(0);
  });

  it("handles negative values", () => {
    expect(norm360(-1)).toBe(359);
    expect(norm360(-360)).toBe(0);
    expect(norm360(-180)).toBe(180);
  });
});

describe("getTithiProgress", () => {
  it("returns 0 at new moon (sun == moon longitude)", () => {
    expect(getTithiProgress(0, 0)).toBe(0);
  });

  it("returns 15 at full moon (180° elongation)", () => {
    expect(getTithiProgress(0, 180)).toBe(15);
  });

  it("handles wrap-around correctly", () => {
    // Moon at 5°, Sun at 355° → elongation = 10° → tithi progress = 10/12
    expect(getTithiProgress(355, 5)).toBeCloseTo(10 / 12);
  });

  it("returns value in [0, 30)", () => {
    const result = getTithiProgress(20, 140);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThan(30);
  });
});

describe("jdToLocal", () => {
  it("converts Julian Day to local DateTime", () => {
    const result = jdToLocal(2460000, "UTC");
    expect(result).toBeInstanceOf(DateTime);
    expect(result.year).toBe(2023);
    expect(result.month).toBe(6);
    expect(result.day).toBe(1);
  });

  it("applies timezone", () => {
    const utcResult = jdToLocal(2460000, "UTC");
    const istResult = jdToLocal(2460000, "Asia/Kolkata");
    // IST is UTC+5:30 so hour should differ
    expect(istResult.offset).toBe(330); // +5:30 in minutes
  });
});

describe("formatTime", () => {
  it("returns undefined for null", () => {
    expect(formatTime(null)).toBeUndefined();
  });

  it("formats DateTime as HH:mm:ss", () => {
    const dt = DateTime.fromObject({ hour: 14, minute: 30, second: 5 }, { zone: "UTC" });
    expect(formatTime(dt)).toBe("14:30:05");
  });
});

describe("formatIso", () => {
  it("returns undefined for null", () => {
    expect(formatIso(null)).toBeUndefined();
  });

  it("returns UTC ISO string", () => {
    const dt = DateTime.fromISO("2025-01-06T14:30:00", { zone: "Asia/Kolkata" });
    const result = formatIso(dt);
    expect(result).toBeDefined();
    expect(result).toContain("T");
    expect(result).toContain("Z");
  });
});
