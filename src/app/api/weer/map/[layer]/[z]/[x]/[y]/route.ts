import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/api-response";
import { logError } from "@/lib/utils";
import { env } from "@/lib/env";

const VALID_LAYERS = new Set([
  "clouds_new",
  "precipitation_new",
  "pressure_new",
  "wind_new",
  "temp_new",
]);
const TILE_COORD_RE = /^\d{1,6}$/;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ layer: string; z: string; x: string; y: string }> }
) {
  try {
    const { layer, z, x, y } = await params;

    if (
      !VALID_LAYERS.has(layer) ||
      !TILE_COORD_RE.test(z) ||
      !TILE_COORD_RE.test(x) ||
      !TILE_COORD_RE.test(y)
    ) {
      return errorResponse("Ongeldige tegel parameters", 400);
    }

    const apiKey = env.OPENWEATHER_API_KEY;

    if (!apiKey) {
      return errorResponse("OpenWeather API key niet geconfigureerd", 503);
    }

    const url = `https://tile.openweathermap.org/map/${layer}/${z}/${x}/${y}.png?appid=${apiKey}`;

    const res = await fetch(url, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(10_000),
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
  } catch (error) {
    logError("[WEER_MAP_TILE]", error);
    return errorResponse("Kon tegel niet ophalen", 503);
  }
}
