import { NextResponse } from "next/server";
import { getSadhanaOverview } from "@/services/sadhana.service";

export async function GET() {
  try {
    const stats = await getSadhanaOverview();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("[SADHANA_OVERVIEW_GET]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
