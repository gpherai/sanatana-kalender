import { NextResponse } from "next/server";
import { serverError } from "@/lib/api-response";
import { logError } from "@/lib/utils";
import { getSadhanaOverview } from "@/services/sadhana.service";

export async function GET() {
  try {
    const stats = await getSadhanaOverview();
    return NextResponse.json(stats);
  } catch (error) {
    logError("[SADHANA_OVERVIEW_GET]", error);
    return serverError("Kon overzichtsgegevens niet ophalen");
  }
}
