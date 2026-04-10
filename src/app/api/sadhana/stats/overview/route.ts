import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { utcDate, todayStr, computePracticeStats } from "../../_helpers";

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
      if (item.practice.type === "mantra_japa" && item.unit === "malas") {
        malas += item.quantity;
      }
    }
  }
  return { malas, minutes, sessions: sessions.length };
}

export async function GET() {
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

  const allSessions = await prisma.sadhanaSession.findMany({
    include: { items: { include: { practice: true } } },
  });

  const all = computeTotals(allSessions);
  const week = computeTotals(allSessions.filter((s) => (s.date as Date) >= weekStart));
  const month = computeTotals(allSessions.filter((s) => (s.date as Date) >= monthStart));

  return NextResponse.json({
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
  });
}
