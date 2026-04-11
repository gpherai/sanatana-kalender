import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { todayStr, utcDate, computePracticeStats } from "../../_helpers";

export async function GET() {
  const today = todayStr();
  const todayDate = utcDate(today);
  const tomorrow = new Date(todayDate);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  const sessions = await prisma.sadhanaSession.findMany({
    where: { date: { gte: todayDate, lt: tomorrow } },
    include: { items: { include: { practice: true } } },
  });

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

  const goal = await prisma.sadhanaGoal.findFirst({
    where: { type: "daily", active: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    date: today,
    total_malas: totalMalas,
    total_minutes: totalMinutes,
    total_mantras: totalMantras,
    goal_malas_target: goal?.targetMalas ?? null,
    goal_malas_progress: goal?.targetMalas ? totalMalas / goal.targetMalas : null,
    goal_minutes_target: goal?.targetMinutes ?? null,
    goal_minutes_progress: goal?.targetMinutes ? totalMinutes / goal.targetMinutes : null,
    practices: computePracticeStats(sessions, { insertionOrder: true }),
  });
}
