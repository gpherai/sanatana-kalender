import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AlmanacPage from "../page";
import { useFetch } from "@/hooks/useFetch";

// Mock hooks
vi.mock("@/hooks/useFetch");
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/almanac",
}));

// Mock window.scrollTo
window.scrollTo = vi.fn();

const FIXED_TODAY = new Date("2026-04-18T12:00:00Z");

describe("Almanac Page", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_TODAY);
    vi.clearAllMocks();

    // Mock requestAnimationFrame to execute immediately
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      cb(0);
      return 0;
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    // Mock useFetch default behavior
    vi.mocked(useFetch).mockReturnValue({
      data: [],
      loading: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the almanac header and month grid", () => {
    render(<AlmanacPage />);
    expect(screen.getByText(/Den Haag/i)).toBeInTheDocument();
    // Month should be April 2026 based on FIXED_TODAY. Use getAll as it appears in h2 and h3
    expect(screen.getAllByText(/April 2026/i).length).toBeGreaterThan(0);
  });

  it("requests events with strict date-only query params", () => {
    render(<AlmanacPage />);

    const eventsCalls = vi
      .mocked(useFetch)
      .mock.calls.filter(
        ([url]) => typeof url === "string" && url.includes("/api/events")
      );

    expect(eventsCalls.length).toBeGreaterThan(0);
    const eventsUrl = eventsCalls[0]![0] as string;
    expect(eventsUrl).toContain("start=2026-04-01&end=2026-04-30");
    expect(eventsUrl).not.toContain("T00:00:00.000Z");
    expect(eventsUrl).not.toContain("T23:59:59.999Z");
  });

  it("handles date selection and saves scroll position", async () => {
    render(<AlmanacPage />);

    // Simulate scroll
    Object.defineProperty(window, "scrollY", { value: 100, configurable: true });

    // Find day 15 in the grid (using regex to handle potential badges)
    const day15 = screen.getByRole("button", { name: /^15(\s|$)/ });
    fireEvent.click(day15);

    // The effect should trigger immediately due to our requestAnimationFrame mock
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 100, behavior: "instant" });
  });

  it("toggles filters correctly", () => {
    render(<AlmanacPage />);

    const moonToggle = screen.getByRole("button", { name: /Maanfases/i });
    fireEvent.click(moonToggle);
  });

  const makeMockResource = (tags: string[] = []) => ({
    description: null,
    eventType: "FESTIVAL",
    categories: [
      {
        id: "cat_1",
        name: "festival",
        displayName: "Festival",
        icon: "🎉",
        color: "#ff0000",
        colorDark: null,
        description: null,
        sortOrder: 1,
      },
    ],
    tithi: null,
    nakshatra: null,
    maas: null,
    tags,
    notes: null,
    startTime: null,
    endTime: null,
    originalEndDate: null,
    seriesParentEventIds: [],
    seriesDayNumber: null,
    hasSeriesChildren: false,
  });

  it("suppresses generic Sankashti events on Angarki days", async () => {
    const mockEvents = [
      {
        id: "1",
        eventId: "e1",
        title: "Sankashti Chaturthi",
        start: "2026-04-21T00:00:00Z",
        end: "2026-04-21T23:59:59Z",
        allDay: true,
        resource: makeMockResource(["sankashti"]),
      },
      {
        id: "2",
        eventId: "e2",
        title: "Angarki Chaturthi",
        start: "2026-04-21T00:00:00Z",
        end: "2026-04-21T23:59:59Z",
        allDay: true,
        resource: makeMockResource(["sankashti", "angaraka"]),
      },
    ];

    vi.mocked(useFetch).mockImplementation((url) => {
      if (url?.includes("/api/events")) {
        return { data: mockEvents, loading: false, error: null, refetch: vi.fn() };
      }
      return { data: [], loading: false, error: null, refetch: vi.fn() };
    });

    render(<AlmanacPage />);

    // Select day 21 (April 21, 2026)
    const day21 = screen.getByRole("button", { name: /^21(\s|$)/ });
    fireEvent.click(day21);

    // Should only show Angarki in the DayDetailsPanel
    expect(screen.getByText("Angarki Chaturthi")).toBeInTheDocument();
    expect(screen.queryByText("Sankashti Chaturthi")).not.toBeInTheDocument();
  });

  it("maps multi-day events across all covered days", async () => {
    const multiDayEvent = [
      {
        id: "3",
        eventId: "e3",
        title: "Long Festival",
        start: "2026-04-10T00:00:00Z",
        end: "2026-04-12T23:59:59Z",
        allDay: true,
        resource: {
          ...makeMockResource(),
          originalEndDate: "2026-04-12",
        },
      },
    ];

    vi.mocked(useFetch).mockImplementation((url) => {
      if (url?.includes("/api/events")) {
        return { data: multiDayEvent, loading: false, error: null, refetch: vi.fn() };
      }
      return { data: [], loading: false, error: null, refetch: vi.fn() };
    });

    render(<AlmanacPage />);

    // Check day 10
    fireEvent.click(screen.getByRole("button", { name: /^10(\s|$)/ }));
    expect(screen.getByText("Long Festival")).toBeInTheDocument();

    // Check day 11
    fireEvent.click(screen.getByRole("button", { name: /^11(\s|$)/ }));
    expect(screen.getByText("Long Festival")).toBeInTheDocument();

    // Check day 12
    fireEvent.click(screen.getByRole("button", { name: /^12(\s|$)/ }));
    expect(screen.getByText("Long Festival")).toBeInTheDocument();
  });
});
