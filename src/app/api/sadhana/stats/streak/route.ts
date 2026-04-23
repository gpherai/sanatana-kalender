import { NextResponse } from "next/server";
import { serverError } from "@/lib/api-response";
import { logError } from "@/lib/utils";
import { getSadhanaStreak } from "@/services/sadhana.service";

export async function GET() {
  try {
    const streak = await getSadhanaStreak();
    return NextResponse.json(streak);
  } catch (error) {
    logError("[SADHANA_STREAK_GET]", error);
    return serverError("Kon streakgegevens niet ophalen");
  }
}
