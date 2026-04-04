/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { prismaMock } from "@/__tests__/helpers/prisma-mock";
import NewEventPage from "../events/new/page";
import EditEventPage, { generateMetadata } from "../events/[id]/page";

// Mock notFound to throw an error like Next.js does
vi.mock("next/navigation", () => ({
  notFound: vi.fn().mockImplementation(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

// Mock EventForm
const eventFormMock = vi.fn((_props: any) => <div data-testid="event-form" />);
vi.mock("@/components/events/EventForm", () => ({
  EventForm: (props: any) => eventFormMock(props),
}));

describe("Events Pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders NewEventPage", async () => {
    const ui = await NewEventPage();
    render(ui);
    expect(screen.getByText("Nieuw Event")).toBeInTheDocument();
    expect(eventFormMock).toHaveBeenCalledWith(
      expect.objectContaining({ mode: "create" })
    );
  });

  it("renders EditEventPage with full data (covers all branches)", async () => {
    const mockEvent = {
      id: "1",
      name: "Edit Event",
      description: "Desc",
      eventType: "FESTIVAL",
      recurrenceType: "YEARLY_LUNAR",
      tags: ["tag1"],
      categories: [{ categoryId: "cat1", category: { id: "cat1" } }],
      occurrences: [
        {
          date: new Date("2025-01-01"),
          endDate: new Date("2025-01-02"),
          startTime: "10:00",
          endTime: "12:00",
          notes: "Some notes",
        },
      ],
    };

    prismaMock.event.findUnique.mockResolvedValue(mockEvent as any);

    const ui = await EditEventPage({ params: Promise.resolve({ id: "1" }) });
    render(ui);

    expect(screen.getByText("Event Bewerken")).toBeInTheDocument();
    expect(eventFormMock).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "edit",
        initialData: expect.objectContaining({
          name: "Edit Event",
          notes: "Some notes",
          startTime: "10:00",
        }),
      })
    );
  });

  it("renders EditEventPage with minimal data (covers null branches)", async () => {
    const mockEventMinimal = {
      id: "2",
      name: "Minimal Event",
      description: null,
      eventType: "OTHER",
      recurrenceType: "ONCE",
      tags: [],
      categories: [],
      occurrences: [], // firstOccurrence will be undefined
    };

    prismaMock.event.findUnique.mockResolvedValue(mockEventMinimal as any);

    const ui = await EditEventPage({ params: Promise.resolve({ id: "2" }) });
    render(ui);

    expect(eventFormMock).toHaveBeenCalledWith(
      expect.objectContaining({
        initialData: expect.objectContaining({
          date: "",
          notes: "",
        }),
      })
    );
  });

  it("calls notFound when event is missing", async () => {
    prismaMock.event.findUnique.mockResolvedValue(null);
    const { notFound } = await import("next/navigation");

    await expect(
      EditEventPage({ params: Promise.resolve({ id: "999" }) })
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalled();
  });

  it("generates metadata correctly", async () => {
    prismaMock.event.findUnique.mockResolvedValue({ name: "Meta Event" } as any);
    const meta = await generateMetadata({ params: Promise.resolve({ id: "1" }) });
    expect(meta.title).toBe("Meta Event");

    prismaMock.event.findUnique.mockResolvedValue(null);
    const fallbackMeta = await generateMetadata({
      params: Promise.resolve({ id: "999" }),
    });
    expect(fallbackMeta.title).toBe("Event bewerken");
  });
});
