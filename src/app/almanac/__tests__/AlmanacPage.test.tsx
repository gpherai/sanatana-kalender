/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { AlmanacClient as AlmanacPage } from "@/components/almanac/AlmanacClient";

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
    showMoonPhases,
    showSpecialDays,
    showEvents,
  }: any) => (
    <div data-testid="filters">
      <button onClick={() => onToggleFilter("moonPhases")}>T-Moon</button>
      <button onClick={() => onToggleFilter("specialDays")}>T-Special</button>
      <button onClick={() => onToggleFilter("events")}>T-Events</button>
      <div data-testid="f-status">
        {showMoonPhases ? "M-ON" : "M-OFF"}
        {showSpecialDays ? "S-ON" : "S-OFF"}
        {showEvents ? "E-ON" : "E-OFF"}
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

describe("AlmanacPage 100% Coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseFetch.mockReturnValue({ data: [], loading: false, refetch: vi.fn() });
    window.scrollTo = vi.fn();
    window.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    }) as any;
  });

  it("handles full lifecycle and all branches", async () => {
    const mockData = [
      { date: "2025-01-01", moonPhaseEvent: { type: "new" } },
      { date: "2025-01-02", moonPhaseEvent: { type: "first_quarter" } },
      { date: "2025-01-03", moonPhaseEvent: { type: "full" } },
      { date: "2025-01-04", moonPhaseEvent: { type: "last_quarter" } },
      { date: "2025-01-05", moonPhaseEvent: { type: "unknown" } }, // trigger line 42 branch
    ];
    // Line 165-168: event spant 3 dagen
    const mockEvents = [
      {
        id: "1",
        title: "Long",
        start: "2025-01-01",
        end: "2025-01-03",
        resource: {
          categories: [],
          eventType: "FESTIVAL",
          tags: [],
          originalEndDate: "2025-01-03",
          seriesDayNumber: 1,
        },
      },
    ];

    mockUseFetch.mockImplementation((url) => {
      if (url.includes("daily-info"))
        return { data: mockData, loading: false, refetch: vi.fn() };
      if (url.includes("events"))
        return { data: mockEvents, loading: false, refetch: vi.fn() };
      return { data: [], loading: false, refetch: vi.fn() };
    });

    const { rerender } = render(<AlmanacPage />);

    // Line 123 check (isInitialMount)
    act(() => {
      fireEvent.click(screen.getByTestId("grid"));
    });
    rerender(<AlmanacPage />);

    // Line 100 scroll
    (window as any).scrollY = 100;
    act(() => {
      fireEvent.click(screen.getByTestId("moon-timeline"));
    });
    expect(window.scrollTo).toHaveBeenCalled();

    // Line 190, 195 (filters)
    act(() => {
      fireEvent.click(screen.getByText("T-Special"));
      fireEvent.click(screen.getByText("T-Events"));
    });

    // Line 213, 217 (modal)
    act(() => {
      fireEvent.click(screen.getByTestId("details"));
    });
    expect(screen.getByTestId("modal")).toBeInTheDocument();
    act(() => {
      fireEvent.click(screen.getByText("Close"));
    });
  });
});
