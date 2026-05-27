import type { Metadata } from "next";
import { WeatherDashboard } from "@/components/weather";
import { logError } from "@/lib/utils";
import { getWeatherDashboard } from "@/services/weather.service";
import type { WeatherApiResponse } from "@/types/weather";

export const metadata: Metadata = { title: "Weer" };

export default async function WeerPage() {
  let initialData: WeatherApiResponse | null = null;
  try {
    initialData = await getWeatherDashboard();
  } catch (error) {
    logError("[WeerPage] SSR weather fetch failed, falling back to CSR", error);
  }
  return <WeatherDashboard initialData={initialData} />;
}
