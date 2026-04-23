import { NextResponse } from "next/server";
import * as sadhanaRepo from "@/repositories/sadhana.repository";
import { serverError, validationError } from "@/lib/api-response";
import { logError } from "@/lib/utils";
import { createSadhanaRoutineSchema } from "@/lib/validations";

function formatRoutine(
  r: Awaited<ReturnType<typeof sadhanaRepo.findAllRoutines>>[number]
) {
  return {
    id: r.id,
    name: r.name,
    items: r.items.map((i) => ({
      id: i.id,
      practice_id: i.practiceId,
      practice_name: i.practice.name,
      practice_type: i.practice.type,
      quantity: i.quantity,
      unit: i.unit,
      sort_order: i.sortOrder,
    })),
  };
}

export async function GET() {
  try {
    const routines = await sadhanaRepo.findAllRoutines();
    return NextResponse.json(routines.map(formatRoutine));
  } catch (error) {
    logError("[SADHANA_ROUTINES_GET]", error);
    return serverError("Kon routines niet ophalen");
  }
}

export async function POST(req: Request) {
  try {
    const parsed = createSadhanaRoutineSchema.safeParse(await req.json());
    if (!parsed.success) return validationError(parsed.error);

    const routine = await sadhanaRepo.createRoutine({
      name: parsed.data.name,
      items: {
        create: parsed.data.items.map((it, idx) => ({
          practiceId: it.practice_id,
          quantity: it.quantity,
          unit: it.unit as "malas" | "count",
          sortOrder: it.sort_order ?? idx,
        })),
      },
    });

    return NextResponse.json(formatRoutine(routine), { status: 201 });
  } catch (error) {
    logError("[SADHANA_ROUTINES_POST]", error);
    return serverError("Kon routine niet aanmaken");
  }
}
