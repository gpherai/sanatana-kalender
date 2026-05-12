"use client";

/**
 * Settings Page - Auto-Save
 *
 * Allows user to configure:
 * - Theme (color theme from THEME_CATALOG)
 * - Color mode (light/dark/system)
 * - Calendar preferences (default view)
 *
 * All changes are automatically saved after a short delay.
 * Theme/colorMode changes are instant via ThemeProvider.
 * DEFAULT_LOCATION is fixed in code for panchanga/weather/event calculations.
 */

import { useState, useEffect, useCallback } from "react";
import { useFetch } from "@/hooks/useFetch";
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

// =============================================================================
// TYPES
// =============================================================================

interface Preferences {
  id: string;
  currentTheme: string;
  defaultView: string;
}

type DailyInfo = Pick<
  DailyInfoResponse,
  "sunrise" | "sunset" | "moonPhasePercent" | "moonPhaseName" | "isWaxing"
>;

// =============================================================================
// CONSTANTS
// =============================================================================

const AUTO_SAVE_DELAY = 800; // ms

// =============================================================================
// COMPONENT
// =============================================================================

export default function SettingsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { themeName, colorMode, setTheme, setColorMode, themes, resolvedColorMode } =
    useTheme();
  const [autoSaveResetKey, setAutoSaveResetKey] = useState(0);

  // Fetch initial data
  const { loading: prefsLoading } = useFetch<Preferences>("/api/preferences", {
    onSuccess: (data) => {
      const prefs = data as Preferences;
      setFormData({
        currentTheme: prefs.currentTheme,
        defaultView: prefs.defaultView,
      });
      setAutoSaveResetKey((key) => key + 1);
      // Sync from DB only when this browser has no stored preference yet (new device/cleared storage)
      if (!localStorage.getItem(THEME_STORAGE_KEY)) {
        setTheme(prefs.currentTheme);
      }
    },
    onError: (error) => {
      setAutoSaveResetKey((key) => key + 1);
      logError("Failed to load settings", error);
      showToast("Kon instellingen niet laden", "error");
    },
  });
  const { data: dailyInfo, loading: dailyLoading } =
    useFetch<DailyInfo>("/api/daily-info");
  const loading = prefsLoading || dailyLoading;

  // Form state - initialized with defaults
  const [formData, setFormData] = useState({
    currentTheme: themeName,
    defaultView: "month",
  });

  // Sync form theme with context theme
  useEffect(() => {
    setFormData((prev) => ({ ...prev, currentTheme: themeName }));
  }, [themeName]);

  // ---------------------------------------------------------------------------
  // Auto-Save Function (database preferences only)
  // ---------------------------------------------------------------------------
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

  const saveStatus = useAutoSave(
    formData,
    savePreferences,
    AUTO_SAVE_DELAY,
    !prefsLoading,
    autoSaveResetKey
  );

  useEffect(() => {
    if (saveStatus === "error") {
      showToast("Kon instellingen niet opslaan", "error");
    }
  }, [saveStatus, showToast]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleThemeChange = useCallback(
    (newThemeName: string) => {
      setFormData((prev) => ({ ...prev, currentTheme: newThemeName }));
      setTheme(newThemeName); // Instant visual update via ThemeProvider
    },
    [setTheme, setFormData]
  );

  const handleCalendarFieldChange = useCallback(
    (field: string, value: string | number) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [setFormData]
  );

  // ---------------------------------------------------------------------------
  // Render: Save Status Indicator
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <PageLayout width="medium" loading={loading} loadingMessage="Instellingen laden...">
      {/* Page Header */}
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
        {/* Theme Section */}
        <ThemeSection
          themeName={themeName}
          colorMode={colorMode}
          themes={themes}
          resolvedColorMode={resolvedColorMode}
          onThemeChange={handleThemeChange}
          onColorModeChange={setColorMode}
        />

        {/* Calendar Section */}
        <CalendarSection
          defaultView={formData.defaultView}
          timezone={DEFAULT_LOCATION.timezone}
          onFieldChange={handleCalendarFieldChange}
        />

        {/* Location Section */}
        <LocationSection
          locationName={DEFAULT_LOCATION.name}
          locationLat={DEFAULT_LOCATION.lat}
          locationLon={DEFAULT_LOCATION.lon}
          dailyInfo={dailyInfo}
        />
      </div>
    </PageLayout>
  );
}
