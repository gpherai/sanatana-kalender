import { describe, expect, it, vi, afterEach } from "vitest";
import { todayStr } from "@/services/sadhana-formatters";

describe("sadhana date helpers", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("uses the fixed app timezone for today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-24T22:30:00.000Z"));

    expect(todayStr()).toBe("2026-04-25");
  });
});
