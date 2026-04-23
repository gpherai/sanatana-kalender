import { NextRequest, NextResponse } from "next/server";
import { formatSession, utcDate, todayStr } from "@/services/sadhana-formatters";
import * as sadhanaRepo from "@/repositories/sadhana.repository";
import { serverError, validationError } from "@/lib/api-response";
import { logError } from "@/lib/utils";
import { createSadhanaSessionSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const fromStr = params.get("from");
    const toStr = params.get("to");

    const fromDate = fromStr ? utcDate(fromStr) : new Date(0);
    const toDate = toStr ? utcDate(toStr) : utcDate(todayStr());
    const sessions = await sadhanaRepo.findSessionsByDateRange(fromDate, toDate);

    return NextResponse.json(sessions.map(formatSession));
  } catch (error) {
    logError("[SADHANA_SESSIONS_GET]", error);
    return serverError("Kon sessies niet ophalen");
  }
}

export async function POST(req: NextRequest) {
  try {
    const parsed = createSadhanaSessionSchema.safeParse(await req.json());
    if (!parsed.success) return validationError(parsed.error);

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
    logError("[SADHANA_SESSIONS_POST]", error);
    return serverError("Kon sessie niet aanmaken");
  }
}
