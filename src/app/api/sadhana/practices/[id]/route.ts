import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { formatPractice } from "../../_helpers";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();

  const practice = await prisma.sadhanaPractice.findUnique({ where: { id } });
  if (!practice) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.sadhanaPractice.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.type !== undefined && { type: body.type }),
      ...(body.notes !== undefined && { notes: body.notes ?? null }),
      ...(body.active !== undefined && { active: body.active }),
    },
  });

  return NextResponse.json(formatPractice(updated));
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const practice = await prisma.sadhanaPractice.findUnique({ where: { id } });
  if (!practice) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.sadhanaPractice.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
