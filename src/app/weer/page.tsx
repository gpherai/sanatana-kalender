import type { Metadata } from "next";
import { WeatherDashboard } from "@/components/weather";

export const metadata: Metadata = { title: "Weer" };

export default function WeerPage() {
  return <WeatherDashboard />;
}
