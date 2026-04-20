import { NextResponse } from "next/server";
import { z } from "zod";
import { formatGoal } from "../_helpers";
import * as sadhanaRepo from "@/repositories/sadhana.repository";
import { getGoalsWithProgress } from "@/services/sadhana.service";

const createGoalSchema = z.object({
  type: z.enum(["daily", "weekly", "lifetime"]),
  name: z.string().min(1).max(100).optional(),
  target_malas: z.number().int().positive(),
  target_minutes: z.number().int().positive().nullable().optional(),
  practice_ids: z.array(z.string().min(1)).optional(),
});

export async function GET() {
  try {
    const goalsWithProgress = await getGoalsWithProgress();
    return NextResponse.json(goalsWithProgress);
  } catch (error) {
    console.error("[SADHANA_GOALS_GET]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const parsed = createGoalSchema.safeParse(await req.json());
    if (!parsed.success)
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const { type, name, target_malas, target_minutes, practice_ids } = parsed.data;
    const goal = await sadhanaRepo.createGoal({
      type,
      name: name ?? null,
      targetMalas: target_malas,
      targetMinutes: target_minutes ?? null,
      active: true,
      ...(practice_ids &&
        practice_ids.length > 0 && {
          practices: { connect: practice_ids.map((id) => ({ id })) },
        }),
    });
    return NextResponse.json(
      { ...formatGoal(goal), progress_malas: 0, progress_minutes: 0 },
      { status: 201 }
    );
  } catch (error) {
    console.error("[SADHANA_GOALS_POST]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
