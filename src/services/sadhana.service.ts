/**
 * Sadhana Service
 *
 * Business logic layer for Sadhana tracking.
 * Coordinates between repositories and performs calculations.
 *
 * @module services/sadhana
 */

import "server-only";

import * as sadhanaRepo from "@/repositories/sadhana.repository";
import type { Prisma } from "@prisma/client";
import { eachDateOnlyInRange, addDaysDateOnly } from "@/lib/default-location-date";
import { MALA_BEAD_COUNT } from "@/lib/domain";
import {
  utcDate,
  todayStr,
  computePracticeStats,
  dateStr,
  formatGoal,
  formatPractice,
  formatRoutine,
  formatSession,
} from "@/lib/sadhana-formatters";

export class SadhanaNotFoundError extends Error {}
export class GoalPracticeNotFoundError extends Error {}

function isOnOrBefore(date: Date, end: Date) {
  return date.getTime() <= end.getTime();
}

function isWithinInclusiveRange(date: Date, start: Date, end: Date) {
  const time = date.getTime();
  return time >= start.getTime() && time <= end.getTime();
}

function countSadhanaItem(item: {
  practice: { type: string };
  unit: string;
  quantity: number;
}) {
  if (item.unit === "malas") {
    return {
      malas: item.quantity,
      mantras: item.practice.type === "mantra_japa" ? item.quantity * MALA_BEAD_COUNT : 0,
      count: 0,
      activity: item.quantity,
    };
  }

  if (item.practice.type === "mantra_japa") {
    return {
      malas: item.quantity / MALA_BEAD_COUNT,
      mantras: item.quantity,
      count: 0,
      activity: item.quantity / MALA_BEAD_COUNT,
    };
  }

  return {
    malas: 0,
    mantras: 0,
    count: item.quantity,
    activity: item.quantity,
  };
}

/**
 * Computes totals for a given set of sessions.
 */
function computeTotals(
  sessions: {
    durationMinutes: number | null;
    items: { practice: { type: string }; unit: string; quantity: number }[];
  }[]
) {
  let malas = 0;
  let minutes = 0;
  for (const s of sessions) {
    minutes += s.durationMinutes ?? 0;
    for (const item of s.items) {
      if (item.unit === "malas") {
        malas += item.quantity;
      } else if (item.practice.type === "mantra_japa" && item.unit === "count") {
        malas += item.quantity / MALA_BEAD_COUNT;
      }
    }
  }
  return { malas, minutes, sessions: sessions.length };
}

/**
 * Gets a comprehensive overview of Sadhana statistics.
 */
export async function getSadhanaOverview() {
  const today = todayStr();
  const todayDate = utcDate(today);

  // Week start (Monday)
  const dow = todayDate.getUTCDay();
  const weekStart = new Date(todayDate);
  weekStart.setUTCDate(todayDate.getUTCDate() - (dow === 0 ? 6 : dow - 1));

  // Month start
  const monthStart = new Date(
    Date.UTC(todayDate.getUTCFullYear(), todayDate.getUTCMonth(), 1)
  );

  const allSessions = await sadhanaRepo.findAllSessions();
  const completedSessions = allSessions.filter((s) =>
    isOnOrBefore(s.date as Date, todayDate)
  );

  const all = computeTotals(completedSessions);
  const week = computeTotals(
    completedSessions.filter((s) =>
      isWithinInclusiveRange(s.date as Date, weekStart, todayDate)
    )
  );
  const month = computeTotals(
    completedSessions.filter((s) =>
      isWithinInclusiveRange(s.date as Date, monthStart, todayDate)
    )
  );

  return {
    totalSessions: all.sessions,
    totalMalasAllTime: all.malas,
    totalMinutesAllTime: all.minutes,
    totalSessionsThisWeek: week.sessions,
    totalSessionsThisMonth: month.sessions,
    totalMalasThisWeek: week.malas,
    totalMalasThisMonth: month.malas,
    totalMinutesThisWeek: week.minutes,
    totalMinutesThisMonth: month.minutes,
    avgMalasPerSession: all.sessions > 0 ? all.malas / all.sessions : 0,
    avgMinutesPerSession: all.sessions > 0 ? all.minutes / all.sessions : 0,
    practices: computePracticeStats(completedSessions),
  };
}

/**
 * Computes streaks for sadhana sessions.
 */
export async function getSadhanaStreak() {
  const rows = await sadhanaRepo.findUniqueSessionDates();
  const today = todayStr();
  const dates = rows.map((r) => dateStr(r.date as Date)).filter((date) => date <= today);

  if (dates.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastSessionDate: null,
    };
  }

  const yesterday = addDaysDateOnly(today, -1);

  // Current streak
  let currentStreak = 0;
  if (dates[0] === today || dates[0] === yesterday) {
    let expected = dates[0]!;
    for (const dateVal of dates) {
      if (dateVal === expected) {
        currentStreak++;
        const next = new Date(expected + "T00:00:00.000Z");
        next.setUTCDate(next.getUTCDate() - 1);
        expected = dateStr(next);
      } else {
        break;
      }
    }
  }

  // Longest streak
  let longestStreak = 1;
  let run = 1;
  for (let i = 1; i < dates.length; i++) {
    const diff =
      (new Date(dates[i - 1]! + "T00:00:00.000Z").getTime() -
        new Date(dates[i]! + "T00:00:00.000Z").getTime()) /
      86_400_000;
    if (diff === 1) {
      longestStreak = Math.max(longestStreak, ++run);
    } else {
      run = 1;
    }
  }

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    lastSessionDate: dates[0]!,
  };
}

/**
 * Gets sadhana data for today.
 */
export async function getSadhanaToday() {
  const today = todayStr();
  const todayDate = utcDate(today);

  const sessions = await sadhanaRepo.findSessionsByDateRange(todayDate, todayDate);

  let totalMalas = 0;
  let totalMantras = 0;
  let totalCount = 0;
  let totalMinutes = 0;

  for (const session of sessions) {
    totalMinutes += session.durationMinutes ?? 0;
    for (const item of session.items) {
      const totals = countSadhanaItem(item);
      totalMalas += totals.malas;
      totalMantras += totals.mantras;
      totalCount += totals.count;
    }
  }

  const goal = await sadhanaRepo.findDailyGoal();

  return {
    date: today,
    totalMalas,
    totalMinutes,
    totalMantras,
    totalCount,
    goalMalasTarget: goal?.targetMalas ?? null,
    goalMalasProgress: goal?.targetMalas ? totalMalas / goal.targetMalas : null,
    goalMinutesTarget: goal?.targetMinutes ?? null,
    goalMinutesProgress: goal?.targetMinutes ? totalMinutes / goal.targetMinutes : null,
    practices: computePracticeStats(sessions, { insertionOrder: true }),
  };
}

/**
 * Gets calendar heatmap data for an inclusive date range.
 */
export async function getSadhanaCalendar(opts: { start?: string; end?: string } = {}) {
  const end = opts.end ?? todayStr();
  const start = opts.start ?? addDaysDateOnly(end, -364);

  const sessions = await sadhanaRepo.findSessionsByDateRange(
    utcDate(start),
    utcDate(end)
  );

  const dayMap = new Map<
    string,
    {
      malas: number;
      mantras: number;
      count: number;
      activity: number;
      minutes: number;
      sessions: number;
    }
  >();

  for (const date of eachDateOnlyInRange(start, end)) {
    dayMap.set(date, {
      malas: 0,
      mantras: 0,
      count: 0,
      activity: 0,
      minutes: 0,
      sessions: 0,
    });
  }

  for (const session of sessions) {
    const ds = dateStr(session.date as Date);
    const cur = dayMap.get(ds) ?? {
      malas: 0,
      mantras: 0,
      count: 0,
      activity: 0,
      minutes: 0,
      sessions: 0,
    };
    let malas = 0;
    let mantras = 0;
    let count = 0;
    let activity = 0;
    for (const item of session.items) {
      const itemTotals = countSadhanaItem(item);
      malas += itemTotals.malas;
      mantras += itemTotals.mantras;
      count += itemTotals.count;
      activity += itemTotals.activity;
    }
    dayMap.set(ds, {
      malas: cur.malas + malas,
      mantras: cur.mantras + mantras,
      count: cur.count + count,
      activity: cur.activity + activity,
      minutes: cur.minutes + (session.durationMinutes ?? 0),
      sessions: cur.sessions + 1,
    });
  }

  return [...dayMap.entries()]
    .map(([date, d]) => ({
      date,
      totalMalas: d.malas,
      totalMantras: d.mantras,
      totalCount: d.count,
      activityScore: d.activity,
      totalMinutes: d.minutes,
      sessionCount: d.sessions,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function listSadhanaSessions(opts: { from?: string; to?: string }) {
  const fromDate = opts.from ? utcDate(opts.from) : new Date(0);
  const toDate = opts.to ? utcDate(opts.to) : utcDate(todayStr());
  const sessions = await sadhanaRepo.findSessionsByDateRange(fromDate, toDate);
  return sessions.map(formatSession);
}

export async function createSadhanaSession(data: {
  date: string;
  startedAt?: string | null;
  durationMinutes?: number | null;
  notes?: string | null;
  items: {
    practiceId: string;
    quantity: number;
    unit?: string;
    durationMinutes?: number | null;
    notes?: string | null;
  }[];
}) {
  const session = await sadhanaRepo.createSessionWithItems(
    data.date,
    data.startedAt,
    data.durationMinutes,
    data.notes,
    data.items.map((it) => ({
      practiceId: it.practiceId,
      quantity: it.quantity,
      unit: it.unit,
      durationMinutes: it.durationMinutes,
      notes: it.notes,
    }))
  );
  return formatSession(session);
}

export async function updateSadhanaSession(
  id: string,
  data: {
    date?: string;
    startedAt?: string | null;
    durationMinutes?: number | null;
    notes?: string | null;
    items?: {
      id?: string;
      practiceId: string;
      quantity: number;
      unit?: string;
      durationMinutes?: number | null;
      notes?: string | null;
    }[];
  }
) {
  const existing = await sadhanaRepo.findSessionById(id);
  if (!existing) throw new SadhanaNotFoundError("Sessie niet gevonden");

  const session = await sadhanaRepo.updateSessionWithItems(
    id,
    data.date ?? dateStr(existing.date as Date),
    data.startedAt !== undefined ? data.startedAt : existing.startedAt?.toISOString(),
    data.durationMinutes !== undefined ? data.durationMinutes : existing.durationMinutes,
    data.notes !== undefined ? data.notes : existing.notes,
    data.items ??
      existing.items.map((item) => ({
        id: item.id,
        practiceId: item.practiceId,
        quantity: item.quantity,
        unit: item.unit,
        durationMinutes: item.durationMinutes,
        notes: item.notes,
      }))
  );
  return formatSession(session);
}

export async function deleteSadhanaSession(id: string) {
  const existing = await sadhanaRepo.findSessionById(id);
  if (!existing) throw new SadhanaNotFoundError("Sessie niet gevonden");
  await sadhanaRepo.deleteSession(id);
}

export async function listSadhanaPractices(activeOnly = false) {
  const practices = await sadhanaRepo.findAllPractices(activeOnly);
  return practices.map(formatPractice);
}

export async function createSadhanaPractice(data: Prisma.SadhanaPracticeCreateInput) {
  const practice = await sadhanaRepo.createPractice(data);
  return formatPractice(practice);
}

export async function updateSadhanaPractice(
  id: string,
  data: Prisma.SadhanaPracticeUpdateInput
) {
  const existing = await sadhanaRepo.findPracticeById(id);
  if (!existing) throw new SadhanaNotFoundError("Beoefening niet gevonden");
  const practice = await sadhanaRepo.updatePractice(id, data);
  return formatPractice(practice);
}

export async function deactivateSadhanaPractice(id: string) {
  const existing = await sadhanaRepo.findPracticeById(id);
  if (!existing) throw new SadhanaNotFoundError("Beoefening niet gevonden");
  await sadhanaRepo.deletePractice(id);
}

export async function createSadhanaGoal(data: {
  type: string;
  name?: string | null;
  targetMalas: number;
  targetMinutes?: number | null;
  practiceIds?: string[];
}) {
  if (data.practiceIds && data.practiceIds.length > 0) {
    for (const pid of data.practiceIds) {
      const practice = await sadhanaRepo.findPracticeById(pid);
      if (!practice)
        throw new GoalPracticeNotFoundError(`Beoefening niet gevonden: ${pid}`);
    }
  }
  const goal = await sadhanaRepo.createGoal({
    type: data.type as "daily" | "weekly" | "lifetime",
    name: data.name ?? null,
    targetMalas: data.targetMalas,
    targetMinutes: data.targetMinutes ?? null,
    active: true,
    ...(data.practiceIds &&
      data.practiceIds.length > 0 && {
        practices: { connect: data.practiceIds.map((pid) => ({ id: pid })) },
      }),
  });
  return formatGoal(goal);
}

export async function updateSadhanaGoal(
  id: string,
  data: {
    name?: string | null;
    targetMalas?: number;
    targetMinutes?: number | null;
    active?: boolean;
    practiceIds?: string[];
  }
) {
  const existing = await sadhanaRepo.findGoalById(id);
  if (!existing) throw new SadhanaNotFoundError("Doel niet gevonden");

  if (data.practiceIds !== undefined && data.practiceIds.length > 0) {
    for (const pid of data.practiceIds) {
      const practice = await sadhanaRepo.findPracticeById(pid);
      if (!practice)
        throw new GoalPracticeNotFoundError(`Beoefening niet gevonden: ${pid}`);
    }
  }

  const goal = await sadhanaRepo.updateGoal(id, {
    ...(data.name !== undefined && { name: data.name }),
    ...(data.targetMalas !== undefined && { targetMalas: data.targetMalas }),
    ...(data.targetMinutes !== undefined && { targetMinutes: data.targetMinutes }),
    ...(data.active !== undefined && { active: data.active }),
    ...(data.practiceIds !== undefined && {
      practices: { set: data.practiceIds.map((pid) => ({ id: pid })) },
    }),
  });
  return formatGoal(goal);
}

export async function deleteSadhanaGoal(id: string) {
  const existing = await sadhanaRepo.findGoalById(id);
  if (!existing) throw new SadhanaNotFoundError("Doel niet gevonden");
  await sadhanaRepo.deleteGoal(id);
}

export async function listSadhanaRoutines() {
  const routines = await sadhanaRepo.findAllRoutines();
  return routines.map(formatRoutine);
}

export async function createSadhanaRoutine(data: Prisma.SadhanaRoutineCreateInput) {
  const routine = await sadhanaRepo.createRoutine(data);
  return formatRoutine(routine);
}

export async function updateSadhanaRoutine(
  id: string,
  data:
    | {
        name?: string;
        active?: boolean;
        items: {
          id?: string;
          practiceId: string;
          quantity: number;
          unit: string;
          sortOrder: number;
        }[];
      }
    | Prisma.SadhanaRoutineUpdateInput
) {
  const existing = await sadhanaRepo.findRoutineById(id);
  if (!existing) throw new SadhanaNotFoundError("Routine niet gevonden");

  const routineData = data as {
    name?: string;
    active?: boolean;
    items?: {
      id?: string;
      practiceId: string;
      quantity: number;
      unit: string;
      sortOrder: number;
    }[];
  };

  const routine = Array.isArray(routineData.items)
    ? await sadhanaRepo.updateRoutineWithItems(
        id,
        routineData.name || existing.name,
        routineData.items,
        routineData.active
      )
    : await sadhanaRepo.updateRoutine(id, data as Prisma.SadhanaRoutineUpdateInput);

  return formatRoutine(routine);
}

export async function deleteSadhanaRoutine(id: string) {
  const existing = await sadhanaRepo.findRoutineById(id);
  if (!existing) throw new SadhanaNotFoundError("Routine niet gevonden");
  await sadhanaRepo.deleteRoutine(id);
}

/**
 * Gets all goals with their current progress.
 */
export async function getGoalsWithProgress() {
  const goals = await sadhanaRepo.findGoalsWithPractices();

  const today = todayStr();
  const todayDate = utcDate(today);

  // Calculate start of week (Monday)
  const startOfWeek = new Date(todayDate);
  const day = startOfWeek.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  startOfWeek.setUTCDate(todayDate.getUTCDate() - diff);

  const hasLifetime = goals.some((g) => g.type === "lifetime");
  const hasWeekly = goals.some((g) => g.type === "weekly");
  const hasDaily = goals.some((g) => g.type === "daily");

  let minDate: Date | undefined;
  if (hasLifetime) minDate = undefined;
  else if (hasWeekly) minDate = startOfWeek;
  else if (hasDaily) minDate = todayDate;

  // Pre-fetch all needed sessions once
  const sessions = minDate
    ? await sadhanaRepo.findSessionsByDateRange(minDate, todayDate)
    : await sadhanaRepo.findAllSessions();

  const completedSessions = sessions.filter((s) =>
    isOnOrBefore(s.date as Date, todayDate)
  );

  return goals.map((goal) => {
    let progressMalas = 0;
    let progressMinutes = 0;
    const practiceIds = goal.practices.map((p) => p.id);

    let start: Date | undefined;
    let end: Date | undefined;

    if (goal.type === "daily") {
      start = todayDate;
      end = todayDate;
    } else if (goal.type === "weekly") {
      start = startOfWeek;
      end = todayDate;
    }

    const goalSessions =
      start && end
        ? completedSessions.filter((s) =>
            isWithinInclusiveRange(s.date as Date, start!, end!)
          )
        : completedSessions;

    // Filter sessions by linked practices if any
    for (const s of goalSessions) {
      // If goal has specific practices, we only count items from those practices.
      // If not, we count everything.
      const items =
        practiceIds.length > 0
          ? s.items.filter((i) => practiceIds.includes(i.practiceId))
          : s.items;

      if (practiceIds.length === 0) {
        progressMinutes += s.durationMinutes ?? 0;
      } else if (items.length > 0) {
        const itemMinutes = items.reduce(
          (sum, item) => sum + (item.durationMinutes ?? 0),
          0
        );
        if (itemMinutes > 0) {
          progressMinutes += itemMinutes;
        } else if (items.length === s.items.length) {
          // No per-item minutes recorded, but every item in this session belongs
          // to the goal → the whole session duration is attributable to it.
          progressMinutes += s.durationMinutes ?? 0;
        }
        // else: a mixed session (also has non-goal practices) without per-item
        // minutes → no basis to attribute session time to this goal; skip
        // instead of over-counting the whole session.
      }

      for (const item of items) {
        const totals = countSadhanaItem(item);
        progressMalas += totals.malas;
      }
    }

    return {
      ...formatGoal(goal),
      progressMalas,
      progressMinutes,
    };
  });
}
