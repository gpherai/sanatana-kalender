import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { prismaMock } from "@/__tests__/helpers/prisma-mock";
import { DEFAULT_LOCATION } from "@/lib/domain";
import { GET, PUT } from "../preferences/route";

describe("API Preferences", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns default preferences when none exist", async () => {
    prismaMock.userPreference.findFirst.mockResolvedValue(null);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.id).toBe("default");
    expect(json.currentTheme).toBe("spiritual-minimal");
    expect(json.timezone).toBe(DEFAULT_LOCATION.timezone);
  });

  it("rejects invalid preference updates", async () => {
    const request = new NextRequest("http://localhost/api/preferences", {
      method: "PUT",
      body: JSON.stringify({ defaultView: "invalid_view" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await PUT(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("VALIDATION_ERROR");
  });

  it("updates preferences with valid payload", async () => {
    prismaMock.userPreference.upsert.mockResolvedValue({
      id: "default",
      currentTheme: "forest-green",
      createdAt: new Date(),
      updatedAt: new Date(),
      locationName: "Den Haag",
      locationLat: 52,
      locationLon: 4,
      defaultView: "month" as never,
      timezone: "Europe/Amsterdam",
      visibleEventTypes: [],
      visibleCategories: [],
      notificationsEnabled: false,
      notificationDaysBefore: 1,
    });

    const request = new NextRequest("http://localhost/api/preferences", {
      method: "PUT",
      body: JSON.stringify({ currentTheme: "forest-green" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await PUT(request);
    const json = await response.json();

    expect(prismaMock.userPreference.upsert).toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(json.currentTheme).toBe("forest-green");
  });
});
