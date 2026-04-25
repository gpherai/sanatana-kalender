/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { prismaMock } from "@/__tests__/helpers/prisma-mock";
import Home from "../page";

vi.mock("@/components/calendar/DharmaCalendar", () => ({
  DharmaCalendar: () => <div data-testid="dharma-calendar" />,
}));

vi.mock("@/components/ui/TodayHero", () => ({
  TodayHero: ({ todayEvents }: { todayEvents: Array<{ id: string; name: string }> }) => (
    <section data-testid="today-hero">
      {todayEvents.map((event) => (
        <span key={event.id}>Vandaag: {event.name}</span>
      ))}
    </section>
  ),
}));

vi.mock("@/services/panchanga.service", () => ({
  panchangaService: {
    calculateDaily: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock("@/lib/api-transformers", () => ({
  transformToApiResponse: vi.fn().mockReturnValue({}),
}));

vi.mock("@/services/weather.service", () => ({
  getWeatherDashboard: vi.fn().mockResolvedValue(null),
}));

describe("HomePage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-25T10:00:00.000Z"));
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders with categories and events", async () => {
    prismaMock.category.findMany.mockResolvedValue([
      {
        id: "1",
        name: "ganesha & shiva",
        displayName: "Ganesha & Shiva",
        icon: "🐘",
        color: "red",
      },
    ] as any);

    prismaMock.eventOccurrence.findMany.mockResolvedValue([
      {
        id: "occ_1",
        date: new Date("2026-04-25T00:00:00.000Z"),
        endDate: null,
        event: {
          id: "evt_1",
          name: "Test Event",
          eventType: "VRAT",
          categories: [{ category: { icon: null } }], // trigger fallback 📅
        },
      },
    ] as any);

    const ui = await Home();
    render(ui);

    expect(screen.getByText("Ganesha & Shiva")).toBeInTheDocument();
    expect(screen.getByText("Test Event")).toBeInTheDocument();
    expect(screen.getByText("Vrat (Fasting)")).toBeInTheDocument();
    expect(screen.getByText("📅")).toBeInTheDocument();
    expect(screen.getByTitle("Filter op Ganesha & Shiva")).toHaveAttribute(
      "href",
      "/events?categories=ganesha%20%26%20shiva"
    );
    expect(prismaMock.eventOccurrence.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({
              date: expect.objectContaining({
                lte: new Date("2026-05-01T21:59:59.999Z"),
              }),
            }),
          ]),
        }),
      })
    );
  });

  it("renders with no upcoming events", async () => {
    prismaMock.category.findMany.mockResolvedValue([]);
    prismaMock.eventOccurrence.findMany.mockResolvedValue([]);
    const ui = await Home();
    render(ui);
    expect(screen.getByText(/Geen aankomende events/i)).toBeInTheDocument();
  });

  it("passes ongoing multi-day events to the TodayHero", async () => {
    prismaMock.category.findMany.mockResolvedValue([]);
    prismaMock.eventOccurrence.findMany.mockResolvedValue([
      {
        id: "occ_ongoing",
        date: new Date("2026-04-24T00:00:00.000Z"),
        endDate: new Date("2026-04-26T00:00:00.000Z"),
        event: {
          id: "evt_ongoing",
          name: "Doorlopende Vrat",
          eventType: "VRAT",
          categories: [],
        },
      },
    ] as any);

    const ui = await Home();
    render(ui);

    expect(screen.getByText("Vandaag: Doorlopende Vrat")).toBeInTheDocument();
  });
});
