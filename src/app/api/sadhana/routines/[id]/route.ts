import { NextResponse } from "next/server";
import { z } from "zod";
import * as sadhanaRepo from "@/repositories/sadhana.repository";

const patchSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  active: z.boolean().optional(),
  items: z
    .array(
      z.object({
        practice_id: z.string().min(1),
        quantity: z.number().int().min(1),
        unit: z.enum(["malas", "count"]).default("malas"),
        sort_order: z.number().int().default(0),
      })
    )
    .min(1)
    .optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = patchSchema.safeParse(await req.json());
    if (!body.success)
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const { name, active, items } = body.data;

    let routine;
    if (items !== undefined) {
      routine = await sadhanaRepo.updateRoutineWithItems(
        id,
        name ?? "", // This is a bit weak, but if name is undefined we should fetch existing first
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
    console.error("[SADHANA_ROUTINE_PATCH]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await sadhanaRepo.deleteRoutine(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[SADHANA_ROUTINE_DELETE]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
