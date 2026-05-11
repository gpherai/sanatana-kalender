import { beforeEach, describe, expect, it, vi } from "vitest";

const repo = vi.hoisted(() => ({
  findAllSessions: vi.fn(),
  findSessionsByDateRange: vi.fn(),
}));

vi.mock("@/repositories/sadhana.repository", () => repo);

import { getSadhanaCalendar, getSadhanaOverview } from "@/services/sadhana.service";

const createdAt = new Date("2026-04-01T00:00:00.000Z");

function practice(id: string, type: "mantra_japa" | "parayana" | "other") {
  return {
    id,
    name: id,
    type,
    mantraText: null,
    notes: null,
    active: true,
    createdAt,
  };
}

function session(
  id: string,
  date: string,
  items: Array<{
    practiceId: string;
    practice: ReturnType<typeof practice>;
    quantity: number;
    unit: "malas" | "count";
  }>,
  durationMinutes = 0
) {
  return {
    id,
    date: new Date(`${date}T00:00:00.000Z`),
    startedAt: null,
    durationMinutes,
    notes: null,
    createdAt,
    items: items.map((item, index) => ({
      id: `${id}-item-${index}`,
      sessionId: id,
      durationMinutes: null,
      notes: null,
      createdAt,
      ...item,
    })),
  };
}

describe("sadhana service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns every day in the requested calendar range and counts recitations as activity", async () => {
    repo.findSessionsByDateRange.mockResolvedValue([
      session(
        "s1",
        "2026-04-25",
        [
          {
            practiceId: "atharvashirsha",
            practice: practice("atharvashirsha", "parayana"),
            quantity: 1,
            unit: "count",
          },
        ],
        9
      ),
    ]);

    const days = await getSadhanaCalendar({
      start: "2026-04-24",
      end: "2026-04-26",
    });

    expect(days.map((day) => day.date)).toEqual([
      "2026-04-24",
      "2026-04-25",
      "2026-04-26",
    ]);
    expect(days[1]).toMatchObject({
      totalMalas: 0,
      totalCount: 1,
      totalMinutes: 9,
      sessionCount: 1,
    });
    expect(days[1]!.activityScore).toBeGreaterThan(0);
  });

  it("excludes future sessions from overview practice statistics", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-25T10:00:00.000Z"));
    repo.findAllSessions.mockResolvedValue([
      session(
        "past",
        "2026-04-25",
        [
          {
            practiceId: "past-practice",
            practice: practice("past-practice", "mantra_japa"),
            quantity: 1,
            unit: "malas",
          },
        ],
        10
      ),
      session(
        "future",
        "2026-04-26",
        [
          {
            practiceId: "future-practice",
            practice: practice("future-practice", "mantra_japa"),
            quantity: 99,
            unit: "malas",
          },
        ],
        99
      ),
    ]);

    const overview = await getSadhanaOverview();

    expect(overview.practices.map((p) => p.practiceId)).toEqual(["past-practice"]);
    vi.useRealTimers();
  });
});
