import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { prismaMock } from "@/__tests__/helpers/prisma-mock";
import { GET, PUT } from "../preferences/route";
import { Prisma } from "@prisma/client";
import { DEFAULT_THEME_NAME } from "@/config/themes";

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
    expect(json.currentTheme).toBe(DEFAULT_THEME_NAME);
    expect(json.timezone).toBeUndefined();
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
      defaultView: "month" as never,
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

  it("rejects payloads with unknown legacy location fields", async () => {
    const request = new NextRequest("http://localhost/api/preferences", {
      method: "PUT",
      body: JSON.stringify({
        currentTheme: "forest-green",
        timezone: "Asia/Kolkata",
        locationName: "Mumbai",
        locationLat: 19.076,
        locationLon: 72.8777,
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await PUT(request);
    // strict schema rejects unknown keys
    expect(response.status).toBe(400);
    expect(prismaMock.userPreference.upsert).not.toHaveBeenCalled();
  });

  it("updates preferences with empty payload (partial update)", async () => {
    prismaMock.userPreference.upsert.mockResolvedValue({
      id: "default",
      currentTheme: DEFAULT_THEME_NAME,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const request = new NextRequest("http://localhost/api/preferences", {
      method: "PUT",
      body: JSON.stringify({}), // Empty but valid
      headers: { "Content-Type": "application/json" },
    });

    const response = await PUT(request);
    expect(response.status).toBe(200);
    expect(prismaMock.userPreference.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          currentTheme: DEFAULT_THEME_NAME, // Default
        }),
        update: expect.objectContaining({
          // No fields should be present in the update object if payload is empty
        }),
      })
    );
  });

  it("handles unexpected DB errors in PUT with generic 500", async () => {
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
    expect(json.message).toBe("Kon voorkeuren niet bijwerken");
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
