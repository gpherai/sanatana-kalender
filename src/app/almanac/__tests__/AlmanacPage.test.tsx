/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import AlmanacPage from "../page";

const mockUseFetch = vi.fn();
vi.mock("@/hooks/useFetch", () => ({
  useFetch: (url: string) => mockUseFetch(url),
}));

vi.mock("@/components/layout", () => ({
  PageLayout: ({ children }: any) => <div data-testid="page-layout">{children}</div>,
}));

vi.mock("@/components/almanac", () => ({
  AlmanacHeader: ({ location }: any) => <div data-testid="header">{location}</div>,
  AlmanacFilters: ({
    onToggleFilter,
    onYearChange,
    onMonthChange,
    showMoonPhases,
    showSpecialDays,
    showEvents,
  }: any) => (
    <div data-testid="filters">
      <button onClick={() => onToggleFilter("moonPhases")}>Toggle Moon</button>
      <button onClick={() => onToggleFilter("specialDays")}>Toggle Special</button>
      <button onClick={() => onToggleFilter("events")}>Toggle Events</button>
      <button onClick={() => onYearChange(2026)}>Set Year</button>
      <button onClick={() => onMonthChange(5)}>Set Month</button>
      <div data-testid="filter-status">
        {showMoonPhases ? "Moon ON" : "Moon OFF"}
        {showSpecialDays ? "Special ON" : "Special OFF"}
        {showEvents ? "Events ON" : "Events OFF"}
      </div>
    </div>
  ),
  MoonPhasesTimeline: ({ onSelectDate }: any) => (
    <div
      data-testid="moon-timeline"
      onClick={() => onSelectDate(new Date("2025-01-15"))}
    />
  ),
  MonthGrid: ({ onSelectDate }: any) => (
    <div data-testid="grid" onClick={() => onSelectDate(new Date("2025-01-20"))} />
  ),
  DayDetailsPanel: ({ onEventClick }: any) => (
    <div
      data-testid="details"
      onClick={() =>
        onEventClick({
          id: "1",
          title: "Test",
          start: "2025-01-01",
          end: "2025-01-01",
          resource: { categories: [], eventType: "OTHER", tags: [] },
        })
      }
    />
  ),
}));

vi.mock("@/components/calendar/EventDetailModal", () => ({
  EventDetailModal: ({ isOpen, onClose }: any) =>
    isOpen ? (
      <div data-testid="modal">
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

describe("AlmanacPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseFetch.mockReturnValue({ data: [], loading: false });
    window.scrollTo = vi.fn();
    window.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    }) as any;
  });

  it("handles full lifecycle", async () => {
    const mockData = [
      { date: "2025-01-01", locationName: "Amsterdam", moonPhaseEvent: { type: "full" } },
      { date: "2025-01-02", locationName: "Amsterdam" },
    ];
    // Spanning 2 days
    const mockEvents = [
      {
        id: "1",
        title: "Event",
        start: "2025-01-01",
        end: "2025-01-02",
        resource: {
          categories: [],
          eventType: "FESTIVAL",
          tags: [],
          originalEndDate: "2025-01-02",
        },
      },
    ];

    mockUseFetch.mockImplementation((url) => {
      if (url.includes("daily-info")) return { data: mockData, loading: false };
      if (url.includes("events")) return { data: mockEvents, loading: false };
      return { data: [], loading: false };
    });

    const { rerender } = render(<AlmanacPage />);

    // Trigger filter toggles
    act(() => {
      fireEvent.click(screen.getByText("Toggle Moon"));
      fireEvent.click(screen.getByText("Toggle Special"));
      fireEvent.click(screen.getByText("Toggle Events"));
      fireEvent.click(screen.getByText("Set Year"));
      fireEvent.click(screen.getByText("Set Month"));
    });

    // Trigger date selection and scroll
    (window as any).scrollY = 100;
    act(() => {
      fireEvent.click(screen.getByTestId("grid"));
    });

    // Rerender to ensure isInitialMount was false and scroll hook ran
    rerender(<AlmanacPage />);

    // Trigger modal (handleEventClick)
    act(() => {
      fireEvent.click(screen.getByTestId("details"));
    });
    expect(screen.getByTestId("modal")).toBeInTheDocument();

    // Close modal (handleCloseModal)
    act(() => {
      fireEvent.click(screen.getByText("Close"));
    });
    expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
  });
});
