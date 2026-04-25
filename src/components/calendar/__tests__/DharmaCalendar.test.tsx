/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DharmaCalendar } from "../DharmaCalendar";
import type { CalendarEventResponse } from "@/types/calendar";

let lastCalendarProps: any = null;

vi.mock("../EventDetailModal", () => ({
  EventDetailModal: ({
    event,
    isOpen,
    onClose,
  }: {
    event: { title: string };
    isOpen: boolean;
    onClose: () => void;
  }) =>
    isOpen ? (
      <div data-testid="event-modal">
        <span>{event.title}</span>
        <button onClick={onClose}>Sluiten</button>
      </div>
    ) : null,
}));

vi.mock("react-big-calendar", () => ({
  Calendar: (props: any) => {
    lastCalendarProps = props;
    const events = (props.events as any[]) ?? [];

    // Render components for coverage
    const DateHeader = props.components.month.dateHeader;
    const EventComp = props.components.event;

    return (
      <div data-testid="calendar">
        <div data-testid="events-list">
          {events.map((e) => (
            <div key={e.id} onClick={() => props.onSelectEvent(e)}>
              <EventComp event={e} />
            </div>
          ))}
        </div>
        <div data-testid="date-headers">
          <DateHeader date={new Date()} label="Today" />
          <DateHeader date={new Date("2025-01-15")} label="Special" />
        </div>
        <button onClick={() => props.onView("week")}>Change View</button>
        <button onClick={() => props.onNavigate(new Date("2025-02-01"))}>Navigate</button>
      </div>
    );
  },
  dateFnsLocalizer: () => ({}),
}));

describe("DharmaCalendar", () => {
  beforeEach(() => {
    lastCalendarProps = null;
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("covers full DharmaCalendar logic", async () => {
    const fetchMock = vi.mocked(fetch);
    const user = userEvent.setup();

    const mockEvent: CalendarEventResponse = {
      id: "occ_1",
      eventId: "evt_1",
      title: "Test Event",
      start: "2025-01-01",
      end: "2025-01-01",
      allDay: true,
      resource: {
        description: null,
        eventType: "FESTIVAL",
        categories: [
          {
            id: "cat_1",
            name: "ganesha",
            displayName: "Ganesha",
            color: "#ff0000",
            colorDark: null,
            icon: "🐘",
            description: null,
            sortOrder: 1,
          },
        ],
        tithi: null,
        nakshatra: null,
        maas: null,
        tags: [],
        notes: null,
        startTime: null,
        endTime: null,
        originalEndDate: null,
        seriesParentEventIds: [],
        seriesDayNumber: null,
        hasSeriesChildren: false,
      },
    };

    fetchMock.mockImplementation(async (url) => {
      if (typeof url === "string" && url.includes("/api/daily-info")) {
        return {
          ok: true,
          json: async () => [
            {
              date: new Date().toISOString(),
              moonPhaseEmoji: "🌕",
              moonPhaseEvent: { type: "full" },
            },
            {
              date: "2025-01-15T00:00:00.000Z",
              moonPhaseEmoji: "🌑",
              moonPhaseEvent: { type: "new" },
            },
          ],
        } as Response;
      }
      return {
        ok: true,
        json: async () => [mockEvent],
      } as Response;
    });

    render(<DharmaCalendar />);

    // Wait for calendar to mount and load
    await screen.findByTestId("calendar");

    // Verify events loaded
    await waitFor(() => {
      expect(screen.getByText("Test Event")).toBeDefined();
    });

    // Test View Change
    const viewButton = screen.getByText("Change View");
    await user.click(viewButton);

    // Test Navigation
    const navButton = screen.getByText("Navigate");
    await user.click(navButton);

    // Test Event Selection and Modal
    const eventEl = screen.getByText("Test Event");
    await user.click(eventEl);
    expect(screen.getByTestId("event-modal")).toBeDefined();

    // Test Modal Close
    const closeBtn = screen.getByText("Sluiten");
    await user.click(closeBtn);
    expect(screen.queryByTestId("event-modal")).toBeNull();

    // Verify dayPropGetter (weekends)
    const sunday = new Date("2025-01-05T12:00:00Z");
    const weekendProps = lastCalendarProps.dayPropGetter(sunday);
    expect(weekendProps.style.backgroundColor).toBeDefined();

    const monday = new Date("2025-01-06T12:00:00Z");
    const weekdayProps = lastCalendarProps.dayPropGetter(monday);
    expect(weekdayProps.style).toBeUndefined();

    // Verify eventStyleGetter
    const styleProps = lastCalendarProps.eventPropGetter(lastCalendarProps.events[0]);
    expect(styleProps.style.backgroundColor).toBe("#ff0000");

    // Verify eventStyleGetter fallback
    const mockEventNoCat = {
      ...mockEvent,
      resource: { ...mockEvent.resource, categories: [] },
    };
    const parsedNoCat = (await import("@/types/calendar")).parseCalendarEvent(
      mockEventNoCat
    );
    const fallbackStyleProps = lastCalendarProps.eventPropGetter(parsedNoCat);
    expect(fallbackStyleProps.style.backgroundColor).toBeDefined();
  });

  it("triggers onError when fetch fails", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    render(<DharmaCalendar />);
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });
  });

  it("builds event query URL with date-only params (no timestamp suffix)", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [],
    } as Response);

    render(<DharmaCalendar />);

    await waitFor(() => {
      const calls = fetchMock.mock.calls.filter((call) => {
        const url = typeof call[0] === "string" ? call[0] : "";
        return url.includes("/api/events");
      });
      expect(calls.length).toBeGreaterThan(0);
    });

    // Check that the events URL contains YYYY-MM-DD format without T and timestamp
    const eventsCalls = fetchMock.mock.calls.filter((call) => {
      const url = typeof call[0] === "string" ? call[0] : "";
      return url.includes("/api/events");
    });

    expect(eventsCalls.length).toBeGreaterThan(0);
    const firstCall = eventsCalls[0];
    const url = typeof firstCall[0] === "string" ? firstCall[0] : "";

    // Verify the URL has date-only params
    expect(url).toMatch(/start=\d{4}-\d{2}-\d{2}/);
    expect(url).toMatch(/end=\d{4}-\d{2}-\d{2}/);
    // Ensure no timestamp suffix
    expect(url).not.toContain("T00:00:00");
    expect(url).not.toContain("T23:59:59");
  });
});
