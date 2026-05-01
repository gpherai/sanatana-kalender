import { describe, it, expect } from "vitest";
import { BirthChartService } from "../birth-chart-service";
import type { BirthData } from "../../types";

describe("BirthChartService", () => {
  const service = new BirthChartService();

  const testBirth: BirthData = {
    date: "1987-11-20",
    time: "10:30",
    lat: 52.3676,
    lon: 4.9041,
    tz: "Europe/Amsterdam",
    altitude: 0,
  };

  it("computes a valid birth chart", async () => {
    const chart = await service.compute(testBirth);

    expect(chart).toBeDefined();
    expect(chart.birthData).toEqual(testBirth);
    expect(chart.julianDay).toBeGreaterThan(0);
    expect(chart.ayanamsa.degrees).toBeGreaterThan(20); // Lahiri ayanamsa is > 20 in 1987

    // Check lagna
    expect(chart.lagna).toBeDefined();
    expect(chart.lagna.longitude).toBeGreaterThanOrEqual(0);
    expect(chart.lagna.longitude).toBeLessThan(360);
    expect(chart.lagna.rashi.number).toBeGreaterThanOrEqual(1);
    expect(chart.lagna.rashi.number).toBeLessThanOrEqual(12);

    // Check grahas
    expect(Object.keys(chart.grahas)).toHaveLength(12); // Surya to Pluto + Rahu, Ketu
    expect(chart.grahas.surya).toBeDefined();
    expect(chart.grahas.chandra).toBeDefined();
    expect(chart.grahas.rahu).toBeDefined();
    expect(chart.grahas.ketu).toBeDefined();

    // Verify Ketu is 180 deg from Rahu
    const rahuLon = chart.grahas.rahu.longitude;
    const ketuLon = chart.grahas.ketu.longitude;
    const diff = Math.abs(rahuLon - ketuLon);
    expect(Math.min(diff, 360 - diff)).toBeCloseTo(180, 5);
  });
});
