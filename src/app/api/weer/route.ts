import { NextResponse } from "next/server";
import { errorResponse, serverError } from "@/lib/api-response";
import { getWeatherDashboard, WeatherServiceError } from "@/services/weather.service";

export async function GET() {
  try {
    return NextResponse.json(await getWeatherDashboard());
  } catch (error) {
    if (error instanceof WeatherServiceError) {
      if (error.code === "missing_api_key" || error.code === "invalid_api_key") {
        return errorResponse(error.message, error.status);
      }

      return serverError(error.message);
    }

    return serverError("Kon weerdata niet ophalen");
  }
}
