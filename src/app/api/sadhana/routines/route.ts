import { NextResponse } from "next/server";
import { serverError, validationError } from "@/lib/api-response";
import { logError } from "@/lib/utils";
import { createSadhanaRoutineSchema } from "@/lib/validations";
import { createSadhanaRoutine, listSadhanaRoutines } from "@/services/sadhana.service";

export async function GET() {
  try {
    const routines = await listSadhanaRoutines();
    return NextResponse.json(routines);
  } catch (error) {
    logError("[SADHANA_ROUTINES_GET]", error);
    return serverError("Kon routines niet ophalen");
  }
}

export async function POST(req: Request) {
  try {
    const parsed = createSadhanaRoutineSchema.safeParse(await req.json());
    if (!parsed.success) return validationError(parsed.error);

    const routine = await createSadhanaRoutine({
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

    return NextResponse.json(routine, { status: 201 });
  } catch (error) {
    logError("[SADHANA_ROUTINES_POST]", error);
    return serverError("Kon routine niet aanmaken");
  }
}
