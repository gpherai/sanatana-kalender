import { NextResponse } from "next/server";
import { serverError, validationError, notFoundError } from "@/lib/api-response";
import { logError } from "@/lib/utils";
import { patchSadhanaRoutineSchema } from "@/lib/validations";
import {
  deleteSadhanaRoutine,
  SadhanaNotFoundError,
  updateSadhanaRoutine,
} from "@/services/sadhana.service";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const parsed = patchSadhanaRoutineSchema.safeParse(await req.json());
    if (!parsed.success) return validationError(parsed.error);

    const { name, active, items } = parsed.data;

    const routine =
      items !== undefined
        ? await updateSadhanaRoutine(id, {
            ...(name !== undefined && { name }),
            items: items.map((it, idx) => ({ ...it, sort_order: it.sort_order ?? idx })),
          })
        : await updateSadhanaRoutine(id, {
            ...(name !== undefined && { name }),
            ...(active !== undefined && { active }),
          });

    return NextResponse.json(routine);
  } catch (error) {
    if (error instanceof SadhanaNotFoundError) return notFoundError("Routine");
    logError("[SADHANA_ROUTINE_PATCH]", error);
    return serverError("Kon routine niet bijwerken");
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    await deleteSadhanaRoutine(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof SadhanaNotFoundError) return notFoundError("Routine");
    logError("[SADHANA_ROUTINE_DELETE]", error);
    return serverError("Kon routine niet verwijderen");
  }
}
