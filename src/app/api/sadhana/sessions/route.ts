import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { formatSession, todayStr, utcDate } from "../_helpers";
import * as sadhanaRepo from "@/repositories/sadhana.repository";

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

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const fromStr = params.get("from");
    const toStr = params.get("to");

    let sessions;
    if (fromStr || toStr) {
      const fromDate = fromStr ? utcDate(fromStr) : new Date(0);
      const toDate = toStr ? utcDate(toStr) : utcDate(todayStr());
      sessions = await sadhanaRepo.findSessionsByDateRange(fromDate, toDate);
    } else {
      sessions = await sadhanaRepo.findSessionsByDateRange(
        new Date(0),
        utcDate(todayStr())
      );
    }

    return NextResponse.json(sessions.map(formatSession));
  } catch (error) {
    console.error("[SADHANA_SESSIONS_GET]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const parsed = createSessionSchema.safeParse(await req.json());
    if (!parsed.success)
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const { date, started_at, duration_minutes, notes, items } = parsed.data;

    const session = await sadhanaRepo.createSessionWithItems(
      date,
      started_at,
      duration_minutes,
      notes,
      items
    );

    return NextResponse.json(formatSession(session), { status: 201 });
  } catch (error) {
    console.error("[SADHANA_SESSIONS_POST]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
