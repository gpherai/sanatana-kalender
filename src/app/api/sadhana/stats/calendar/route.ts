import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { dateStr } from "../../_helpers";

export async function GET() {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 364);
  since.setUTCHours(0, 0, 0, 0);

  const sessions = await prisma.sadhanaSession.findMany({
    where: { date: { gte: since } },
    include: { items: { include: { practice: true } } },
    orderBy: { date: "asc" },
  });

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

  const result = [...dayMap.entries()]
    .map(([date, d]) => ({
      date,
      total_malas: d.malas,
      total_minutes: d.minutes,
      session_count: d.sessions,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json(result);
}
