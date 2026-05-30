import type { Metadata } from "next";
import { DateTime } from "luxon";
import { getPreferences } from "@/services/preference.service";
import { panchangaService } from "@/services/panchanga.service";
import { transformToApiResponse } from "@/lib/api-transformers";
import { DEFAULT_LOCATION } from "@/lib/domain";
import { logError } from "@/lib/utils";
import { SettingsContent } from "@/components/settings/SettingsContent";

export const metadata: Metadata = { title: "Instellingen" };

export default async function SettingsPage() {
  const now = DateTime.now().setZone(DEFAULT_LOCATION.timezone);

  const [preferences, rawPanchanga] = await Promise.allSettled([
    getPreferences(),
    panchangaService.calculateDaily(
      now.toJSDate(),
      DEFAULT_LOCATION,
      DEFAULT_LOCATION.timezone
    ),
  ]);

  const prefs =
    preferences.status === "fulfilled" && preferences.value
      ? {
          currentTheme: preferences.value.currentTheme,
          defaultView: preferences.value.defaultView,
        }
      : null;

  if (preferences.status === "rejected") {
    logError("Failed to load preferences for settings page", preferences.reason);
  }

  const dailyInfo =
    rawPanchanga.status === "fulfilled"
      ? (() => {
          const r = transformToApiResponse(rawPanchanga.value);
          return {
            sunrise: r.sunrise,
            sunset: r.sunset,
            moonPhasePercent: r.moonPhasePercent,
            moonPhaseName: r.moonPhaseName,
            isWaxing: r.isWaxing,
          };
        })()
      : null;

  if (rawPanchanga.status === "rejected") {
    logError("Failed to load panchanga for settings page", rawPanchanga.reason);
  }

  return <SettingsContent initialPreferences={prefs} initialDailyInfo={dailyInfo} />;
}
