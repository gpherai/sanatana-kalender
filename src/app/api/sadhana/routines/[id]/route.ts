import { NextRequest, NextResponse } from "next/server";
import {
  errorResponse,
  handlePrismaError,
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

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
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
            items: items.map((it, idx) => ({ ...it, sortOrder: it.sortOrder ?? idx })),
          })
        : await updateSadhanaRoutine(id, {
            ...(name !== undefined && { name }),
            ...(active !== undefined && { active }),
          });

    return NextResponse.json(routine);
  } catch (error) {
    if (error instanceof SadhanaNotFoundError) return notFoundError("Routine");

    const prismaError = handlePrismaError(error, {
      foreignKey: "Beoefening niet gevonden",
    });
    if (prismaError) return prismaError;

    logError("[SADHANA_ROUTINE_PATCH]", error);
    return serverError("Kon routine niet bijwerken");
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
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
