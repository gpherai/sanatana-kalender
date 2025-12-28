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
import { useRouter } from "next/navigation";
import { Loader2, Check, CloudOff, Cloud } from "lucide-react";
import { logError } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { useTheme } from "@/components/theme";
import { PageLayout } from "@/components/layout";
import { ThemeSection, CalendarSection, LocationSection } from "@/components/settings";
import { PRESET_LOCATIONS, DEFAULT_LOCATION } from "@/lib/constants";

// =============================================================================
// TYPES
// =============================================================================

interface Preferences {
  id: string;
  currentTheme: string;
  defaultView: string;
  weekStartsOn: number;
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
  const isFirstRender = useRef(true);
  const lastSavedData = useRef<string>("");

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
        lastSavedData.current = currentData;
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 2000);
      } catch (error) {
        logError("Auto-save failed", error);
        setStatus("error");
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

  // State
  const [loading, setLoading] = useState(true);
  const [dailyInfo, setDailyInfo] = useState<DailyInfo | null>(null);

  // Form state - initialized with defaults
  const [formData, setFormData] = useState({
    currentTheme: themeName,
    defaultView: "month",
    weekStartsOn: 1,
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

  // ---------------------------------------------------------------------------
  // Refresh Daily Info when location changes
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!locationChanged || saveStatus !== "saved") return;

    async function refreshDailyInfo() {
      try {
        const dailyRes = await fetch("/api/daily-info");
        if (dailyRes.ok) {
          const dailyData: DailyInfo = await dailyRes.json();
          setDailyInfo(dailyData);
        }
      } catch (error) {
        logError("Failed to refresh daily info", error);
      }
      setLocationChanged(false);
    }

    refreshDailyInfo();
  }, [locationChanged, saveStatus]);

  // ---------------------------------------------------------------------------
  // Load Initial Data
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const controller = new AbortController();

    async function loadData() {
      try {
        const [prefsRes, dailyRes] = await Promise.all([
          fetch("/api/preferences", { signal: controller.signal }),
          fetch("/api/daily-info", { signal: controller.signal }),
        ]);

        if (prefsRes.ok) {
          const prefsData: Preferences = await prefsRes.json();
          setFormData({
            currentTheme: prefsData.currentTheme,
            defaultView: prefsData.defaultView,
            weekStartsOn: prefsData.weekStartsOn,
            timezone: prefsData.timezone,
            locationName: prefsData.locationName,
            locationLat: prefsData.locationLat,
            locationLon: prefsData.locationLon,
          });
        }

        if (dailyRes.ok) {
          const dailyData: DailyInfo = await dailyRes.json();
          setDailyInfo(dailyData);
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        logError("Failed to load settings", error);
        showToast("Kon instellingen niet laden", "error");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadData();
    return () => controller.abort();
  }, [showToast]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleThemeChange = useCallback(
    (newThemeName: string) => {
      setFormData((prev) => ({ ...prev, currentTheme: newThemeName }));
      setTheme(newThemeName); // Instant visual update via ThemeProvider
    },
    [setTheme]
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
    []
  );

  const handleLocationChange = useCallback(
    (field: "locationName" | "locationLat" | "locationLon", value: string | number) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (field === "locationLat" || field === "locationLon") {
        setLocationChanged(true);
      }
    },
    []
  );

  const handleCalendarFieldChange = useCallback((field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // ---------------------------------------------------------------------------
  // Render: Save Status Indicator
  // ---------------------------------------------------------------------------
  const renderSaveStatus = () => {
    switch (saveStatus) {
      case "saving":
        return (
          <div className="flex items-center gap-2 text-sm text-theme-fg-muted">
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
          <div className="flex items-center gap-2 text-sm text-theme-fg-subtle">
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
          <h1 className="text-2xl font-bold text-theme-fg">
            Instellingen
          </h1>
          <p className="text-sm text-theme-fg-muted">
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
          weekStartsOn={formData.weekStartsOn}
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
