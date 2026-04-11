import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { dateStr, todayStr } from "../../_helpers";

export async function GET() {
  const rows = await prisma.sadhanaSession.findMany({
    select: { date: true },
    distinct: ["date"],
    orderBy: { date: "desc" },
  });

  if (rows.length === 0) {
    return NextResponse.json({
      current_streak: 0,
      longest_streak: 0,
      last_session_date: null,
    });
  }

  const dates = rows.map((r) => dateStr(r.date as Date));
  const today = todayStr();
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const yesterday = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  // Current streak
  let currentStreak = 0;
  if (dates[0] === today || dates[0] === yesterday) {
    let expected = dates[0]!;
    for (const d of dates) {
      if (d === expected) {
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

  return NextResponse.json({
    current_streak: currentStreak,
    longest_streak: Math.max(longestStreak, currentStreak),
    last_session_date: dates[0]!,
  });
}
