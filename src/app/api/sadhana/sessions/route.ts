import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { formatSession, utcDate } from "../_helpers";

const sessionItemSchema = z.object({
  practice_id: z.string().min(1),
  quantity: z.number().int().positive(),
  unit: z.enum(["malas", "count"]).optional(),
  duration_minutes: z.number().int().positive().nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

const createSessionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  started_at: z.string().nullable().optional(),
  duration_minutes: z.number().int().positive().nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
  items: z.array(sessionItemSchema).min(1),
});

const INCLUDE_ITEMS = {
  items: {
    include: { practice: true },
    orderBy: { createdAt: "asc" as const },
  },
} as const;

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const fromStr = params.get("from");
  const toStr = params.get("to");

  const sessions = await prisma.sadhanaSession.findMany({
    where: {
      ...(fromStr ? { date: { gte: utcDate(fromStr) } } : {}),
      ...(toStr ? { date: { lte: utcDate(toStr) } } : {}),
    },
    include: INCLUDE_ITEMS,
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(sessions.map(formatSession));
}

export async function POST(req: NextRequest) {
  const parsed = createSessionSchema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { date, started_at, duration_minutes, notes, items } = parsed.data;

  const session = await prisma.$transaction(async (tx) => {
    const s = await tx.sadhanaSession.create({
      data: {
        date: utcDate(date),
        startedAt: started_at ? new Date(started_at) : null,
        durationMinutes: duration_minutes ?? null,
        notes: notes ?? null,
      },
    });

    for (const item of items) {
      const practice = await tx.sadhanaPractice.findUnique({
        where: { id: item.practice_id },
      });
      if (!practice) throw new Error(`Practice ${item.practice_id} not found`);
      await tx.sadhanaSessionItem.create({
        data: {
          sessionId: s.id,
          practiceId: item.practice_id,
          quantity: item.quantity,
          unit: item.unit ?? "malas",
          durationMinutes: item.duration_minutes ?? null,
          notes: item.notes ?? null,
        },
      });
    }

    return tx.sadhanaSession.findUniqueOrThrow({
      where: { id: s.id },
      include: INCLUDE_ITEMS,
    });
  });

  return NextResponse.json(formatSession(session), { status: 201 });
}
