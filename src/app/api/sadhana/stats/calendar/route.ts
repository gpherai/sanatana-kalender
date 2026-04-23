import { NextResponse } from "next/server";
import { serverError } from "@/lib/api-response";
import { logError } from "@/lib/utils";
import { getSadhanaCalendar } from "@/services/sadhana.service";

export async function GET() {
  try {
    const calendar = await getSadhanaCalendar();
    return NextResponse.json(calendar);
  } catch (error) {
    logError("[SADHANA_CALENDAR_GET]", error);
    return serverError("Kon kalendergegevens niet ophalen");
  }
}
