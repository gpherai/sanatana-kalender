/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { prismaMock } from "@/__tests__/helpers/prisma-mock";
import Home from "../page";

vi.mock("@/components/calendar/DharmaCalendar", () => ({
  DharmaCalendar: () => <div data-testid="dharma-calendar" />,
}));

vi.mock("@/components/ui/TodayHero", () => ({
  TodayHero: () => <section data-testid="today-hero" />,
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
    vi.clearAllMocks();
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
        date: new Date(),
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
  });

  it("renders with no upcoming events", async () => {
    prismaMock.category.findMany.mockResolvedValue([]);
    prismaMock.eventOccurrence.findMany.mockResolvedValue([]);
    const ui = await Home();
    render(ui);
    expect(screen.getByText(/Geen aankomende events/i)).toBeInTheDocument();
  });
});
