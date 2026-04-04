/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockComputeDaily } = vi.hoisted(() => {
  return { mockComputeDaily: vi.fn() };
});

vi.mock("@/server/panchanga", () => {
  return {
    PanchangaSwissService: class {
      computeDaily = mockComputeDaily;
    },
  };
});

import { panchangaService } from "../panchanga.service";

const MOCK_LOCATION = {
  name: "Den Haag",
  lat: 52.07,
  lon: 4.3,
};

const MOCK_RESULT = { date: "2025-01-01" } as any;

describe("Panchanga Service 100% Coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    panchangaService.clearCache();
    mockComputeDaily.mockResolvedValue(MOCK_RESULT);
  });

  it("covers cache eviction (LRU logic)", async () => {
    const service = panchangaService as any;
    const cache = service.cache as any;

    // Fill up to maxSize - 1
    for (let i = 0; i < 364; i++) {
      cache.cache.set(`key-${i}`, { data: MOCK_RESULT, timestamp: Date.now() });
    }

    expect(panchangaService.getCacheStats().size).toBe(364);

    // Add 365th
    await panchangaService.calculateDaily(new Date("2025-01-01"), MOCK_LOCATION, "UTC");
    expect(panchangaService.getCacheStats().size).toBe(365);

    // Add 366th - should trigger eviction of the oldest (key-0)
    await panchangaService.calculateDaily(new Date("2025-01-02"), MOCK_LOCATION, "UTC");
    expect(panchangaService.getCacheStats().size).toBe(365);
    expect(cache.cache.has("key-0")).toBe(false);
  });

  it("throws error for invalid dates", async () => {
    const invalidDate = new Date("invalid");
    await expect(
      panchangaService.calculateDaily(invalidDate, MOCK_LOCATION, "UTC")
    ).rejects.toThrow("Invalid date");
  });

  it("skips cache for today's date", async () => {
    const today = new Date();

    // First call
    await panchangaService.calculateDaily(today, MOCK_LOCATION, "UTC");
    expect(mockComputeDaily).toHaveBeenCalledTimes(1);

    // Second call - should NOT hit cache because it's today
    await panchangaService.calculateDaily(today, MOCK_LOCATION, "UTC");
    expect(mockComputeDaily).toHaveBeenCalledTimes(2);
  });
});
