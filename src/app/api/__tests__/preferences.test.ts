import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { prismaMock } from "@/__tests__/helpers/prisma-mock";
import { DEFAULT_LOCATION } from "@/lib/domain";
import { GET, PUT } from "../preferences/route";
import { Prisma } from "@prisma/client";

/* eslint-disable @typescript-eslint/no-explicit-any */

describe("API Preferences", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns default preferences when none exist", async () => {
    prismaMock.userPreference.findUnique.mockResolvedValue(null);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.id).toBe("default");
    expect(json.currentTheme).toBe("spiritual-minimal");
    expect(json.timezone).toBe(DEFAULT_LOCATION.timezone);
  });

  it("returns existing preferences when found", async () => {
    prismaMock.userPreference.findUnique.mockResolvedValue({
      id: "default",
      currentTheme: "custom",
    } as any);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.currentTheme).toBe("custom");
  });

  it("returns 500 when GET fails", async () => {
    prismaMock.userPreference.findUnique.mockRejectedValue(new Error("DB error"));

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.message).toBe("Kon voorkeuren niet ophalen");
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

  it("handles Prisma P2002 error in PUT", async () => {
    const error = new Prisma.PrismaClientKnownRequestError("Conflict", {
      code: "P2002",
      clientVersion: "5.0.0",
    });
    prismaMock.userPreference.upsert.mockRejectedValue(error);

    const request = new NextRequest("http://localhost/api/preferences", {
      method: "PUT",
      body: JSON.stringify({ currentTheme: "forest-green" }),
    });

    const response = await PUT(request);
    const json = await response.json();
    expect(response.status).toBe(500);
    expect(json.message).toBe("Voorkeuren bestaan al");
  });

  it("returns 500 when PUT fails with unknown error", async () => {
    prismaMock.userPreference.upsert.mockRejectedValue(new Error("DB error"));

    const request = new NextRequest("http://localhost/api/preferences", {
      method: "PUT",
      body: JSON.stringify({ currentTheme: "forest-green" }),
    });

    const response = await PUT(request);
    const json = await response.json();
    expect(response.status).toBe(500);
    expect(json.message).toBe("Kon voorkeuren niet bijwerken");
  });
});
