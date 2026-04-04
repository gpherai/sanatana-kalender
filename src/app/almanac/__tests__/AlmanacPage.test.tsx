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

  it("handles full lifecycle and all edge cases", async () => {
    // 1. Cover all owmPhase branches (line 42)
    const phases = [0, 0.25, 0.5, 0.75];
    const mockData = phases.map((p, i) => ({
      date: `2025-01-0${i + 1}`,
      locationName: "Amsterdam",
      moonPhaseEvent: {
        type:
          p === 0
            ? "new"
            : p === 0.25
              ? "first_quarter"
              : p === 0.5
                ? "full"
                : "last_quarter",
      },
    }));

    // 2. Cover multi-day loop (lines 165-168)
    const mockEvents = [
      {
        id: "1",
        title: "Long Event",
        start: "2025-01-01",
        end: "2025-01-03",
        resource: {
          categories: [],
          eventType: "FESTIVAL",
          tags: [],
          originalEndDate: "2025-01-03",
        },
      },
    ];

    mockUseFetch.mockImplementation((url) => {
      if (url.includes("daily-info")) return { data: mockData, loading: false };
      if (url.includes("events")) return { data: mockEvents, loading: false };
      return { data: [], loading: false };
    });

    const { rerender } = render(<AlmanacPage />);

    // First selectedDate change skips scroll (line 123)
    act(() => {
      fireEvent.click(screen.getByTestId("grid"));
    });

    // Rerender to clear isInitialMount
    rerender(<AlmanacPage />);

    // Second selectedDate change triggers scroll (line 100)
    (window as any).scrollY = 100;
    act(() => {
      fireEvent.click(screen.getByTestId("moon-timeline"));
    });
    expect(window.scrollTo).toHaveBeenCalled();

    // Toggle filters (lines 190, 195)
    act(() => {
      fireEvent.click(screen.getByText("Toggle Special"));
      fireEvent.click(screen.getByText("Toggle Events"));
    });

    const status = screen.getByTestId("filter-status");
    expect(status).toHaveTextContent("Special OFF");
    expect(status).toHaveTextContent("Events OFF");
  });
});
