import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { prismaMock } from "@/__tests__/helpers/prisma-mock";
import { formatDateLocal } from "@/lib/date-utils";
import { GET, POST } from "../events/route";
import { Prisma } from "@prisma/client";

/* eslint-disable @typescript-eslint/no-explicit-any */

describe("API Events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid query parameters", async () => {
    const request = new NextRequest("http://localhost/api/events?start=bad-date");

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("VALIDATION_ERROR");
  });

  it("returns calendar events for valid query", async () => {
    const occurrenceDate = new Date(2025, 0, 1);
    prismaMock.eventOccurrence.findMany.mockResolvedValue([
      {
        id: "occ_1",
        date: occurrenceDate,
        endDate: null,
        startTime: "09:00",
        endTime: "10:00",
        notes: "note",
        eventId: "evt_1",
        event: {
          id: "evt_1",
          name: "Test Event",
          description: null,
          eventType: "FESTIVAL",
          categories: [
            {
              categoryId: "cat_1",
              category: {
                id: "cat_1",
                name: "ganesha",
                displayName: "Ganesha",
                icon: "🐘",
                color: "#fff",
              },
            },
          ],
          tithi: null,
          nakshatra: null,
          maas: null,
          tags: [],
          seriesParentEntries: [],
          seriesChildEntries: [],
        },
      },
    ] as never);

    const request = new NextRequest(
      "http://localhost/api/events?start=2025-01-01&end=2025-01-02"
    );

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toHaveLength(1);
    expect(json[0].eventId).toBe("evt_1");
    expect(json[0].start).toBe(formatDateLocal(occurrenceDate));
    expect(json[0].resource.eventType).toBe("FESTIVAL");
  });

  it("handles complex query parameters", async () => {
    prismaMock.eventOccurrence.findMany.mockResolvedValue([]);

    const request = new NextRequest(
      "http://localhost/api/events?categories=cat1,cat2&types=FESTIVAL,PUJA&tithis=PURNIMA&search=holi&sortBy=name&order=desc"
    );

    const response = await GET(request);
    expect(response.status).toBe(200);
    expect(prismaMock.eventOccurrence.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ event: { name: "desc" } }],
      })
    );
  });

  it("returns server error when GET fails", async () => {
    prismaMock.eventOccurrence.findMany.mockRejectedValue(new Error("DB error"));

    const request = new NextRequest("http://localhost/api/events");
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.message).toBe("Kon events niet ophalen");
  });

  it("rejects invalid event payloads", async () => {
    const request = new NextRequest("http://localhost/api/events", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("VALIDATION_ERROR");
  });

  it("creates an event with an initial occurrence", async () => {
    prismaMock.$transaction.mockImplementation(async (operation) => {
      if (typeof operation === "function") {
        return operation(prismaMock);
      }
      return [];
    });
    prismaMock.event.create.mockResolvedValue({ id: "evt_1" } as never);
    prismaMock.eventOccurrence.create.mockResolvedValue({ id: "occ_1" } as never);

    const request = new NextRequest("http://localhost/api/events", {
      method: "POST",
      body: JSON.stringify({
        name: "Test Event",
        eventType: "FESTIVAL",
        date: "2025-01-01",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const json = await response.json();

    expect(prismaMock.event.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "Test Event",
          eventType: "FESTIVAL",
        }),
      })
    );
    expect(prismaMock.eventOccurrence.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventId: "evt_1",
          date: new Date(2025, 0, 1),
        }),
      })
    );
    expect(response.status).toBe(201);
    expect(json.id).toBe("evt_1");
  });

  it("creates an event with categoryId", async () => {
    const VALID_CAT_ID = "ckl9z5rte0000s6m1gj8h3x7c";
    prismaMock.$transaction.mockImplementation(async (operation) => {
      if (typeof operation === "function") {
        return operation(prismaMock);
      }
      return [];
    });
    prismaMock.category.findUnique.mockResolvedValue({ id: VALID_CAT_ID } as any);
    prismaMock.event.create.mockResolvedValue({ id: "evt_1" } as any);

    const request = new NextRequest("http://localhost/api/events", {
      method: "POST",
      body: JSON.stringify({
        name: "Cat Event",
        eventType: "FESTIVAL",
        date: "2025-01-01",
        categoryId: VALID_CAT_ID,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);
    expect(prismaMock.eventCategory.create).toHaveBeenCalled();
  });

  it("rejects unknown category IDs", async () => {
    prismaMock.category.findUnique.mockResolvedValue(null);

    const request = new NextRequest("http://localhost/api/events", {
      method: "POST",
      body: JSON.stringify({
        name: "Test Event",
        eventType: "FESTIVAL",
        date: "2025-01-01",
        categoryId: "ckl9z5rte0000s6m1gj8h3x7d",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe("Categorie niet gevonden");
  });

  it("handles Prisma unique constraint error", async () => {
    const error = new Prisma.PrismaClientKnownRequestError("Conflict", {
      code: "P2002",
      clientVersion: "5.0.0",
    });
    prismaMock.$transaction.mockRejectedValue(error);

    const request = new NextRequest("http://localhost/api/events", {
      method: "POST",
      body: JSON.stringify({
        name: "Conflict Event",
        eventType: "FESTIVAL",
        date: "2025-01-01",
      }),
    });

    const response = await POST(request);
    const json = await response.json();
    expect(response.status).toBe(409);
    expect(json.message).toContain("Er bestaat al een event");
  });

  it("handles Prisma foreign key constraint error", async () => {
    const error = new Prisma.PrismaClientKnownRequestError("FK failed", {
      code: "P2003",
      clientVersion: "5.0.0",
    });
    prismaMock.$transaction.mockRejectedValue(error);

    const request = new NextRequest("http://localhost/api/events", {
      method: "POST",
      body: JSON.stringify({
        name: "FK Event",
        eventType: "FESTIVAL",
        date: "2025-01-01",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("handles Prisma record not found error", async () => {
    const error = new Prisma.PrismaClientKnownRequestError("Not found", {
      code: "P2025",
      clientVersion: "5.0.0",
    });
    prismaMock.$transaction.mockRejectedValue(error);

    const request = new NextRequest("http://localhost/api/events", {
      method: "POST",
      body: JSON.stringify({
        name: "Missing Event",
        eventType: "FESTIVAL",
        date: "2025-01-01",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(404);
  });

  it("returns server error when POST fails with unknown error", async () => {
    prismaMock.$transaction.mockRejectedValue(new Error("Unknown error"));

    const request = new NextRequest("http://localhost/api/events", {
      method: "POST",
      body: JSON.stringify({
        name: "Fail Event",
        eventType: "FESTIVAL",
        date: "2025-01-01",
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.message).toBe("Kon event niet aanmaken");
  });
});
