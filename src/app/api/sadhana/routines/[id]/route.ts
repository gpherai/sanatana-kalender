import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

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
  const { id } = await params;
  const body = patchSchema.safeParse(await req.json());
  if (!body.success)
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { name, active, items } = body.data;

  const routine = await prisma.sadhanaRoutine.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(active !== undefined && { active }),
      ...(items !== undefined && {
        items: {
          deleteMany: {},
          create: items.map((it, idx) => ({
            practiceId: it.practice_id,
            quantity: it.quantity,
            unit: it.unit as "malas" | "count",
            sortOrder: it.sort_order ?? idx,
          })),
        },
      }),
    },
    include: {
      items: { include: { practice: true }, orderBy: { sortOrder: "asc" } },
    },
  });

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
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.sadhanaRoutine.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
