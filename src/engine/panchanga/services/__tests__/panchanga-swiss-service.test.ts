import { DateTime } from "luxon";
import { describe, it, expect, beforeEach, vi } from "vitest";

 

const {
  calculateSunriseSunset,
  calculateMoonriseMoonset,
  sweCalcUt,
  swePhenoUt,
  sweJulday,
  findEventEnd,
  getAyanamsa,
  revjulMap,
  sweSetSidMode,
} = vi.hoisted(() => {
  const calculateSunriseSunset = vi.fn();
  const calculateMoonriseMoonset = vi.fn();
  const sweCalcUt = vi.fn();
  const swePhenoUt = vi.fn();
  const sweJulday = vi.fn().mockResolvedValue(100);
  const findEventEnd = vi.fn(async (startJD, getVal) => {
    if (getVal) {
      await getVal(startJD);
    }
    return startJD + 0.1;
  });
  const getAyanamsa = vi.fn();
  const revjulMap = new Map<
    number,
    { year: number; month: number; day: number; hour: number }
  >();
  const sweSetSidMode = vi.fn();

  return {
    calculateSunriseSunset,
    calculateMoonriseMoonset,
    sweCalcUt,
    swePhenoUt,
    sweJulday,
    findEventEnd,
    getAyanamsa,
    revjulMap,
    sweSetSidMode,
  };
});

vi.mock("../../utils/astro", () => ({
  calculateSunriseSunset,
  calculateMoonriseMoonset,
  swe_calc_ut: sweCalcUt,
  swe_pheno_ut: swePhenoUt,
  swe_julday: sweJulday,
  findEventEnd,
  getAyanamsa,
  EPHE_PATH: "/mock/ephe",
}));

vi.mock("swisseph", () => ({
  swe_set_ephe_path: vi.fn(),
  swe_set_sid_mode: sweSetSidMode,
  swe_revjul: (jd: number) =>
    revjulMap.get(jd) ?? { year: 2025, month: 1, day: 1, hour: 0 },
  SE_SIDM_LAHIRI: 1,
  SE_GREG_CAL: 1,
  SE_SUN: 0,
  SE_MOON: 1,
  SEFLG_SWIEPH: 2,
  SEFLG_SIDEREAL: 64,
  SEFLG_MOSEPH: 4,
  SEFLG_SPEED: 256,
}));

// Mock the extracted modules so orchestration test remains fast and focused
vi.mock("../modules/maas-detector", () => ({
  computeMaasData: vi.fn(),
}));

vi.mock("../modules/sankranti-detector", () => ({
  detectSankranti: vi.fn(),
}));

vi.mock("../modules/moon-phase-detector", () => ({
  detectMoonPhaseEvent: vi.fn(),
}));

import { PanchangaSwissService } from "../panchanga-swiss-service";
import { computeMaasData } from "../modules/maas-detector";
import { detectSankranti } from "../modules/sankranti-detector";
import { detectMoonPhaseEvent } from "../modules/moon-phase-detector";

describe("PanchangaSwissService", () => {
  const location = { name: "Test", lat: 1, lon: 2, tz: "UTC" };

  beforeEach(() => {
    vi.clearAllMocks();
    revjulMap.clear();

    // Default module mocks
    vi.mocked(computeMaasData).mockResolvedValue({
      maasIdx: 4,
      lunarMaasName: "Jyeshtha",
      lunarDay: 26,
      isAdhika: true,
    });
    vi.mocked(detectSankranti).mockResolvedValue(null);
    vi.mocked(detectMoonPhaseEvent).mockResolvedValue(null);
  });

  it("maps computed values into panchanga response", async () => {
    calculateSunriseSunset
      .mockResolvedValueOnce({
        sunriseJD: 100,
        sunsetJD: 200,
        sunriseTime: DateTime.fromISO("2025-01-06T06:00:00", { zone: "UTC" }),
        sunsetTime: DateTime.fromISO("2025-01-06T18:00:00", { zone: "UTC" }),
      })
      .mockResolvedValueOnce({
        sunriseJD: 110,
        sunsetJD: 210,
        sunriseTime: DateTime.fromISO("2025-01-07T06:00:00", { zone: "UTC" }),
        sunsetTime: DateTime.fromISO("2025-01-07T18:00:00", { zone: "UTC" }),
      });

    calculateMoonriseMoonset.mockResolvedValue({
      moonriseJD: 101,
      moonsetJD: 201,
      moonriseTime: DateTime.fromISO("2025-01-06T07:00:00", { zone: "UTC" }),
      moonsetTime: DateTime.fromISO("2025-01-06T19:00:00", { zone: "UTC" }),
    });

    sweCalcUt
      .mockResolvedValueOnce({ longitude: 20, latitude: 0, distance: 1, speed: 0 })
      .mockResolvedValueOnce({ longitude: 140, latitude: 0, distance: 1, speed: 0 })
      // First 4 callbacks (T, N, Y, K)
      .mockResolvedValueOnce({ longitude: 20, latitude: 0, distance: 1, speed: 0 })
      .mockResolvedValueOnce({ longitude: 140, latitude: 0, distance: 1, speed: 0 })
      .mockResolvedValueOnce({ longitude: 140, latitude: 0, distance: 1, speed: 0 })
      .mockResolvedValueOnce({ longitude: 20, latitude: 0, distance: 1, speed: 0 })
      .mockResolvedValueOnce({ longitude: 140, latitude: 0, distance: 1, speed: 0 })
      .mockResolvedValueOnce({ longitude: 20, latitude: 0, distance: 1, speed: 0 })
      .mockResolvedValueOnce({ longitude: 140, latitude: 0, distance: 1, speed: 0 })
      // Next 4 callbacks (next T, next N, next Y, next K)
      .mockResolvedValueOnce({ longitude: 20, latitude: 0, distance: 1, speed: 0 })
      .mockResolvedValueOnce({ longitude: 140, latitude: 0, distance: 1, speed: 0 })
      .mockResolvedValueOnce({ longitude: 140, latitude: 0, distance: 1, speed: 0 })
      .mockResolvedValueOnce({ longitude: 20, latitude: 0, distance: 1, speed: 0 })
      .mockResolvedValueOnce({ longitude: 140, latitude: 0, distance: 1, speed: 0 })
      .mockResolvedValueOnce({ longitude: 20, latitude: 0, distance: 1, speed: 0 })
      .mockResolvedValueOnce({ longitude: 140, latitude: 0, distance: 1, speed: 0 })
      .mockResolvedValue({ longitude: 20, latitude: 0, distance: 1, speed: 0 });
    swePhenoUt.mockResolvedValue({ phaseAngle: 90, phaseIllum: 0.42 });

    findEventEnd
      .mockImplementationOnce(async (jd, getVal) => {
        await getVal(jd);
        return 100.1;
      })
      .mockImplementationOnce(async (jd, getVal) => {
        await getVal(jd);
        return 100.2;
      })
      .mockImplementationOnce(async (jd, getVal) => {
        await getVal(jd);
        return 100.3;
      })
      .mockImplementationOnce(async (jd, getVal) => {
        await getVal(jd);
        return 100.4;
      })
      .mockImplementationOnce(async (jd, getVal) => {
        await getVal(jd);
        return 100.5;
      })
      .mockImplementationOnce(async (jd, getVal) => {
        await getVal(jd);
        return 100.6;
      })
      .mockImplementationOnce(async (jd, getVal) => {
        await getVal(jd);
        return 100.7;
      })
      .mockImplementationOnce(async (jd, getVal) => {
        await getVal(jd);
        return 100.8;
      });
    getAyanamsa.mockResolvedValue(24.1);

    revjulMap.set(100.1, { year: 2025, month: 1, day: 6, hour: 12.5 });
    revjulMap.set(100.2, { year: 2025, month: 1, day: 6, hour: 13 });
    revjulMap.set(100.3, { year: 2025, month: 1, day: 6, hour: 14 });
    revjulMap.set(100.4, { year: 2025, month: 1, day: 6, hour: 15 });
    revjulMap.set(100.5, { year: 2025, month: 1, day: 6, hour: 16 });
    revjulMap.set(100.6, { year: 2025, month: 1, day: 6, hour: 17 });
    revjulMap.set(100.7, { year: 2025, month: 1, day: 6, hour: 18 });
    revjulMap.set(100.8, { year: 2025, month: 1, day: 6, hour: 19 });

    const service = new PanchangaSwissService();
    const result = await service.computeDaily("2025-01-06", location);

    expect(result.date).toBe("2025-01-06");
    expect(result.maas?.isAdhika).toBe(true);
    expect(result.maas?.name).toBe("Jyeshtha");
    expect(result.sunriseLocal).toBe("06:00:00");
    expect(result.sunsetLocal).toBe("18:00:00");
    expect(result.moonriseLocal).toBe("07:00:00");
    expect(result.moonsetLocal).toBe("19:00:00");
    expect(result.vara.name).toBe("Somavara");
    expect(result.tithi).toEqual(
      expect.objectContaining({
        number: 11,
        name: "Ekadashi",
        paksha: "Shukla",
        endLocal: "12:30:00",
      })
    );
    expect(result.nakshatra).toEqual(
      expect.objectContaining({
        number: 11,
        name: "Purva Phalguni",
        pada: 2,
        endLocal: "13:00:00",
      })
    );
    expect(result.yoga).toEqual(
      expect.objectContaining({
        number: 13,
        name: "Vyaghata",
        endLocal: "14:00:00",
      })
    );
    expect(result.karana).toEqual(
      expect.objectContaining({
        number: 21,
        name: "Vanija",
        type: "Movable",
        endLocal: "15:00:00",
      })
    );
    expect(result.moon).toEqual(
      expect.objectContaining({
        illuminationPct: 42,
        phaseAngleDeg: 90,
        waxing: true,
      })
    );
    expect(result.rahuKalam).toEqual({ startLocal: "07:30", endLocal: "09:00" });
    expect(result.yamagandam).toEqual({ startLocal: "10:30", endLocal: "12:00" });
    expect(result.ayanamsa.degrees).toBe(24.1);

    expect(sweCalcUt).toHaveBeenCalledWith(100, 0, expect.any(Number)); // Sun at sunrise
    expect(sweCalcUt).toHaveBeenCalledWith(100, 1, expect.any(Number)); // Moon at sunrise
    expect(swePhenoUt).toHaveBeenCalledWith(100, 1, expect.any(Number));
    expect(getAyanamsa).toHaveBeenCalledWith(100);
    expect(sweSetSidMode).toHaveBeenCalled();
  });

  it("calculates values for Krishna paksha and fixed karana", async () => {
    calculateSunriseSunset.mockResolvedValue({
      sunriseJD: 100,
      sunsetJD: 200,
      sunriseTime: DateTime.fromISO("2025-01-06T06:00:00", { zone: "UTC" }),
      sunsetTime: DateTime.fromISO("2025-01-06T18:00:00", { zone: "UTC" }),
    });
    calculateMoonriseMoonset.mockResolvedValue({
      moonriseJD: 101,
      moonsetJD: 201,
      moonriseTime: DateTime.fromISO("2025-01-06T07:00:00", { zone: "UTC" }),
      moonsetTime: DateTime.fromISO("2025-01-06T19:00:00", { zone: "UTC" }),
    });

    // Tithi 30 (Krishna Amavasya), fixed karana (Naga = index 60)
    sweCalcUt
      .mockResolvedValueOnce({ longitude: 0, latitude: 0, distance: 1, speed: 0 }) // Sun at sunrise
      .mockResolvedValueOnce({ longitude: 355.2, latitude: 0, distance: 1, speed: 0 }) // Moon (e=355.2 -> tithi 29.6 -> tithiIdx 30)
      .mockResolvedValue({ longitude: 0, latitude: 0, distance: 1, speed: 0 }); // Others

    swePhenoUt.mockResolvedValue({ phaseAngle: 5, phaseIllum: 0.99 });
    findEventEnd.mockResolvedValue(null);
    getAyanamsa.mockResolvedValue(24.1);

    vi.mocked(computeMaasData).mockResolvedValue({
      maasIdx: 3,
      lunarMaasName: "Chaitra",
      lunarDay: 15,
      isAdhika: false,
    });

    const service = new PanchangaSwissService();
    const result = await service.computeDaily("2025-01-06", location);

    expect(result.tithi.paksha).toBe("Krishna");
    expect(result.karana.name).toBe("Naga");
    expect(result.karana.type).toBe("Fixed");
    expect(result.maas?.isAdhika).toBe(false);
  });

  it("uses fixed karana when index falls on fixed values", async () => {
    calculateSunriseSunset.mockResolvedValue({
      sunriseJD: 10,
      sunsetJD: 20,
      sunriseTime: DateTime.fromISO("2025-01-05T06:00:00", { zone: "UTC" }),
      sunsetTime: DateTime.fromISO("2025-01-05T18:00:00", { zone: "UTC" }),
    });
    calculateMoonriseMoonset.mockResolvedValue({
      moonriseJD: 11,
      moonsetJD: 21,
      moonriseTime: DateTime.fromISO("2025-01-05T07:00:00", { zone: "UTC" }),
      moonsetTime: DateTime.fromISO("2025-01-05T19:00:00", { zone: "UTC" }),
    });

    sweCalcUt
      .mockResolvedValueOnce({ longitude: 50, latitude: 0, distance: 1, speed: 0 })
      .mockResolvedValueOnce({ longitude: 50, latitude: 0, distance: 1, speed: 0 })
      .mockResolvedValue({ longitude: 50, latitude: 0, distance: 1, speed: 0 });
    swePhenoUt.mockResolvedValue({ phaseAngle: 45, phaseIllum: 0.1 });

    findEventEnd.mockImplementation(async (jd, getVal) => {
      if (getVal) await getVal(jd);
      return null;
    });
    getAyanamsa.mockResolvedValue(24.5);

    const service = new PanchangaSwissService();
    const result = await service.computeDaily("2025-01-05", location);

    expect(result.karana).toEqual(
      expect.objectContaining({
        number: 1,
        name: "Kimstughna",
        type: "Fixed",
      })
    );
    expect(result.karana.endLocal).toBeUndefined();
    expect(findEventEnd).toHaveBeenCalled();
  });
});
