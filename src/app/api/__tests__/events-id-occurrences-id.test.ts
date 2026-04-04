import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { prismaMock } from "@/__tests__/helpers/prisma-mock";
import { PUT } from "../events/[id]/occurrences/[occurrenceId]/route";

/* eslint-disable @typescript-eslint/no-explicit-any */

const VALID_ID = "ckl9z5rte0000s6m1gj8h3x7d";
const VALID_OCCURRENCE_ID = "ckl9z5rte0000s6m1gj8h3x7e";

const MOCK_OCCURRENCE = {
  id: VALID_OCCURRENCE_ID,
  eventId: VALID_ID,
  date: new Date("2025-01-01T00:00:00.000Z"),
  endDate: null,
  startTime: "10:00",
  endTime: "11:00",
  notes: "Original notes",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("PUT /api/events/[id]/occurrences/[occurrenceId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid event IDs", async () => {
    const request = new NextRequest(
      `http://localhost/api/events/bad/occurrences/${VALID_OCCURRENCE_ID}`,
      {
        method: "PUT",
        body: JSON.stringify({ notes: "test" }),
      }
    );

    const response = await PUT(request, {
      params: Promise.resolve({ id: "bad", occurrenceId: VALID_OCCURRENCE_ID }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe("Ongeldig event ID formaat");
  });

  it("rejects invalid occurrence IDs", async () => {
    const request = new NextRequest(
      `http://localhost/api/events/${VALID_ID}/occurrences/bad`,
      {
        method: "PUT",
        body: JSON.stringify({ notes: "test" }),
      }
    );

    const response = await PUT(request, {
      params: Promise.resolve({ id: VALID_ID, occurrenceId: "bad" }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe("Ongeldig occurrence ID formaat");
  });

  it("rejects invalid update payloads", async () => {
    const request = new NextRequest(
      `http://localhost/api/events/${VALID_ID}/occurrences/${VALID_OCCURRENCE_ID}`,
      {
        method: "PUT",
        body: JSON.stringify({ date: "bad-date" }),
      }
    );

    const response = await PUT(request, {
      params: Promise.resolve({ id: VALID_ID, occurrenceId: VALID_OCCURRENCE_ID }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("VALIDATION_ERROR");
  });

  it("returns 404 when occurrence does not exist", async () => {
    prismaMock.eventOccurrence.findUnique.mockResolvedValue(null);

    const request = new NextRequest(
      `http://localhost/api/events/${VALID_ID}/occurrences/${VALID_OCCURRENCE_ID}`,
      {
        method: "PUT",
        body: JSON.stringify({ notes: "test" }),
      }
    );

    const response = await PUT(request, {
      params: Promise.resolve({ id: VALID_ID, occurrenceId: VALID_OCCURRENCE_ID }),
    });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.message).toContain("niet gevonden");
  });

  it("returns 403 when occurrence belongs to another event", async () => {
    prismaMock.eventOccurrence.findUnique.mockResolvedValue({
      ...MOCK_OCCURRENCE,
      eventId: "another-event-id",
    } as any);

    const request = new NextRequest(
      `http://localhost/api/events/${VALID_ID}/occurrences/${VALID_OCCURRENCE_ID}`,
      {
        method: "PUT",
        body: JSON.stringify({ notes: "test" }),
      }
    );

    const response = await PUT(request, {
      params: Promise.resolve({ id: VALID_ID, occurrenceId: VALID_OCCURRENCE_ID }),
    });
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.message).toContain("niet tot dit event");
  });

  it("returns 409 when new date conflicts with existing occurrence", async () => {
    prismaMock.eventOccurrence.findUnique.mockResolvedValue(MOCK_OCCURRENCE as any);
    prismaMock.eventOccurrence.findFirst.mockResolvedValue({ id: "other-occ" } as any);

    const request = new NextRequest(
      `http://localhost/api/events/${VALID_ID}/occurrences/${VALID_OCCURRENCE_ID}`,
      {
        method: "PUT",
        body: JSON.stringify({ date: "2025-01-02" }),
      }
    );

    const response = await PUT(request, {
      params: Promise.resolve({ id: VALID_ID, occurrenceId: VALID_OCCURRENCE_ID }),
    });
    const json = await response.json();

    expect(response.status).toBe(409);
    expect(json.message).toContain("Er bestaat al een occurrence op deze datum");
  });

  it("updates occurrence when everything is valid", async () => {
    prismaMock.eventOccurrence.findUnique.mockResolvedValue(MOCK_OCCURRENCE as any);
    prismaMock.eventOccurrence.findFirst.mockResolvedValue(null);
    prismaMock.eventOccurrence.update.mockResolvedValue({
      ...MOCK_OCCURRENCE,
      notes: "Updated notes",
    } as any);

    const request = new NextRequest(
      `http://localhost/api/events/${VALID_ID}/occurrences/${VALID_OCCURRENCE_ID}`,
      {
        method: "PUT",
        body: JSON.stringify({
          date: "2025-01-02",
          notes: "Updated notes",
          startTime: "12:00",
          endTime: "13:00",
          endDate: "2025-01-03",
        }),
      }
    );

    const response = await PUT(request, {
      params: Promise.resolve({ id: VALID_ID, occurrenceId: VALID_OCCURRENCE_ID }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.notes).toBe("Updated notes");
    expect(prismaMock.eventOccurrence.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: VALID_OCCURRENCE_ID },
        data: expect.objectContaining({
          notes: "Updated notes",
          startTime: "12:00",
          endTime: "13:00",
        }),
      })
    );
  });

  it("returns 500 on database error", async () => {
    prismaMock.eventOccurrence.findUnique.mockRejectedValue(new Error("DB error"));

    const request = new NextRequest(
      `http://localhost/api/events/${VALID_ID}/occurrences/${VALID_OCCURRENCE_ID}`,
      {
        method: "PUT",
        body: JSON.stringify({ notes: "test" }),
      }
    );

    const response = await PUT(request, {
      params: Promise.resolve({ id: VALID_ID, occurrenceId: VALID_OCCURRENCE_ID }),
    });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.message).toContain("Kon occurrence niet bijwerken");
  });

  it("handles resetting endDate to null", async () => {
    prismaMock.eventOccurrence.findUnique.mockResolvedValue(MOCK_OCCURRENCE as any);
    prismaMock.eventOccurrence.update.mockResolvedValue({
      ...MOCK_OCCURRENCE,
      endDate: null,
    } as any);

    const request = new NextRequest(
      `http://localhost/api/events/${VALID_ID}/occurrences/${VALID_OCCURRENCE_ID}`,
      {
        method: "PUT",
        body: JSON.stringify({ endDate: null }),
      }
    );

    await PUT(request, {
      params: Promise.resolve({ id: VALID_ID, occurrenceId: VALID_OCCURRENCE_ID }),
    });

    expect(prismaMock.eventOccurrence.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          endDate: null,
        }),
      })
    );
  });
});
