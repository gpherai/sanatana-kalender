import { NextResponse } from "next/server";
import { serverError, validationError, notFoundError } from "@/lib/api-response";
import { logError } from "@/lib/utils";
import { patchSadhanaGoalSchema } from "@/lib/validations";
import {
  deleteSadhanaGoal,
  GoalPracticeNotFoundError,
  SadhanaNotFoundError,
  updateSadhanaGoal,
} from "@/services/sadhana.service";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const parsed = patchSadhanaGoalSchema.safeParse(await req.json());
    if (!parsed.success) return validationError(parsed.error);

    const { name, target_malas, target_minutes, active, practice_ids } = parsed.data;
    const goal = await updateSadhanaGoal(id, {
      ...(name !== undefined && { name }),
      ...(target_malas !== undefined && { targetMalas: target_malas }),
      ...(target_minutes !== undefined && { targetMinutes: target_minutes }),
      ...(active !== undefined && { active }),
      ...(practice_ids !== undefined && { practice_ids }),
    });
    return NextResponse.json(goal);
  } catch (error) {
    if (error instanceof SadhanaNotFoundError) return notFoundError("Doel");
    if (error instanceof GoalPracticeNotFoundError) return notFoundError("Beoefening");
    logError("[SADHANA_GOAL_PATCH]", error);
    return serverError("Kon doel niet bijwerken");
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    await deleteSadhanaGoal(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof SadhanaNotFoundError) return notFoundError("Doel");
    logError("[SADHANA_GOAL_DELETE]", error);
    return serverError("Kon doel niet verwijderen");
  }
}
