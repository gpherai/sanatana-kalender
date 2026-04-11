import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { formatGoal, todayStr, utcDate } from "../_helpers";

export async function GET() {
  const goals = await prisma.sadhanaGoal.findMany({
    orderBy: { createdAt: "desc" },
    include: { practices: true },
  });

  const today = todayStr();
  const todayDate = utcDate(today);

  // Calculate start of week (Monday)
  const startOfWeek = new Date(todayDate);
  const day = startOfWeek.getUTCDay(); // 0 is Sunday, 1 is Monday
  const diff = day === 0 ? 6 : day - 1; // diff from Monday
  startOfWeek.setUTCDate(startOfWeek.getUTCDate() - diff);

  const tomorrow = new Date(todayDate);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  // For each goal, we compute the current progress based on its type and linked practices.
  const goalsWithProgress = await Promise.all(
    goals.map(async (goal) => {
      let progressMalas = 0;
      let progressMinutes = 0;
      const practiceIds = goal.practices.map((p) => p.id);

      let dateFilter = {};
      if (goal.type === "daily") {
        dateFilter = { date: { gte: todayDate, lt: tomorrow } };
      } else if (goal.type === "weekly") {
        dateFilter = { date: { gte: startOfWeek, lt: tomorrow } };
      }

      const sessions = await prisma.sadhanaSession.findMany({
        where: dateFilter,
        include: {
          items: {
            where: practiceIds.length > 0 ? { practiceId: { in: practiceIds } } : {},
            include: { practice: { select: { type: true } } },
          },
        },
      });

      for (const s of sessions) {
        progressMinutes += s.durationMinutes ?? 0;
        for (const item of s.items) {
          if (item.unit === "malas") {
            progressMalas += item.quantity;
          } else if (item.practice.type === "mantra_japa" && item.unit === "count") {
            progressMalas += item.quantity / 108;
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

  return NextResponse.json(goalsWithProgress);
}

export async function POST(req: Request) {
  const body = await req.json();
  const goal = await prisma.sadhanaGoal.create({
    data: {
      type: body.type,
      name: body.name || null,
      targetMalas: body.target_malas,
      targetMinutes: body.target_minutes ?? null,
      active: true,
      ...(body.practice_ids &&
        body.practice_ids.length > 0 && {
          practices: {
            connect: body.practice_ids.map((id: string) => ({ id })),
          },
        }),
    },
    include: { practices: true },
  });
  return NextResponse.json(
    { ...formatGoal(goal), progress_malas: 0, progress_minutes: 0 },
    { status: 201 }
  );
}
