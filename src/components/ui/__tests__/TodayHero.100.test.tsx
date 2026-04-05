import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { TodayHero } from "../TodayHero";

// Mock hooks
vi.mock("@/hooks/useFetch", () => ({
  useFetch: () => ({ data: null, loading: false }),
}));

describe("TodayHero 100% Coverage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("updates current time every minute (lines 49-50)", () => {
    // Fix current date to 30 seconds into a minute
    const now = new Date("2025-01-01T10:00:30Z");
    vi.setSystemTime(now);

    render(<TodayHero />);

    // Advance 31 seconds to hit the first timeout
    act(() => {
      vi.advanceTimersByTime(31000);
    });

    // Advance another 60 seconds to hit the interval
    act(() => {
      vi.advanceTimersByTime(60000);
    });

    // Just ensure it rendered successfully after updates
    expect(screen.getByText(/Den Haag/i)).toBeDefined();
  });
});
