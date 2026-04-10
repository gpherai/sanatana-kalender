import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { formatSession, utcDate } from "../../_helpers";

type Params = { params: Promise<{ id: string }> };

const INCLUDE_ITEMS = {
  items: {
    include: { practice: true },
    orderBy: { createdAt: "asc" as const },
  },
} as const;

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.sadhanaSession.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const session = await prisma.$transaction(async (tx) => {
    await tx.sadhanaSession.update({
      where: { id },
      data: {
        ...(body.date !== undefined && { date: utcDate(body.date) }),
        ...(body.started_at !== undefined && {
          startedAt: body.started_at ? new Date(body.started_at) : null,
        }),
        ...(body.duration_minutes !== undefined && {
          durationMinutes: body.duration_minutes ?? null,
        }),
        ...(body.notes !== undefined && { notes: body.notes ?? null }),
      },
    });

    // If items are provided, replace all items
    if (Array.isArray(body.items)) {
      await tx.sadhanaSessionItem.deleteMany({ where: { sessionId: id } });
      for (const item of body.items) {
        const practice = await tx.sadhanaPractice.findUnique({
          where: { id: item.practice_id },
        });
        if (!practice) throw new Error(`Practice ${item.practice_id} not found`);
        await tx.sadhanaSessionItem.create({
          data: {
            sessionId: id,
            practiceId: item.practice_id,
            quantity: item.quantity,
            unit: item.unit ?? "malas",
            durationMinutes: item.duration_minutes ?? null,
            notes: item.notes ?? null,
          },
        });
      }
    }

    return tx.sadhanaSession.findUniqueOrThrow({
      where: { id },
      include: INCLUDE_ITEMS,
    });
  });

  return NextResponse.json(formatSession(session));
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const existing = await prisma.sadhanaSession.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.sadhanaSession.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
