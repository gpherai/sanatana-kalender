/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { EventDetailModal } from "../EventDetailModal";

// Mock dependencies
vi.mock("@/components/ui/Toast", () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const MOCK_EVENT = {
  id: "occ_1",
  eventId: "evt_1",
  title: "Test Event",
  start: new Date("2025-01-01T10:00:00Z"),
  end: new Date("2025-01-01T12:00:00Z"),
  allDay: false,
  resource: {
    description: "Test description",
    eventType: "FESTIVAL",
    categories: [
      { id: "cat_1", name: "test", displayName: "Test", color: "red", icon: "🧪" },
    ],
    tithi: "EKADASHI_SHUKLA",
    nakshatra: "ASHWINI",
    maas: "PAUSHA",
    tags: ["test"],
    notes: "Some notes",
    startTime: "10:00",
    endTime: "12:00",
    originalEndDate: new Date("2025-01-01"),
    seriesParentEventIds: ["parent_1"],
    seriesDayNumber: 2,
    hasSeriesChildren: true,
  },
};

describe("EventDetailModal 100% Coverage", () => {
  it("renders parent and child event relations", async () => {
    // Mock the fetch call for relations
    const mockRelations = {
      parentEvents: [{ id: "parent_1", name: "Parent Event" }],
      childEvents: [{ id: "child_1", name: "Child Day 1", dayNumber: 1 }],
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockRelations,
      })
    );

    render(
      <EventDetailModal event={MOCK_EVENT as any} isOpen={true} onClose={vi.fn()} />
    );

    // Wait for async relations to load
    expect(await screen.findByText("Onderdeel van")).toBeDefined();
    expect(screen.getByText("Parent Event")).toBeDefined();
    expect(screen.getByText("1 dagen")).toBeDefined();
    expect(screen.getByText("Child Day 1")).toBeDefined();
  });

  it("handles fetch relations failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
      })
    );

    render(
      <EventDetailModal event={MOCK_EVENT as any} isOpen={true} onClose={vi.fn()} />
    );

    // Just ensure it doesn't crash
    expect(screen.getByText("Test Event")).toBeDefined();
  });
});
