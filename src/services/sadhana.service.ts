/**
 * Sadhana Service
 *
 * Business logic layer for Sadhana tracking.
 * Coordinates between repositories and performs calculations.
 *
 * @module services/sadhana
 */

import * as sadhanaRepo from "@/repositories/sadhana.repository";
import {
  utcDate,
  todayStr,
  computePracticeStats,
  dateStr,
  formatGoal,
} from "@/services/sadhana-formatters";

function isOnOrBefore(date: Date, end: Date) {
  return date.getTime() <= end.getTime();
}

function isWithinInclusiveRange(date: Date, start: Date, end: Date) {
  const time = date.getTime();
  return time >= start.getTime() && time <= end.getTime();
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
        malas += item.quantity / 108;
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
    total_sessions: all.sessions,
    total_malas_all_time: all.malas,
    total_minutes_all_time: all.minutes,
    total_sessions_this_week: week.sessions,
    total_sessions_this_month: month.sessions,
    total_malas_this_week: week.malas,
    total_malas_this_month: month.malas,
    total_minutes_this_week: week.minutes,
    total_minutes_this_month: month.minutes,
    avg_malas_per_session: all.sessions > 0 ? all.malas / all.sessions : 0,
    avg_minutes_per_session: all.sessions > 0 ? all.minutes / all.sessions : 0,
    practices: computePracticeStats(allSessions),
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
      current_streak: 0,
      longest_streak: 0,
      last_session_date: null,
    };
  }

  const d = new Date();
  d.setDate(d.getDate() - 1);
  const yesterday = dateStr(d);

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
    current_streak: currentStreak,
    longest_streak: Math.max(longestStreak, currentStreak),
    last_session_date: dates[0]!,
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
  let totalMinutes = 0;

  for (const session of sessions) {
    totalMinutes += session.durationMinutes ?? 0;
    for (const item of session.items) {
      if (item.practice.type === "mantra_japa") {
        if (item.unit === "malas") {
          totalMalas += item.quantity;
          totalMantras += item.quantity * 108;
        } else {
          totalMantras += item.quantity;
        }
      }
    }
  }

  const goal = await sadhanaRepo.findDailyGoal();

  return {
    date: today,
    total_malas: totalMalas,
    total_minutes: totalMinutes,
    total_mantras: totalMantras,
    goal_malas_target: goal?.targetMalas ?? null,
    goal_malas_progress: goal?.targetMalas ? totalMalas / goal.targetMalas : null,
    goal_minutes_target: goal?.targetMinutes ?? null,
    goal_minutes_progress: goal?.targetMinutes ? totalMinutes / goal.targetMinutes : null,
    practices: computePracticeStats(sessions, { insertionOrder: true }),
  };
}

/**
 * Gets calendar heatmap data for the last year.
 */
export async function getSadhanaCalendar() {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 364);
  since.setUTCHours(0, 0, 0, 0);

  const today = new Date();
  today.setUTCHours(23, 59, 59, 999);

  const sessions = await sadhanaRepo.findSessionsByDateRange(since, today);

  const dayMap = new Map<string, { malas: number; minutes: number; sessions: number }>();

  for (const session of sessions) {
    const ds = dateStr(session.date as Date);
    const cur = dayMap.get(ds) ?? { malas: 0, minutes: 0, sessions: 0 };
    let malas = 0;
    for (const item of session.items) {
      if (item.practice.type === "mantra_japa" && item.unit === "malas") {
        malas += item.quantity;
      }
    }
    dayMap.set(ds, {
      malas: cur.malas + malas,
      minutes: cur.minutes + (session.durationMinutes ?? 0),
      sessions: cur.sessions + 1,
    });
  }

  return [...dayMap.entries()]
    .map(([date, d]) => ({
      date,
      total_malas: d.malas,
      total_minutes: d.minutes,
      session_count: d.sessions,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
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

  return Promise.all(
    goals.map(async (goal) => {
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

      const sessions =
        start && end
          ? await sadhanaRepo.findSessionsByDateRange(start, end)
          : await sadhanaRepo.findAllSessions();
      const completedSessions = sessions.filter((s) =>
        isOnOrBefore(s.date as Date, todayDate)
      );

      // Filter sessions by linked practices if any
      for (const s of completedSessions) {
        // If goal has specific practices, we only count items from those practices.
        // If not, we count everything.
        const items =
          practiceIds.length > 0
            ? s.items.filter((i) => practiceIds.includes(i.practiceId))
            : s.items;

        if (
          items.length > 0 ||
          (practiceIds.length === 0 && (s.durationMinutes ?? 0) > 0)
        ) {
          progressMinutes += s.durationMinutes ?? 0;
          for (const item of items) {
            if (item.unit === "malas") {
              progressMalas += item.quantity;
            } else if (item.practice.type === "mantra_japa" && item.unit === "count") {
              progressMalas += item.quantity / 108;
            }
          }
        }
      }

      return {
        ...formatGoal(goal),
        progress_malas: progressMalas,
        progress_minutes: progressMinutes,
      };
    })
  );
}
