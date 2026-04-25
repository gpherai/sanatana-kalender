import { NextRequest, NextResponse } from "next/server";
import { serverError, validationError } from "@/lib/api-response";
import { logError } from "@/lib/utils";
import { getSadhanaCalendar } from "@/services/sadhana.service";
import { sadhanaCalendarQuerySchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const parsed = sadhanaCalendarQuerySchema.safeParse({
      start: req.nextUrl.searchParams.get("start") ?? undefined,
      end: req.nextUrl.searchParams.get("end") ?? undefined,
    });
    if (!parsed.success) return validationError(parsed.error);

    const calendar = await getSadhanaCalendar(parsed.data);
    return NextResponse.json(calendar);
  } catch (error) {
    logError("[SADHANA_CALENDAR_GET]", error);
    return serverError("Kon kalendergegevens niet ophalen");
  }
}
