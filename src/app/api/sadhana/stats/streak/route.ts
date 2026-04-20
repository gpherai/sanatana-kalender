import { NextResponse } from "next/server";
import { getSadhanaStreak } from "@/services/sadhana.service";

export async function GET() {
  try {
    const streak = await getSadhanaStreak();
    return NextResponse.json(streak);
  } catch (error) {
    console.error("[SADHANA_STREAK_GET]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
