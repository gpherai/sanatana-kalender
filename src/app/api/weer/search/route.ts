import { NextRequest, NextResponse } from "next/server";
import { errorResponse, serverError } from "@/lib/api-response";
import { searchLocation, WeatherServiceError } from "@/services/weather.service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");

    if (!q || q.length < 2) {
      return NextResponse.json([]);
    }

    return NextResponse.json(await searchLocation(q));
  } catch (error) {
    if (error instanceof WeatherServiceError) {
      if (error.code === "missing_api_key" || error.code === "invalid_api_key") {
        return errorResponse(error.message, error.status);
      }
      return serverError(error.message);
    }
    return serverError("Kon locatie niet zoeken");
  }
}
