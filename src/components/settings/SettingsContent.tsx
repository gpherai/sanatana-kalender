"use client";

import { useState, useEffect, useCallback } from "react";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useRouter } from "next/navigation";
import { Loader2, Check, CloudOff, Cloud } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { useTheme } from "@/components/theme/ThemeProvider";
import { THEME_STORAGE_KEY } from "@/config/themes";
import { PageLayout } from "@/components/layout";
import { ThemeSection, CalendarSection, LocationSection } from "@/components/settings";
import { DEFAULT_LOCATION } from "@/lib/domain";
import { logError } from "@/lib/utils";
import type { DailyInfoResponse } from "@/types";

type DailyInfo = Pick<
  DailyInfoResponse,
  "sunrise" | "sunset" | "moonPhasePercent" | "moonPhaseName" | "isWaxing"
>;

interface Preferences {
  currentTheme: string;
  defaultView: string;
}

interface SettingsContentProps {
  initialPreferences: Preferences | null;
  initialDailyInfo: DailyInfo | null;
}

const AUTO_SAVE_DELAY = 800;

export function SettingsContent({
  initialPreferences,
  initialDailyInfo,
}: SettingsContentProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const { themeName, colorMode, setTheme, setColorMode, themes, resolvedColorMode } =
    useTheme();

  // Initialize directly from server-fetched props — no loading state needed
  const [formData, setFormData] = useState({
    currentTheme: initialPreferences?.currentTheme ?? themeName,
    defaultView: initialPreferences?.defaultView ?? "month",
  });

  // Sync theme from DB on mount (only when browser has no stored preference yet)
  useEffect(() => {
    if (initialPreferences) {
      if (!localStorage.getItem(THEME_STORAGE_KEY)) {
        setTheme(initialPreferences.currentTheme);
      }
    } else {
      logError("Failed to load settings", new Error("No preferences returned"));
      showToast("Kon instellingen niet laden", "error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const savePreferences = useCallback(
    async (data: typeof formData) => {
      const response = await fetch("/api/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to save preferences");
      }

      router.refresh();
    },
    [router]
  );

  const saveStatus = useAutoSave(formData, savePreferences, AUTO_SAVE_DELAY, true);

  useEffect(() => {
    if (saveStatus === "error") {
      showToast("Kon instellingen niet opslaan", "error");
    }
  }, [saveStatus, showToast]);

  const handleThemeChange = useCallback(
    (newThemeName: string) => {
      setFormData((prev) => ({ ...prev, currentTheme: newThemeName }));
      setTheme(newThemeName);
    },
    [setTheme]
  );

  const handleCalendarFieldChange = useCallback(
    (field: string, value: string | number) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const renderSaveStatus = () => {
    switch (saveStatus) {
      case "saving":
        return (
          <div className="text-theme-fg-muted flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Opslaan...</span>
          </div>
        );
      case "saved":
        return (
          <div className="text-theme-success-fg flex items-center gap-2 text-sm">
            <Check className="h-4 w-4" />
            <span>Opgeslagen</span>
          </div>
        );
      case "error":
        return (
          <div className="text-theme-error-fg flex items-center gap-2 text-sm">
            <CloudOff className="h-4 w-4" />
            <span>Fout bij opslaan</span>
          </div>
        );
      default:
        return (
          <div className="text-theme-fg-subtle flex items-center gap-2 text-sm">
            <Cloud className="h-4 w-4" />
            <span>Auto-save actief</span>
          </div>
        );
    }
  };

  return (
    <PageLayout width="medium">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-theme-fg text-2xl font-bold">Instellingen</h1>
          <p className="text-theme-fg-muted text-sm">
            Wijzigingen worden automatisch opgeslagen
          </p>
        </div>
        {renderSaveStatus()}
      </div>

      <div className="space-y-8">
        <ThemeSection
          themeName={themeName}
          colorMode={colorMode}
          themes={themes}
          resolvedColorMode={resolvedColorMode}
          onThemeChange={handleThemeChange}
          onColorModeChange={setColorMode}
        />

        <CalendarSection
          defaultView={formData.defaultView}
          timezone={DEFAULT_LOCATION.timezone}
          onFieldChange={handleCalendarFieldChange}
        />

        <LocationSection
          locationName={DEFAULT_LOCATION.name}
          locationLat={DEFAULT_LOCATION.lat}
          locationLon={DEFAULT_LOCATION.lon}
          dailyInfo={initialDailyInfo}
        />
      </div>
    </PageLayout>
  );
}
