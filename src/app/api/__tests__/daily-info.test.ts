import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { prismaMock } from "@/__tests__/helpers/prisma-mock";
import { DEFAULT_LOCATION } from "@/lib/domain";
import type { DailyPanchangaFull } from "@/engine/panchanga";

const { calculateDaily, calculateRange } = vi.hoisted(() => ({
  calculateDaily: vi.fn(),
  calculateRange: vi.fn(),
}));

vi.mock("@/services/panchanga.service", () => ({
  panchangaService: {
    calculateDaily,
    calculateRange,
  },
}));

import { GET } from "../daily-info/route";

const basePanchanga: DailyPanchangaFull = {
  date: "2025-01-01",
  location: { name: "Test", lat: 1, lon: 2, tz: "UTC" },
  sunriseLocal: "06:00:00",
  sunsetLocal: "18:00:00",
  sunriseUtcIso: "2025-01-01T06:00:00Z",
  sunsetUtcIso: "2025-01-01T18:00:00Z",
  moonriseLocal: "07:00:00",
  moonsetLocal: "19:00:00",
  moonriseUtcIso: "2025-01-01T07:00:00Z",
  moonsetUtcIso: "2025-01-01T19:00:00Z",
  ayanamsa: { id: 1, name: "Lahiri", degrees: 24.1 },
  vara: { name: "Somavara", computedAt: "sunrise" },
  tithi: { number: 1, name: "Pratipada", paksha: "Shukla" },
  nakshatra: { number: 1, name: "Ashwini", pada: 1 },
  yoga: { number: 1, name: "Vishkumbha" },
  karana: { number: 1, name: "Kimstughna", type: "Fixed" },
  moon: { illuminationPct: 10, phaseAngleDeg: 0, waxing: true },
  meta: { engine: "swisseph", flags: ["SEFLG_MOSEPH"], swissephVersion: "2.0.0" },
};

describe("GET /api/daily-info", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.userPreference.findUnique.mockResolvedValue(null);
  });

  it("rejects invalid date formats", async () => {
    const request = new NextRequest("http://localhost/api/daily-info?date=bad-date");

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe("Ongeldige datum formaat. Gebruik YYYY-MM-DD.");
  });

  it("rejects invalid range date formats", async () => {
    const request = new NextRequest(
      "http://localhost/api/daily-info?start=bad&end=2025-01-01"
    );

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe("Ongeldige datum formaat. Gebruik YYYY-MM-DD.");
  });

  it("rejects ranges where start is after end", async () => {
    const request = new NextRequest(
      "http://localhost/api/daily-info?start=2025-02-01&end=2025-01-01"
    );

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe("Startdatum moet voor einddatum liggen.");
  });

  it("returns daily info for a valid date", async () => {
    calculateDaily.mockResolvedValue(basePanchanga);

    const request = new NextRequest("http://localhost/api/daily-info?date=2025-01-01");

    const response = await GET(request);
    const json = await response.json();

    expect(calculateDaily).toHaveBeenCalledWith(
      expect.any(Date),
      expect.objectContaining({
        name: DEFAULT_LOCATION.name,
        lat: DEFAULT_LOCATION.lat,
        lon: DEFAULT_LOCATION.lon,
      }),
      DEFAULT_LOCATION.timezone
    );
    expect(response.status).toBe(200);
    expect(json.date).toBe("2025-01-01");
    expect(json.moonPhasePercent).toBe(10);
  });

  it("uses DEFAULT_LOCATION even when legacy preferences contain another location", async () => {
    prismaMock.userPreference.findUnique.mockResolvedValue({
      id: "default",
      currentTheme: "custom",
      defaultView: "month",
      timezone: "Asia/Kolkata",
      locationName: "Mumbai",
      locationLat: 19.076,
      locationLon: 72.8777,
      visibleEventTypes: [],
      visibleCategories: [],
      notificationsEnabled: false,
      notificationDaysBefore: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);
    calculateDaily.mockResolvedValue(basePanchanga);

    const request = new NextRequest("http://localhost/api/daily-info?date=2025-01-01");

    await GET(request);

    expect(calculateDaily).toHaveBeenCalledWith(
      expect.any(Date),
      expect.objectContaining({
        name: DEFAULT_LOCATION.name,
        lat: DEFAULT_LOCATION.lat,
        lon: DEFAULT_LOCATION.lon,
      }),
      DEFAULT_LOCATION.timezone
    );
  });

  it("returns daily info for a valid range", async () => {
    calculateRange.mockResolvedValue([
      basePanchanga,
      {
        ...basePanchanga,
        date: "2025-01-02",
        moon: { illuminationPct: 25, phaseAngleDeg: 0, waxing: true },
      },
    ]);

    const request = new NextRequest(
      "http://localhost/api/daily-info?start=2025-01-01&end=2025-01-02"
    );

    const response = await GET(request);
    const json = await response.json();

    expect(calculateRange).toHaveBeenCalledWith(
      expect.any(Date),
      expect.any(Date),
      expect.objectContaining({
        name: DEFAULT_LOCATION.name,
        lat: DEFAULT_LOCATION.lat,
        lon: DEFAULT_LOCATION.lon,
      }),
      DEFAULT_LOCATION.timezone
    );
    expect(response.status).toBe(200);
    expect(json).toHaveLength(2);
    expect(json[1].date).toBe("2025-01-02");
  });

  it("identifies Purnima from moonPhaseEvent", async () => {
    calculateDaily.mockResolvedValue({
      ...basePanchanga,
      moonPhaseEvent: {
        type: "full",
        timeLocal: "12:00",
        timeUtcIso: "2025-01-01T12:00:00Z",
      },
    });

    const request = new NextRequest("http://localhost/api/daily-info?date=2025-01-01");
    const response = await GET(request);
    const json = await response.json();

    expect(json.specialDay.type).toBe("purnima");
    expect(json.moonPhaseEvent.type).toBe("full");
  });

  it("identifies Amavasya from moonPhaseEvent", async () => {
    calculateDaily.mockResolvedValue({
      ...basePanchanga,
      moonPhaseEvent: {
        type: "new",
        timeLocal: "12:00",
        timeUtcIso: "2025-01-01T12:00:00Z",
      },
    });

    const request = new NextRequest("http://localhost/api/daily-info?date=2025-01-01");
    const response = await GET(request);
    const json = await response.json();

    expect(json.specialDay.type).toBe("amavasya");
  });

  it("identifies Ekadashi from tithi data", async () => {
    calculateDaily.mockResolvedValue({
      ...basePanchanga,
      tithi: { number: 11, name: "Ekadashi", paksha: "Shukla" },
    });

    const request = new NextRequest("http://localhost/api/daily-info?date=2025-01-01");
    const response = await GET(request);
    const json = await response.json();

    expect(json.specialDay.type).toBe("ekadashi");
  });

  it("returns server error on calculation failure", async () => {
    calculateDaily.mockRejectedValue(new Error("Panchanga calculation failed"));

    const request = new NextRequest("http://localhost/api/daily-info?date=2025-01-01");
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.message).toBe("Kon Panchanga niet berekenen");
  });

  it("uses current date when no parameters are provided", async () => {
    calculateDaily.mockResolvedValue(basePanchanga);

    const request = new NextRequest("http://localhost/api/daily-info");
    const response = await GET(request);
    const json = await response.json();

    expect(calculateDaily).toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(json.date).toBeDefined();
  });

  it("rejects ranges longer than 90 days", async () => {
    const request = new NextRequest(
      "http://localhost/api/daily-info?start=2025-01-01&end=2025-04-15"
    );

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe("Maximum bereik is 90 dagen.");
    expect(calculateRange).not.toHaveBeenCalled();
  });

  it("returns daily info with all optional fields mapped", async () => {
    const fullPanchanga: DailyPanchangaFull = {
      ...basePanchanga,
      maas: {
        name: "PHALGUNA",
        type: "Purnimanta",
        lunarDay: 14,
        paksha: "Krishna",
        isAdhika: false,
      },
      vikramaSamvat: { year: 2082, name: "Krodhi" },
      samvatsara: { name: "Krodhi", number: 38 },
      shakaSamvat: { year: 1947, name: "Vishvavasu" },
      sunSign: {
        number: 11,
        name: "Kumbha",
        uptoLocal: "10:00",
        uptoUtcIso: "2025-01-01T10:00:00Z",
      },
      moonSign: {
        number: 9,
        name: "Dhanu",
        uptoLocal: "11:00",
        uptoUtcIso: "2025-01-01T11:00:00Z",
      },
      pravishte: {
        daysSinceSankranti: 15,
        currentRashi: "Dhanu",
        lastSankrantiDate: "2024-12-16",
      },
      nextTithi: {
        number: 2,
        name: "Dwitiya",
        paksha: "Shukla",
        endLocal: "08:00",
        endUtcIso: "2025-01-02T08:00:00Z",
      },
      nextNakshatra: {
        number: 2,
        name: "Bharani",
        pada: 1,
        endLocal: "09:00",
        endUtcIso: "2025-01-02T09:00:00Z",
      },
      nextYoga: {
        number: 2,
        name: "Atiganda",
        endLocal: "10:00",
        endUtcIso: "2025-01-02T10:00:00Z",
      },
      nextKarana: {
        number: 2,
        name: "Bava",
        type: "Movable",
        endLocal: "11:00",
        endUtcIso: "2025-01-02T11:00:00Z",
      },
    };
    calculateDaily.mockResolvedValue(fullPanchanga);

    const request = new NextRequest("http://localhost/api/daily-info?date=2025-01-01");
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.maas.name).toBe("PHALGUNA");
    expect(json.sunSign.name).toBe("Kumbha");
    expect(json.nextTithi.name).toBe("Dwitiya");
    expect(json.pravishte.daysSinceSankranti).toBe(15);
  });
});
