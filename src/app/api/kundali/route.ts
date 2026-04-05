import { NextRequest, NextResponse } from "next/server";
import { BirthChartService } from "@/server/panchanga/services/birth-chart-service";
import type { BirthData } from "@/server/panchanga/types";

const service = new BirthChartService();

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ongeldig JSON" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;

  // Basic validation
  if (
    typeof b.date !== "string" ||
    typeof b.time !== "string" ||
    typeof b.lat !== "number" ||
    typeof b.lon !== "number" ||
    typeof b.tz !== "string"
  ) {
    return NextResponse.json(
      { error: "Verplichte velden: date (YYYY-MM-DD), time (HH:mm), lat, lon, tz" },
      { status: 400 }
    );
  }

  const birthData: BirthData = {
    date: b.date,
    time: b.time,
    lat: b.lat,
    lon: b.lon,
    tz: b.tz,
    altitude: typeof b.altitude === "number" ? b.altitude : 0,
  };

  try {
    const chart = await service.compute(birthData);
    return NextResponse.json(chart);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Onbekende fout";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
