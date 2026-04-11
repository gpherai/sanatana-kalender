import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { formatGoal } from "../_helpers";

export async function GET() {
  const goals = await prisma.sadhanaGoal.findMany({
    orderBy: { createdAt: "desc" },
    include: { practices: true },
  });

  // For each goal, we also want to compute the current progress if it is a lifetime goal.
  const goalsWithProgress = await Promise.all(
    goals.map(async (goal) => {
      let progress = null;
      if (goal.type === "lifetime") {
        const practiceIds = goal.practices.map((p) => p.id);
        const whereClause =
          practiceIds.length > 0 ? { practiceId: { in: practiceIds } } : {};

        const items = await prisma.sadhanaSessionItem.findMany({
          where: whereClause,
          select: {
            quantity: true,
            unit: true,
            durationMinutes: true,
            practice: { select: { type: true } },
          },
        });

        let totalMalas = 0;
        for (const item of items) {
          if (item.practice.type === "mantra_japa" && item.unit === "malas") {
            totalMalas += item.quantity;
          }
        }
        progress = totalMalas;
      }

      return {
        ...formatGoal(goal),
        progress,
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
  return NextResponse.json({ ...formatGoal(goal), progress: 0 }, { status: 201 });
}
