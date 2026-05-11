import { NextResponse } from "next/server";
import {
  errorResponse,
  notFoundError,
  parseJsonBody,
  serverError,
  validationError,
} from "@/lib/api-response";
import { logError } from "@/lib/utils";
import { cuidSchema, patchSadhanaGoalSchema } from "@/lib/validations";
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
    if (!cuidSchema.safeParse(id).success)
      return errorResponse("Ongeldig ID formaat", 400);
    const bodyResult = await parseJsonBody(req);
    if (!bodyResult.ok) return bodyResult.response;
    const parsed = patchSadhanaGoalSchema.safeParse(bodyResult.data);
    if (!parsed.success) return validationError(parsed.error);

    const { name, targetMalas, targetMinutes, active, practiceIds } = parsed.data;
    const goal = await updateSadhanaGoal(id, {
      ...(name !== undefined && { name }),
      ...(targetMalas !== undefined && { targetMalas }),
      ...(targetMinutes !== undefined && { targetMinutes }),
      ...(active !== undefined && { active }),
      ...(practiceIds !== undefined && { practiceIds }),
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
    if (!cuidSchema.safeParse(id).success)
      return errorResponse("Ongeldig ID formaat", 400);
    await deleteSadhanaGoal(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof SadhanaNotFoundError) return notFoundError("Doel");
    logError("[SADHANA_GOAL_DELETE]", error);
    return serverError("Kon doel niet verwijderen");
  }
}
