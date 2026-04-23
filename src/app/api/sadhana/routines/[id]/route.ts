import { NextResponse } from "next/server";
import * as sadhanaRepo from "@/repositories/sadhana.repository";
import { serverError, validationError, notFoundError } from "@/lib/api-response";
import { logError } from "@/lib/utils";
import { patchSadhanaRoutineSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const parsed = patchSadhanaRoutineSchema.safeParse(await req.json());
    if (!parsed.success) return validationError(parsed.error);

    const existing = await sadhanaRepo.findRoutineById(id);
    if (!existing) return notFoundError("Routine");

    const { name, active, items } = parsed.data;

    let routine;
    if (items !== undefined) {
      routine = await sadhanaRepo.updateRoutineWithItems(
        id,
        name ?? existing.name,
        items
      );
    } else {
      routine = await sadhanaRepo.updateRoutine(id, {
        ...(name !== undefined && { name }),
        ...(active !== undefined && { active }),
      });
    }

    return NextResponse.json({
      id: routine.id,
      name: routine.name,
      active: routine.active,
      items: routine.items.map((i) => ({
        id: i.id,
        practice_id: i.practiceId,
        practice_name: i.practice.name,
        practice_type: i.practice.type,
        quantity: i.quantity,
        unit: i.unit,
        sort_order: i.sortOrder,
      })),
    });
  } catch (error) {
    logError("[SADHANA_ROUTINE_PATCH]", error);
    return serverError("Kon routine niet bijwerken");
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const existing = await sadhanaRepo.findRoutineById(id);
    if (!existing) return notFoundError("Routine");

    await sadhanaRepo.deleteRoutine(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logError("[SADHANA_ROUTINE_DELETE]", error);
    return serverError("Kon routine niet verwijderen");
  }
}
