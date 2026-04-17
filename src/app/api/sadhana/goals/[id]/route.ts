import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { formatGoal } from "../../_helpers";

const patchGoalSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  target_malas: z.number().int().positive().optional(),
  target_minutes: z.number().int().positive().nullable().optional(),
  active: z.boolean().optional(),
  practice_ids: z.array(z.string().min(1)).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const parsed = patchGoalSchema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { name, target_malas, target_minutes, active, practice_ids } = parsed.data;
  const goal = await prisma.sadhanaGoal.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(target_malas !== undefined && { targetMalas: target_malas }),
      ...(target_minutes !== undefined && { targetMinutes: target_minutes }),
      ...(active !== undefined && { active }),
      ...(practice_ids !== undefined && {
        practices: { set: practice_ids.map((pid) => ({ id: pid })) },
      }),
    },
    include: { practices: true },
  });
  return NextResponse.json(formatGoal(goal));
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.sadhanaGoal.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
