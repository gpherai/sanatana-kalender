import { NextResponse } from "next/server";
import { z } from "zod";
import * as sadhanaRepo from "@/repositories/sadhana.repository";
import { formatGoal } from "../../_helpers";

const patchGoalSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  target_malas: z.number().int().positive().optional(),
  target_minutes: z.number().int().positive().nullable().optional(),
  active: z.boolean().optional(),
  practice_ids: z.array(z.string().min(1)).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const parsed = patchGoalSchema.safeParse(await req.json());
    if (!parsed.success)
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const { name, target_malas, target_minutes, active, practice_ids } = parsed.data;
    const goal = await sadhanaRepo.updateGoal(id, {
      ...(name !== undefined && { name }),
      ...(target_malas !== undefined && { targetMalas: target_malas }),
      ...(target_minutes !== undefined && { targetMinutes: target_minutes }),
      ...(active !== undefined && { active }),
      ...(practice_ids !== undefined && {
        practices: { set: practice_ids.map((pid) => ({ id: pid })) },
      }),
    });
    return NextResponse.json(formatGoal(goal));
  } catch (error) {
    console.error("[SADHANA_GOAL_PATCH]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await sadhanaRepo.deleteGoal(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[SADHANA_GOAL_DELETE]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
