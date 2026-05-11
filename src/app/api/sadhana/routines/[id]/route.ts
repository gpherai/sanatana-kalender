import { NextResponse } from "next/server";
import {
  errorResponse,
  notFoundError,
  parseJsonBody,
  serverError,
  validationError,
} from "@/lib/api-response";
import { logError } from "@/lib/utils";
import { cuidSchema, patchSadhanaRoutineSchema } from "@/lib/validations";
import {
  deleteSadhanaRoutine,
  SadhanaNotFoundError,
  updateSadhanaRoutine,
} from "@/services/sadhana.service";
import { Prisma } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    if (!cuidSchema.safeParse(id).success)
      return errorResponse("Ongeldig ID formaat", 400);
    const bodyResult = await parseJsonBody(req);
    if (!bodyResult.ok) return bodyResult.response;
    const parsed = patchSadhanaRoutineSchema.safeParse(bodyResult.data);
    if (!parsed.success) return validationError(parsed.error);

    const { name, active, items } = parsed.data;

    const routine =
      items !== undefined
        ? await updateSadhanaRoutine(id, {
            ...(name !== undefined && { name }),
            ...(active !== undefined && { active }),
            items: items.map((it, idx) => ({ ...it, sort_order: it.sort_order ?? idx })),
          })
        : await updateSadhanaRoutine(id, {
            ...(name !== undefined && { name }),
            ...(active !== undefined && { active }),
          });

    return NextResponse.json(routine);
  } catch (error) {
    if (error instanceof SadhanaNotFoundError) return notFoundError("Routine");
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return errorResponse("Beoefening niet gevonden", 400);
    }
    logError("[SADHANA_ROUTINE_PATCH]", error);
    return serverError("Kon routine niet bijwerken");
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    if (!cuidSchema.safeParse(id).success)
      return errorResponse("Ongeldig ID formaat", 400);
    await deleteSadhanaRoutine(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof SadhanaNotFoundError) return notFoundError("Routine");
    logError("[SADHANA_ROUTINE_DELETE]", error);
    return serverError("Kon routine niet verwijderen");
  }
}
