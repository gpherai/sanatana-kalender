import { NextResponse } from "next/server";
import { formatGoal } from "@/services/sadhana-formatters";
import * as sadhanaRepo from "@/repositories/sadhana.repository";
import { serverError, validationError, notFoundError } from "@/lib/api-response";
import { logError } from "@/lib/utils";
import { patchSadhanaGoalSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const parsed = patchSadhanaGoalSchema.safeParse(await req.json());
    if (!parsed.success) return validationError(parsed.error);

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
    logError("[SADHANA_GOAL_PATCH]", error);
    return serverError("Kon doel niet bijwerken");
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const existing = await sadhanaRepo.findGoalById(id);
    if (!existing) return notFoundError("Doel");

    await sadhanaRepo.deleteGoal(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logError("[SADHANA_GOAL_DELETE]", error);
    return serverError("Kon doel niet verwijderen");
  }
}
