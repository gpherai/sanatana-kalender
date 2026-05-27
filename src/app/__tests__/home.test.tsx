/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { prismaMock } from "@/__tests__/helpers/prisma-mock";
import * as panchangaMod from "@/services/panchanga.service";
import Home from "../page";

vi.mock("@/components/calendar/DharmaCalendar", () => ({
  DharmaCalendar: () => <div data-testid="dharma-calendar" />,
}));

vi.mock("@/components/home/TodayHeroSection", () => ({
  TodayHeroSection: () => <section data-testid="today-hero" />,
}));

vi.mock("@/components/home/UpcomingEventsSection", () => ({
  UpcomingEventsSection: () => <div data-testid="upcoming-events" />,
}));

vi.mock("@/components/home/CategoriesSection", () => ({
  CategoriesSection: () => <div data-testid="categories" />,
}));

vi.mock("@/services/panchanga.service", () => ({
  panchangaService: {
    calculateDaily: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock("@/services/weather.service", () => ({
  getWeatherDashboard: vi.fn().mockResolvedValue(null),
}));

describe("HomePage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-25T10:00:00.000Z"));
    vi.clearAllMocks();

    prismaMock.category.findMany.mockResolvedValue([]);
    prismaMock.eventOccurrence.findMany.mockResolvedValue([]);
    (panchangaMod.panchangaService.calculateDaily as any).mockResolvedValue({});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders all main sections", () => {
    render(Home());
    expect(screen.getByTestId("today-hero")).toBeInTheDocument();
    expect(screen.getByTestId("upcoming-events")).toBeInTheDocument();
    expect(screen.getByTestId("categories")).toBeInTheDocument();
    expect(screen.getByTestId("dharma-calendar")).toBeInTheDocument();
  });

  it("starts all data fetches on render", () => {
    render(Home());
    expect(panchangaMod.panchangaService.calculateDaily).toHaveBeenCalledOnce();
    expect(prismaMock.eventOccurrence.findMany).toHaveBeenCalledOnce();
    expect(prismaMock.category.findMany).toHaveBeenCalledOnce();
  });

  it("queries events with correct date window", () => {
    render(Home());
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
});
