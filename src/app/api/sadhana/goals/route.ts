import { NextResponse } from "next/server";
import { formatGoal } from "@/services/sadhana-formatters";
import * as sadhanaRepo from "@/repositories/sadhana.repository";
import { getGoalsWithProgress } from "@/services/sadhana.service";
import { serverError, validationError } from "@/lib/api-response";
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
    const parsed = createSadhanaGoalSchema.safeParse(await req.json());
    if (!parsed.success) return validationError(parsed.error);

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
    logError("[SADHANA_GOALS_POST]", error);
    return serverError("Kon doel niet aanmaken");
  }
}
