import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { formatSession, utcDate } from "../_helpers";

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
  const body = await req.json();

  if (!body.date || !Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: "date and items required" }, { status: 422 });
  }

  const session = await prisma.$transaction(async (tx) => {
    const s = await tx.sadhanaSession.create({
      data: {
        date: utcDate(body.date),
        startedAt: body.started_at ? new Date(body.started_at) : null,
        durationMinutes: body.duration_minutes ?? null,
        notes: body.notes ?? null,
      },
    });

    for (const item of body.items) {
      const practice = await tx.sadhanaPractice.findUnique({
        where: { id: item.practice_id },
      });
      if (!practice) {
        throw new Error(`Practice ${item.practice_id} not found`);
      }
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
