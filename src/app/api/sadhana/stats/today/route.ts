import { NextResponse } from "next/server";
import { getSadhanaToday } from "@/services/sadhana.service";

export async function GET() {
  try {
    const todayData = await getSadhanaToday();
    return NextResponse.json(todayData);
  } catch (error) {
    console.error("[SADHANA_TODAY_GET]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
