import { NextResponse } from "next/server";
import {
  errorResponse,
  parseJsonBody,
  serverError,
  validationError,
} from "@/lib/api-response";
import { logError } from "@/lib/utils";
import { createSadhanaRoutineSchema } from "@/lib/validations";
import { createSadhanaRoutine, listSadhanaRoutines } from "@/services/sadhana.service";
import { Prisma } from "@prisma/client";

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
    const bodyResult = await parseJsonBody(req);
    if (!bodyResult.ok) return bodyResult.response;
    const parsed = createSadhanaRoutineSchema.safeParse(bodyResult.data);
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
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return errorResponse("Beoefening niet gevonden", 400);
    }
    logError("[SADHANA_ROUTINES_POST]", error);
    return serverError("Kon routine niet aanmaken");
  }
}
