import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { formatSession, utcDate } from "../../_helpers";

const patchSessionItemSchema = z.object({
  practice_id: z.string().min(1),
  quantity: z.number().int().positive(),
  unit: z.enum(["malas", "count"]).optional(),
  duration_minutes: z.number().int().positive().nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

const patchSessionSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  started_at: z.string().nullable().optional(),
  duration_minutes: z.number().int().positive().nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
  items: z.array(patchSessionItemSchema).min(1).optional(),
});

type Params = { params: Promise<{ id: string }> };

const INCLUDE_ITEMS = {
  items: {
    include: { practice: true },
    orderBy: { createdAt: "asc" as const },
  },
} as const;

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const parsed = patchSessionSchema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const existing = await prisma.sadhanaSession.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { date, started_at, duration_minutes, notes, items } = parsed.data;

  const session = await prisma.$transaction(async (tx) => {
    await tx.sadhanaSession.update({
      where: { id },
      data: {
        ...(date !== undefined && { date: utcDate(date) }),
        ...(started_at !== undefined && {
          startedAt: started_at ? new Date(started_at) : null,
        }),
        ...(duration_minutes !== undefined && {
          durationMinutes: duration_minutes ?? null,
        }),
        ...(notes !== undefined && { notes: notes ?? null }),
      },
    });

    if (items !== undefined) {
      await tx.sadhanaSessionItem.deleteMany({ where: { sessionId: id } });
      for (const item of items) {
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
