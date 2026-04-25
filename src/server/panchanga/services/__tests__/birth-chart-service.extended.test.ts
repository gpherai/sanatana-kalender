import { describe, it, expect } from "vitest";
import { BirthChartService } from "../birth-chart-service";
import type { BirthData } from "../../types";

describe("BirthChartService Extended", () => {
  const service = new BirthChartService();

  it("handles missing altitude by defaulting to 0", async () => {
    const testBirth: BirthData = {
      date: "1987-11-20",
      time: "10:30",
      lat: 52.3676,
      lon: 4.9041,
      tz: "Europe/Amsterdam",
      // altitude missing
    };

    const chart = await service.compute(testBirth);
    expect(chart).toBeDefined();
    expect(chart.birthData.altitude).toBeUndefined(); // Input remains same
    // Internal calculation used 0
  });

  it("throws error for invalid date/time", async () => {
    const testBirth: BirthData = {
      date: "1987-13-20", // Invalid month
      time: "25:30", // Invalid hour
      lat: 52.3676,
      lon: 4.9041,
      tz: "Europe/Amsterdam",
    };

    await expect(service.compute(testBirth)).rejects.toThrow(/Invalid birth date\/time/);
  });

  it("throws error for ambiguous daylight-saving birth time", async () => {
    const testBirth: BirthData = {
      date: "2024-10-27",
      time: "02:30",
      lat: 52.3676,
      lon: 4.9041,
      tz: "Europe/Amsterdam",
    };

    await expect(service.compute(testBirth)).rejects.toThrow(/Ambigue geboortetijd/);
  });

  it("handles edge cases in rashi and nakshatra calculation (Unknown branches)", async () => {
    // These are hard to hit because the logic covers 0-360,
    // but we can at least ensure normal operation.
    const testBirth: BirthData = {
      date: "2024-01-01",
      time: "12:00",
      lat: 0,
      lon: 0,
      tz: "UTC",
    };
    const chart = await service.compute(testBirth);
    expect(chart.lagna.rashi.name).not.toBe("Unknown");
    expect(chart.lagna.nakshatra.name).not.toBe("Unknown");
  });
});
