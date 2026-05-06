import { NextResponse } from "next/server";
import {
  createSadhanaGoal,
  getGoalsWithProgress,
  GoalPracticeNotFoundError,
} from "@/services/sadhana.service";
import {
  notFoundError,
  parseJsonBody,
  serverError,
  validationError,
} from "@/lib/api-response";
import { logError } from "@/lib/utils";
import { createSadhanaGoalSchema } from "@/lib/validations";

export async function GET() {
  try {
    const goalsWithProgress = await getGoalsWithProgress();
    return NextResponse.json(goalsWithProgress);
  } catch (error) {
    logError("[SADHANA_GOALS_GET]", error);
    return serverError("Kon doelen niet ophalen");
  }
}

export async function POST(req: Request) {
  try {
    const bodyResult = await parseJsonBody(req);
    if (!bodyResult.ok) return bodyResult.response;
    const parsed = createSadhanaGoalSchema.safeParse(bodyResult.data);
    if (!parsed.success) return validationError(parsed.error);

    const { type, name, target_malas, target_minutes, practice_ids } = parsed.data;
    const goal = await createSadhanaGoal({
      type,
      name: name ?? null,
      targetMalas: target_malas,
      targetMinutes: target_minutes ?? null,
      practice_ids,
    });
    return NextResponse.json(
      { ...goal, progress_malas: 0, progress_minutes: 0 },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof GoalPracticeNotFoundError) return notFoundError("Beoefening");
    logError("[SADHANA_GOALS_POST]", error);
    return serverError("Kon doel niet aanmaken");
  }
}
