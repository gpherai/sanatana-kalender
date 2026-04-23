import { NextResponse } from "next/server";
import { serverError } from "@/lib/api-response";
import { logError } from "@/lib/utils";
import { getSadhanaToday } from "@/services/sadhana.service";

export async function GET() {
  try {
    const todayData = await getSadhanaToday();
    return NextResponse.json(todayData);
  } catch (error) {
    logError("[SADHANA_TODAY_GET]", error);
    return serverError("Kon daggegevens niet ophalen");
  }
}
