import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MonthGrid } from "../MonthGrid";
import { formatDateLocal } from "@/lib/date-utils";
import type { CalendarEventResponse } from "@/types/calendar";
import type { DailyInfoResponse } from "@/types";
import type { SpecialDay } from "@/lib/panchanga-helpers";

// Reusable minimal event fixture
function makeEvent(): CalendarEventResponse {
  return {
    id: "occ_1",
    eventId: "evt_1",
    title: "Event",
    start: "2025-01-02",
    end: "2025-01-03",
    allDay: true,
    resource: {
      description: null,
      eventType: "FESTIVAL",
      categories: [],
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
      recurrenceType: "NONE",
    },
  };
}

// Minimal DailyInfoResponse with sun/moon times
function makeInfo(
  overrides: Partial<Pick<DailyInfoResponse, "moonrise" | "moonset">> = {}
): DailyInfoResponse {
  return {
    date: "2025-01-02",
    locationName: "Den Haag",
    locationLat: 52.07,
    locationLon: 4.3,
    sunrise: "07:30",
    sunset: "17:00",
    moonrise: "18:00",
    moonset: "06:00",
    moonriseUtcIso: "2025-01-02T17:00:00Z",
    moonsetUtcIso: "2025-01-02T05:00:00Z",
    moonPhasePercent: 50,
    moonPhaseType: "FULL_MOON",
    isWaxing: false,
    moonPhaseEmoji: "🌕",
    moonPhaseName: "Volle Maan",
    vara: { name: "Guruvara" },
    tithi: { number: 2, name: "Dwitiya", paksha: "Shukla", endTime: null },
    nakshatra: { number: 3, name: "Krittika", pada: 1, endTime: null },
    yoga: { number: 4, name: "Saubhagya", endTime: null },
    karana: { number: 2, name: "Balava", type: "Movable", endTime: null },
    ...overrides,
  };
}

const DAY = new Date(2025, 0, 2); // Jan 2 2025 — a fixed non-today date
const OTHER_DATE = new Date(2025, 0, 1); // Different from DAY, used as selectedDate

describe("MonthGrid", () => {
  it("renders event count and handles date selection", async () => {
    const onSelectDate = vi.fn();
    const date = new Date(2025, 0, 2);
    const dateKey = formatDateLocal(date);
    const event: CalendarEventResponse = makeEvent();

    render(
      <MonthGrid
        year={2025}
        month={0}
        days={[date]}
        startPadding={0}
        dailyInfoMap={new Map()}
        eventsMap={new Map([[dateKey, [event, event, event]]])}
        specialDaysMap={new Map()}
        moonPhasesMap={new Map()}
        selectedDate={date}
        onSelectDate={onSelectDate}
        showMoonPhases={false}
        showSpecialDays={false}
        showEvents={true}
      />
    );

    expect(screen.getByText("3")).toBeInTheDocument();

    const dayNumber = screen.getByText("2");
    const dayButton = dayNumber.closest("button");
    expect(dayButton).toBeTruthy();
    expect(dayButton).toHaveClass("bg-theme-primary");

    await userEvent.click(dayButton as HTMLButtonElement);
    expect(onSelectDate).toHaveBeenCalledWith(date);
  });

  it("applies today styling when the day is today", () => {
    const today = new Date();
    const otherDate = new Date(2000, 0, 1); // not today

    render(
      <MonthGrid
        year={today.getFullYear()}
        month={today.getMonth()}
        days={[today]}
        startPadding={0}
        dailyInfoMap={new Map()}
        eventsMap={new Map()}
        specialDaysMap={new Map()}
        moonPhasesMap={new Map()}
        selectedDate={otherDate}
        onSelectDate={vi.fn()}
        showMoonPhases={false}
        showSpecialDays={false}
        showEvents={true}
      />
    );

    const dayNumber = screen.getByText(String(today.getDate()));
    const dayButton = dayNumber.closest("button");
    expect(dayButton).toHaveClass("bg-theme-primary-15");
    expect(dayNumber).toHaveClass("text-theme-primary");
  });

  it("applies major event cell background when a MAJOR event is shown", () => {
    const dateKey = formatDateLocal(DAY);

    render(
      <MonthGrid
        year={2025}
        month={0}
        days={[DAY]}
        startPadding={0}
        dailyInfoMap={new Map()}
        eventsMap={new Map([[dateKey, [makeEvent()]]])}
        specialDaysMap={new Map()}
        moonPhasesMap={new Map()}
        selectedDate={OTHER_DATE}
        onSelectDate={vi.fn()}
        showMoonPhases={false}
        showSpecialDays={false}
        showEvents={true}
      />
    );

    const dayButton = screen.getByText("2").closest("button");
    expect(dayButton?.className).toContain("theme-almanac-event-cell-bg");
  });

  it("does not apply major event styling when showEvents=false", () => {
    const dateKey = formatDateLocal(DAY);

    render(
      <MonthGrid
        year={2025}
        month={0}
        days={[DAY]}
        startPadding={0}
        dailyInfoMap={new Map()}
        eventsMap={new Map([[dateKey, [makeEvent()]]])}
        specialDaysMap={new Map()}
        moonPhasesMap={new Map()}
        selectedDate={OTHER_DATE}
        onSelectDate={vi.fn()}
        showMoonPhases={false}
        showSpecialDays={false}
        showEvents={false}
      />
    );

    const dayButton = screen.getByText("2").closest("button");
    expect(dayButton?.className).not.toContain("theme-almanac-event-cell-bg");
  });

  it("applies moon phase cell background when a moon phase is present", () => {
    const dateKey = formatDateLocal(DAY);
    const moonPhase = {
      date: DAY,
      type: "full" as const,
      name: "Full Moon",
      emoji: "🌕",
    };

    render(
      <MonthGrid
        year={2025}
        month={0}
        days={[DAY]}
        startPadding={0}
        dailyInfoMap={new Map()}
        eventsMap={new Map()}
        specialDaysMap={new Map()}
        moonPhasesMap={new Map([[dateKey, moonPhase]])}
        selectedDate={OTHER_DATE}
        onSelectDate={vi.fn()}
        showMoonPhases={true}
        showSpecialDays={false}
        showEvents={true}
      />
    );

    const dayButton = screen.getByText("2").closest("button");
    expect(dayButton?.className).toContain("theme-almanac-moon-cell-bg");
  });

  it("applies special day cell background when a special day is present", () => {
    const dateKey = formatDateLocal(DAY);
    const special: SpecialDay = {
      date: DAY,
      type: "ekadashi",
      name: "Ekadashi",
      description: "Shukla Ekadashi",
      emoji: "🙏",
    };

    render(
      <MonthGrid
        year={2025}
        month={0}
        days={[DAY]}
        startPadding={0}
        dailyInfoMap={new Map()}
        eventsMap={new Map()}
        specialDaysMap={new Map([[dateKey, [special]]])}
        moonPhasesMap={new Map()}
        selectedDate={OTHER_DATE}
        onSelectDate={vi.fn()}
        showMoonPhases={false}
        showSpecialDays={true}
        showEvents={true}
      />
    );

    const dayButton = screen.getByText("2").closest("button");
    expect(dayButton?.className).toContain("theme-almanac-special-cell-bg");
  });

  it("shows sun and moon times when dailyInfo is present", () => {
    const dateKey = formatDateLocal(DAY);

    render(
      <MonthGrid
        year={2025}
        month={0}
        days={[DAY]}
        startPadding={0}
        dailyInfoMap={new Map([[dateKey, makeInfo()]])}
        eventsMap={new Map()}
        specialDaysMap={new Map()}
        moonPhasesMap={new Map()}
        selectedDate={OTHER_DATE}
        onSelectDate={vi.fn()}
        showMoonPhases={false}
        showSpecialDays={false}
        showEvents={true}
      />
    );

    expect(screen.getByText("07:30")).toBeInTheDocument();
    expect(screen.getByText("17:00")).toBeInTheDocument();
    expect(screen.getByText("18:00")).toBeInTheDocument();
    expect(screen.getByText("06:00")).toBeInTheDocument();
  });

  it("shows '—' for moonrise and moonset when they are null", () => {
    const dateKey = formatDateLocal(DAY);

    render(
      <MonthGrid
        year={2025}
        month={0}
        days={[DAY]}
        startPadding={0}
        dailyInfoMap={new Map([[dateKey, makeInfo({ moonrise: null, moonset: null })]])}
        eventsMap={new Map()}
        specialDaysMap={new Map()}
        moonPhasesMap={new Map()}
        selectedDate={OTHER_DATE}
        onSelectDate={vi.fn()}
        showMoonPhases={false}
        showSpecialDays={false}
        showEvents={true}
      />
    );

    const dashes = screen.getAllByText("—");
    expect(dashes).toHaveLength(2);
  });

  it("does not render event badge when showEvents=false", () => {
    const dateKey = formatDateLocal(DAY);

    render(
      <MonthGrid
        year={2025}
        month={0}
        days={[DAY]}
        startPadding={0}
        dailyInfoMap={new Map()}
        eventsMap={new Map([[dateKey, [makeEvent()]]])}
        specialDaysMap={new Map()}
        moonPhasesMap={new Map()}
        selectedDate={OTHER_DATE}
        onSelectDate={vi.fn()}
        showMoonPhases={false}
        showSpecialDays={false}
        showEvents={false}
      />
    );

    expect(screen.queryByText("1")).not.toBeInTheDocument();
  });

  it("renders padding divs when startPadding > 0", () => {
    const { container } = render(
      <MonthGrid
        year={2025}
        month={0}
        days={[DAY]}
        startPadding={3}
        dailyInfoMap={new Map()}
        eventsMap={new Map()}
        specialDaysMap={new Map()}
        moonPhasesMap={new Map()}
        selectedDate={OTHER_DATE}
        onSelectDate={vi.fn()}
        showMoonPhases={false}
        showSpecialDays={false}
        showEvents={true}
      />
    );

    // Grid has 7 weekday headers + 3 padding divs + 1 day button
    const grid = container.querySelector(".grid");
    const divChildren = grid?.querySelectorAll("div");
    // 7 weekday headers + 3 padding = 10 div elements
    expect(divChildren?.length).toBeGreaterThanOrEqual(10);
  });

  it("applies white badge styling on the selected day", () => {
    const dateKey = formatDateLocal(DAY);

    render(
      <MonthGrid
        year={2025}
        month={0}
        days={[DAY]}
        startPadding={0}
        dailyInfoMap={new Map()}
        eventsMap={new Map([[dateKey, [makeEvent()]]])}
        specialDaysMap={new Map()}
        moonPhasesMap={new Map()}
        selectedDate={DAY}
        onSelectDate={vi.fn()}
        showMoonPhases={false}
        showSpecialDays={false}
        showEvents={true}
      />
    );

    // Event badge on selected day has white variant
    const badge = screen.getByText("1");
    expect(badge).toHaveClass("bg-white/30");
    expect(badge).toHaveClass("text-white");
  });
});
