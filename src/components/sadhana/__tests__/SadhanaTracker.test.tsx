import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SadhanaTracker } from "@/components/sadhana/SadhanaTracker";

const loadAll = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("tab=settings"),
  useRouter: () => ({
    replace: vi.fn(),
  }),
}));

vi.mock("@/hooks/useSadhanaData", () => ({
  useSadhanaData: () => ({
    loading: false,
    error: null,
    todayStats: null,
    streak: null,
    overview: null,
    calDays: [],
    sessions: [],
    allPractices: [
      {
        id: "active",
        name: "Actieve practice",
        type: "mantra_japa",
        mantraText: null,
        notes: null,
        active: true,
      },
      {
        id: "inactive",
        name: "Gedeactiveerde practice",
        type: "parayana",
        mantraText: null,
        notes: null,
        active: false,
      },
    ],
    activePractices: [
      {
        id: "active",
        name: "Actieve practice",
        type: "mantra_japa",
        mantraText: null,
        notes: null,
        active: true,
      },
    ],
    goals: [],
    routines: [],
    dayInfoMap: new Map(),
    heatmapEventsByDate: new Map(),
    heatmapEventsRaw: [],
    loadAll,
  }),
}));

vi.mock("@/components/sadhana/tabs/SettingsTab", () => ({
  SettingsTab: ({
    allPractices,
  }: {
    allPractices: Array<{ id: string; name: string }>;
  }) => (
    <div>
      {allPractices.map((practice) => (
        <span key={practice.id}>{practice.name}</span>
      ))}
    </div>
  ),
}));

vi.mock("@/components/calendar/EventDetailModal", () => ({
  EventDetailModal: () => null,
}));

describe("SadhanaTracker", () => {
  it("passes inactive practices to settings so they can be reactivated", () => {
    render(<SadhanaTracker initialData={undefined} />);

    expect(screen.getByText("Actieve practice")).toBeInTheDocument();
    expect(screen.getByText("Gedeactiveerde practice")).toBeInTheDocument();
  });
});
