import { NextRequest, NextResponse } from "next/server";
import { errorResponse, serverError, validationError } from "@/lib/api-response";
import { getWeatherDashboard, WeatherServiceError } from "@/services/weather.service";
import { weerQuerySchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = weerQuerySchema.safeParse({
      lat: searchParams.get("lat") ?? undefined,
      lon: searchParams.get("lon") ?? undefined,
      name: searchParams.get("name") ?? undefined,
    });
    if (!parsed.success) return validationError(parsed.error);

    const { lat, lon, name } = parsed.data;
    return NextResponse.json(await getWeatherDashboard(lat, lon, name));
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
