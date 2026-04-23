import { NextRequest, NextResponse } from "next/server";
import { serverError } from "@/lib/api-response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ layer: string; z: string; x: string; y: string }> }
) {
  try {
    const { layer, z, x, y } = await params;
    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!apiKey) {
      return serverError("OpenWeather API key missing");
    }

    // Supported layers by free tier: clouds_new, precipitation_new, pressure_new, wind_new, temp_new
    const url = `https://tile.openweathermap.org/map/${layer}/${z}/${x}/${y}.png?appid=${apiKey}`;

    const res = await fetch(url, {
      next: { revalidate: 3600 }, // Cache tiles for an hour
    });

    if (!res.ok) {
      return new NextResponse(null, { status: res.status });
    }

    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control":
          "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch {
    return serverError("Failed to fetch map tile");
  }
}
