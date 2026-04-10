import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { formatGoal } from "../../_helpers";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const goal = await prisma.sadhanaGoal.update({
    where: { id },
    data: {
      ...(body.target_malas !== undefined && { targetMalas: body.target_malas }),
      ...(body.target_minutes !== undefined && { targetMinutes: body.target_minutes }),
      ...(body.active !== undefined && { active: body.active }),
    },
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
