"use client";

/**
 * Settings Page - Auto-Save
 *
 * Allows user to configure:
 * - Theme (color theme from THEME_CATALOG)
 * - Color mode (light/dark/system)
 * - Calendar preferences (default view, week start)
 * - Location (for sun/moon calculations)
 * - Timezone
 *
 * All changes are automatically saved after a short delay.
 * Theme/colorMode changes are instant via ThemeProvider.
 * Other preferences sync to database.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useFetch } from "@/hooks/useFetch";
import { useRouter } from "next/navigation";
import { Loader2, Check, CloudOff, Cloud } from "lucide-react";
import { logError } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { useTheme } from "@/components/theme/ThemeProvider";
import { PageLayout } from "@/components/layout";
import { ThemeSection, CalendarSection, LocationSection } from "@/components/settings";
import { PRESET_LOCATIONS, DEFAULT_LOCATION } from "@/lib/domain";

// =============================================================================
// TYPES
// =============================================================================

interface Preferences {
  id: string;
  currentTheme: string;
  defaultView: string;
  timezone: string;
  locationName: string;
  locationLat: number;
  locationLon: number;
}

interface DailyInfo {
  sunrise: string | null;
  sunset: string | null;
  moonPhasePercent: number;
  moonPhaseName: string;
  isWaxing: boolean;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

// =============================================================================
// CONSTANTS
// =============================================================================

const AUTO_SAVE_DELAY = 800; // ms

// =============================================================================
// HOOK: useAutoSave
// =============================================================================

function useAutoSave<T>(
  data: T,
  saveFn: (data: T) => Promise<void>,
  delay: number = AUTO_SAVE_DELAY
) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const isFirstRender = useRef(true);
  const lastSavedData = useRef<string>("");

  // Track mounted state to prevent setState after unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    // Skip first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      lastSavedData.current = JSON.stringify(data);
      return;
    }

    // Check if data actually changed
    const currentData = JSON.stringify(data);
    if (currentData === lastSavedData.current) {
      return;
    }

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: immediate feedback before debounced save
    setStatus("saving");

    // Debounced save
    timeoutRef.current = setTimeout(async () => {
      try {
        await saveFn(data);
        if (isMountedRef.current) {
          lastSavedData.current = currentData;
          setStatus("saved");
          setTimeout(() => {
            if (isMountedRef.current) setStatus("idle");
          }, 2000);
        }
      } catch (error) {
        logError("Auto-save failed", error);
        if (isMountedRef.current) setStatus("error");
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, saveFn, delay]);

  return status;
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function SettingsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { themeName, colorMode, setTheme, setColorMode, themes, resolvedColorMode } =
    useTheme();

  // Fetch initial data
  const { loading: prefsLoading } = useFetch<Preferences>("/api/preferences", {
    onSuccess: (data) => {
      const prefs = data as Preferences;
      setFormData({
        currentTheme: prefs.currentTheme,
        defaultView: prefs.defaultView,
        timezone: prefs.timezone,
        locationName: prefs.locationName,
        locationLat: prefs.locationLat,
        locationLon: prefs.locationLon,
      });
      // Sync ThemeProvider with DB value (new browser/device won't have localStorage)
      setTheme(prefs.currentTheme);
    },
    onError: (error) => {
      logError("Failed to load settings", error);
      showToast("Kon instellingen niet laden", "error");
    },
  });
  const {
    data: dailyInfo,
    loading: dailyLoading,
    refetch: refreshDailyInfo,
  } = useFetch<DailyInfo>("/api/daily-info");
  const loading = prefsLoading || dailyLoading;

  // Form state - initialized with defaults
  const [formData, setFormData] = useState({
    currentTheme: themeName,
    defaultView: "month",
    timezone: DEFAULT_LOCATION.timezone,
    locationName: DEFAULT_LOCATION.name,
    locationLat: DEFAULT_LOCATION.lat,
    locationLon: DEFAULT_LOCATION.lon,
  });

  // Track if location changed for daily info refresh
  const [locationChanged, setLocationChanged] = useState(false);

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

  const saveStatus = useAutoSave(formData, savePreferences);

  useEffect(() => {
    if (saveStatus === "error") {
      showToast("Kon instellingen niet opslaan", "error");
    }
  }, [saveStatus, showToast]);

  // Refresh daily info after a location change is saved
  useEffect(() => {
    if (!locationChanged || saveStatus !== "saved") return;
    refreshDailyInfo();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: clear flag after triggering refresh
    setLocationChanged(false);
  }, [locationChanged, saveStatus, refreshDailyInfo]);

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

  const handleLocationPreset = useCallback(
    (preset: (typeof PRESET_LOCATIONS)[number]) => {
      setFormData((prev) => ({
        ...prev,
        locationName: preset.name,
        locationLat: preset.lat,
        locationLon: preset.lon,
      }));
      setLocationChanged(true);
    },
    [setFormData, setLocationChanged]
  );

  const handleLocationChange = useCallback(
    (field: "locationName" | "locationLat" | "locationLon", value: string | number) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (field === "locationLat" || field === "locationLon") {
        setLocationChanged(true);
      }
    },
    [setFormData, setLocationChanged]
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
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <Check className="h-4 w-4" />
            <span>Opgeslagen</span>
          </div>
        );
      case "error":
        return (
          <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
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
          timezone={formData.timezone}
          onFieldChange={handleCalendarFieldChange}
        />

        {/* Location Section */}
        <LocationSection
          locationName={formData.locationName}
          locationLat={formData.locationLat}
          locationLon={formData.locationLon}
          dailyInfo={dailyInfo}
          onLocationPreset={handleLocationPreset}
          onLocationChange={handleLocationChange}
        />
      </div>
    </PageLayout>
  );
}
