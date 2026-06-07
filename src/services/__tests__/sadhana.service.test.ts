import { beforeEach, describe, expect, it, vi } from "vitest";

const repo = vi.hoisted(() => ({
  findAllSessions: vi.fn(),
  findSessionsByDateRange: vi.fn(),
  findGoalsWithPractices: vi.fn(),
  findSessionById: vi.fn(),
  updateSessionWithItems: vi.fn(),
  findRoutineById: vi.fn(),
  updateRoutineWithItems: vi.fn(),
}));

vi.mock("@/repositories/sadhana.repository", () => repo);

import {
  getSadhanaCalendar,
  getSadhanaOverview,
  getGoalsWithProgress,
  SadhanaItemOwnershipError,
  updateSadhanaRoutine,
  updateSadhanaSession,
} from "@/services/sadhana.service";

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

function goal(id: string, type: "daily" | "weekly" | "lifetime", practiceIds: string[]) {
  return {
    id,
    type,
    name: id,
    targetMalas: 100,
    targetMinutes: null,
    active: true,
    createdAt,
    updatedAt: createdAt,
    practices: practiceIds.map((pid) => practice(pid, "mantra_japa")),
  };
}

function routine(id: string) {
  return {
    id,
    name: id,
    active: true,
    sortOrder: 0,
    createdAt,
    updatedAt: createdAt,
    items: [
      {
        id: `${id}-item-1`,
        routineId: id,
        practiceId: "practice-1",
        quantity: 1,
        unit: "malas",
        sortOrder: 0,
        createdAt,
        updatedAt: createdAt,
        practice: practice("practice-1", "mantra_japa"),
      },
    ],
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

  it("does not over-count session minutes for a multi-practice session (D4)", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-26T10:00:00.000Z"));
    repo.findGoalsWithPractices.mockResolvedValue([goal("g1", "lifetime", ["A"])]);
    repo.findAllSessions.mockResolvedValue([
      session(
        "mix",
        "2026-04-25",
        [
          {
            practiceId: "A",
            practice: practice("A", "mantra_japa"),
            quantity: 1,
            unit: "malas",
          },
          {
            practiceId: "B",
            practice: practice("B", "mantra_japa"),
            quantity: 1,
            unit: "malas",
          },
        ],
        30
      ),
    ]);

    const goals = await getGoalsWithProgress();

    // Item A has no per-item duration and the session also contains unrelated
    // practice B → the 30-min session time is NOT attributable to goal g1.
    expect(goals[0]!.progressMinutes).toBe(0);
    vi.useRealTimers();
  });

  it("attributes whole-session minutes when every item belongs to the goal (D4)", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-26T10:00:00.000Z"));
    repo.findGoalsWithPractices.mockResolvedValue([goal("g1", "lifetime", ["A"])]);
    repo.findAllSessions.mockResolvedValue([
      session(
        "solo",
        "2026-04-25",
        [
          {
            practiceId: "A",
            practice: practice("A", "mantra_japa"),
            quantity: 1,
            unit: "malas",
          },
        ],
        20
      ),
    ]);

    const goals = await getGoalsWithProgress();

    // No per-item minutes, but the whole session is goal g1's practice → 20 min.
    expect(goals[0]!.progressMinutes).toBe(20);
    vi.useRealTimers();
  });

  it("rejects session updates with item IDs from another session", async () => {
    repo.findSessionById.mockResolvedValue(
      session("session-1", "2026-04-25", [
        {
          practiceId: "practice-1",
          practice: practice("practice-1", "mantra_japa"),
          quantity: 1,
          unit: "malas",
        },
      ])
    );

    await expect(
      updateSadhanaSession("session-1", {
        items: [
          {
            id: "other-session-item",
            practiceId: "practice-1",
            quantity: 1,
            unit: "malas",
          },
        ],
      })
    ).rejects.toBeInstanceOf(SadhanaItemOwnershipError);
    expect(repo.updateSessionWithItems).not.toHaveBeenCalled();
  });

  it("rejects routine updates with item IDs from another routine", async () => {
    repo.findRoutineById.mockResolvedValue(routine("routine-1"));

    await expect(
      updateSadhanaRoutine("routine-1", {
        items: [
          {
            id: "other-routine-item",
            practiceId: "practice-1",
            quantity: 1,
            unit: "malas",
            sortOrder: 0,
          },
        ],
      })
    ).rejects.toBeInstanceOf(SadhanaItemOwnershipError);
    expect(repo.updateRoutineWithItems).not.toHaveBeenCalled();
  });
});
