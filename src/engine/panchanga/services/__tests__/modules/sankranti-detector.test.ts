import { describe, it, expect, vi, beforeEach } from "vitest";

const { getSunRashiMock } = vi.hoisted(() => ({
  getSunRashiMock: vi.fn(),
}));

vi.mock("../../modules/rashi-computer", () => ({
  getSunRashi: getSunRashiMock,
}));

vi.mock("swisseph", () => ({
  swe_revjul: () => ({ year: 2025, month: 1, day: 1, hour: 12 }),
  SE_GREG_CAL: 1,
}));

import { detectSankranti } from "../../modules/sankranti-detector";

describe("detectSankranti", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns null when no rashi transition in 24h window", async () => {
    getSunRashiMock.mockResolvedValue(0); // same rashi at start and end
    const result = await detectSankranti(100, "UTC");
    expect(result).toBeNull();
  });

  it("returns null when getSunRashi returns null", async () => {
    getSunRashiMock.mockResolvedValue(null);
    const result = await detectSankranti(100, "UTC");
    expect(result).toBeNull();
  });

  it("detects Vrishabha Sankranti (rashi 0→1 transition)", async () => {
    getSunRashiMock
      .mockResolvedValueOnce(0) // start: Mesha
      .mockResolvedValueOnce(1) // end: Vrishabha
      .mockResolvedValueOnce(0) // binary search mid → lo=mid
      .mockResolvedValue(1); // binary search → hi=mid

    const result = await detectSankranti(100, "UTC");
    expect(result).not.toBeNull();
    expect(result?.sankranti).toBe("VRISHABHA_SANKRANTI");
    expect(typeof result?.time).toBe("string");
  });

  it("returns null during binary search if getSunRashi returns null mid-search", async () => {
    getSunRashiMock
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(1)
      .mockResolvedValue(null); // null mid-search

    const result = await detectSankranti(100, "UTC");
    expect(result).toBeNull();
  });

  it("returns MAKARA_SANKRANTI for rashi 9", async () => {
    getSunRashiMock
      .mockResolvedValueOnce(8) // start: Dhanu
      .mockResolvedValueOnce(9) // end: Makara
      .mockResolvedValueOnce(8)
      .mockResolvedValue(9);

    const result = await detectSankranti(100, "UTC");
    expect(result?.sankranti).toBe("MAKARA_SANKRANTI");
  });
});
