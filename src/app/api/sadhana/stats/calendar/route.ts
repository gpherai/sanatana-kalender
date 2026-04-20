import { NextResponse } from "next/server";
import { getSadhanaCalendar } from "@/services/sadhana.service";

export async function GET() {
  try {
    const calendar = await getSadhanaCalendar();
    return NextResponse.json(calendar);
  } catch (error) {
    console.error("[SADHANA_CALENDAR_GET]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
