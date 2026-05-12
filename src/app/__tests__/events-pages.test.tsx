/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { prismaMock } from "@/__tests__/helpers/prisma-mock";
import NewEventPage from "../events/new/page";
import EditEventPage, {
  generateMetadata as generateEditMetadata,
} from "../events/[id]/edit/page";
import EventDetailPage, {
  generateMetadata as generateDetailMetadata,
} from "../events/[id]/page";

// Mock notFound to throw an error like Next.js does
vi.mock("next/navigation", () => ({
  notFound: vi.fn().mockImplementation(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  useRouter: () => ({
    replace: vi.fn(),
    push: vi.fn(),
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
    expect(eventFormMock).toHaveBeenCalled();
    const props = eventFormMock.mock.calls[0]![0];
    expect(props.mode).toBe("create");
  });

  describe("EventDetailPage", () => {
    it("renders detail page with data", async () => {
      prismaMock.event.findUnique.mockResolvedValue({
        id: "1",
        name: "Test Event",
        description: "Desc",
        eventType: "FESTIVAL",
        recurrenceType: "YEARLY_LUNAR",
        tags: ["tag1"],
        categories: [
          { category: { name: "cat1", displayName: "Cat 1", color: "red", icon: "🎉" } },
        ],
        occurrences: [
          {
            date: new Date("2026-01-01"),
            endDate: new Date("2026-01-02"),
            startTime: "10:00",
            endTime: "12:00",
            notes: "Some notes",
          },
        ],
      } as any);

      const ui = await EventDetailPage({ params: Promise.resolve({ id: "1" }) });
      render(ui);

      expect(screen.getByText("Test Event")).toBeInTheDocument();
      expect(screen.getByText("Desc")).toBeInTheDocument();
      expect(screen.getByText("Bewerken")).toBeInTheDocument();
    });

    it("generates detail metadata", async () => {
      prismaMock.event.findUnique.mockResolvedValue({ name: "Meta Event" } as any);
      const meta = await generateDetailMetadata({ params: Promise.resolve({ id: "1" }) });
      expect(meta.title).toBe("Meta Event");
    });
  });

  describe("EditEventPage", () => {
    it("renders EditEventPage with full data", async () => {
      prismaMock.event.findUnique.mockResolvedValue({
        id: "1",
        name: "Edit Event",
        description: "Desc",
        eventType: "FESTIVAL",
        recurrenceType: "YEARLY_LUNAR",
        tags: ["tag1"],
        categories: [
          {
            categoryId: "cat1",
            category: {
              id: "cat1",
              name: "cat1",
              displayName: "Cat 1",
              color: "red",
              icon: null,
            },
          },
        ],
        occurrences: [
          {
            date: new Date("2026-01-01"),
            endDate: new Date("2026-01-02"),
            startTime: "10:00",
            endTime: "12:00",
            notes: "Some notes",
          },
        ],
      } as any);

      const ui = await EditEventPage({ params: Promise.resolve({ id: "1" }) });
      render(ui);

      expect(screen.getByText("Event Bewerken")).toBeInTheDocument();
      expect(eventFormMock).toHaveBeenCalled();
      const props = eventFormMock.mock.calls.find((c: any) => c[0].mode === "edit")![0];
      expect(props.initialData.name).toBe("Edit Event");
      expect(props.initialData.categoryId).toBe("cat1");
      expect(props.initialData.notes).toBe("Some notes");
    });

    it("generates edit metadata", async () => {
      prismaMock.event.findUnique.mockResolvedValue({ name: "Meta Event" } as any);
      const meta = await generateEditMetadata({ params: Promise.resolve({ id: "1" }) });
      expect(meta.title).toBe("Meta Event bewerken");

      prismaMock.event.findUnique.mockResolvedValue(null);
      const fallbackMeta = await generateEditMetadata({
        params: Promise.resolve({ id: "999" }),
      });
      expect(fallbackMeta.title).toBe("Event bewerken");
    });
  });

  it("calls notFound when event is missing", async () => {
    prismaMock.event.findUnique.mockResolvedValue(null);
    const { notFound } = await import("next/navigation");

    await expect(
      EventDetailPage({ params: Promise.resolve({ id: "999" }) })
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalled();
  });
});
