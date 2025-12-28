"use client";

import { Palette, Sun, Moon, Monitor, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Section } from "@/components/ui";
import type { ColorMode } from "@/config/themes";
import type { ThemeOption } from "@/config/themes";

// =============================================================================
// TYPES
// =============================================================================

interface ThemeSectionProps {
  themeName: string;
  colorMode: ColorMode;
  themes: readonly ThemeOption[];
  resolvedColorMode: "light" | "dark";
  onThemeChange: (themeName: string) => void;
  onColorModeChange: (mode: ColorMode) => void;
}

const COLOR_MODE_OPTIONS: ReadonlyArray<{
  value: ColorMode;
  label: string;
  icon: typeof Sun;
}> = [
  { value: "light", label: "Licht", icon: Sun },
  { value: "dark", label: "Donker", icon: Moon },
  { value: "system", label: "Systeem", icon: Monitor },
];

// =============================================================================
// COMPONENT
// =============================================================================

export function ThemeSection({
  themeName,
  colorMode,
  themes,
  resolvedColorMode,
  onThemeChange,
  onColorModeChange,
}: ThemeSectionProps) {
  return (
    <Section
      title="Thema"
      description="Kies een kleurenschema en weergavemodus"
      icon={Palette}
      iconColor="primary"
    >

      {/* Color Mode Selection */}
      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-theme-fg-secondary">
          Weergavemodus
        </label>
        <div className="flex flex-wrap gap-2">
          {COLOR_MODE_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = colorMode === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onColorModeChange(option.value)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                  isSelected
                    ? "bg-theme-primary text-white shadow-md"
                    : "bg-theme-surface-raised text-theme-fg-secondary hover:bg-theme-hover"
                )}
              >
                <Icon className="h-4 w-4" />
                {option.label}
              </button>
            );
          })}
        </div>
        {colorMode === "system" && (
          <p className="mt-2 text-xs text-theme-fg-muted">
            Huidige systeemvoorkeur:{" "}
            {resolvedColorMode === "dark" ? "Donker" : "Licht"}
          </p>
        )}
      </div>

      {/* Theme Grid - CATEGORIZED */}
      <div className="space-y-8">
        {/* Classic Themes Section */}
        {(() => {
          const classicThemes = themes.filter(t => t.category === "classic");
          if (classicThemes.length === 0) return null;

          return (
            <div>
              <div className="mb-4 flex items-center gap-2">
                <div className="h-px flex-1 bg-theme-border"></div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-theme-fg-muted">
                  Classic Themes
                </h3>
                <div className="h-px flex-1 bg-theme-border"></div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {classicThemes.map((theme) => {
                  const isSelected = themeName === theme.name;
                  return (
                    <button
                      key={theme.name}
                      type="button"
                      onClick={() => onThemeChange(theme.name)}
                      className={cn(
                        "relative rounded-xl border-2 p-4 text-left transition-all",
                        isSelected
                          ? "border-theme-primary bg-theme-primary-10 shadow-lg"
                          : "border-theme-border hover:border-theme-border-strong hover:shadow-md"
                      )}
                    >
                      {isSelected && (
                        <div className="bg-theme-primary absolute top-2 right-2 rounded-full p-1 text-white">
                          <Check className="h-3 w-3" />
                        </div>
                      )}

                      {/* Color preview circles */}
                      <div className="mb-3 flex gap-2">
                        <div className="h-8 w-8 rounded-full shadow-inner ring-1 ring-black/10"
                          style={{ backgroundColor: theme.colors.primary }} />
                        <div className="h-8 w-8 rounded-full shadow-inner ring-1 ring-black/10"
                          style={{ backgroundColor: theme.colors.secondary }} />
                        <div className="h-8 w-8 rounded-full shadow-inner ring-1 ring-black/10"
                          style={{ backgroundColor: theme.colors.accent }} />
                      </div>

                      <h3 className="font-medium text-theme-fg">{theme.displayName}</h3>
                      <p className="mt-1 text-xs text-theme-fg-muted">{theme.description}</p>

                      {theme.isDefault && (
                        <div className="mt-2">
                          <span className="inline-block rounded-full bg-theme-surface-raised px-2 py-0.5 text-xs text-theme-fg-secondary">
                            Standaard
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Revamped Themes Section */}
        {(() => {
          const revampedThemes = themes.filter(t => t.category === "revamped");
          if (revampedThemes.length === 0) return null;

          return (
            <div>
              <div className="mb-4 flex items-center gap-2">
                <div className="h-px flex-1 bg-theme-border"></div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-theme-fg-muted flex items-center gap-1.5">
                  <span className="text-base">✨</span> Revamped Themes
                </h3>
                <div className="h-px flex-1 bg-theme-border"></div>
              </div>
              <p className="mb-4 text-center text-xs text-theme-fg-muted">
                Enhanced with subtle gradient backgrounds
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {revampedThemes.map((theme) => {
                  const isSelected = themeName === theme.name;
                  return (
                    <button
                      key={theme.name}
                      type="button"
                      onClick={() => onThemeChange(theme.name)}
                      className={cn(
                        "relative rounded-xl border-2 p-4 text-left transition-all",
                        isSelected
                          ? "border-theme-primary bg-theme-primary-10 shadow-lg ring-2 ring-theme-primary/20"
                          : "border-theme-border hover:border-theme-border-strong hover:shadow-md"
                      )}
                    >
                      {isSelected && (
                        <div className="bg-theme-primary absolute top-2 right-2 rounded-full p-1 text-white">
                          <Check className="h-3 w-3" />
                        </div>
                      )}

                      {/* Gradient preview badge */}
                      <div className="absolute top-2 left-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-br from-white/20 to-white/5 px-2 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm ring-1 ring-white/20">
                          🎨 Gradient
                        </span>
                      </div>

                      {/* Color preview circles */}
                      <div className="mb-3 mt-6 flex gap-2">
                        <div className="h-8 w-8 rounded-full shadow-inner ring-1 ring-black/10"
                          style={{ backgroundColor: theme.colors.primary }} />
                        <div className="h-8 w-8 rounded-full shadow-inner ring-1 ring-black/10"
                          style={{ backgroundColor: theme.colors.secondary }} />
                        <div className="h-8 w-8 rounded-full shadow-inner ring-1 ring-black/10"
                          style={{ backgroundColor: theme.colors.accent }} />
                      </div>

                      <h3 className="font-medium text-theme-fg">{theme.displayName}</h3>
                      <p className="mt-1 text-xs text-theme-fg-muted">{theme.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Special Themes Section */}
        {(() => {
          const specialThemes = themes.filter(t => t.category === "special");
          if (specialThemes.length === 0) return null;

          return (
            <div>
              <div className="mb-4 flex items-center gap-2">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent"></div>
                <h3 className="text-sm font-semibold uppercase tracking-wider bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent flex items-center gap-1.5">
                  <span className="text-base">✨</span> Special Themes
                </h3>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent"></div>
              </div>
              <p className="mb-4 text-center text-xs text-theme-fg-muted">
                Premium themes with enhanced visual effects
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {specialThemes.map((theme) => {
                  const isSelected = themeName === theme.name;
                  return (
                    <button
                      key={theme.name}
                      type="button"
                      onClick={() => onThemeChange(theme.name)}
                      className={cn(
                        "relative rounded-xl border-2 p-4 text-left transition-all",
                        isSelected
                          ? "border-amber-500 bg-gradient-to-br from-amber-500/10 to-orange-500/10 shadow-lg ring-2 ring-amber-500/30"
                          : "border-theme-border hover:border-amber-500/50 hover:shadow-md hover:shadow-amber-500/10"
                      )}
                    >
                      {isSelected && (
                        <div className="bg-gradient-to-r from-amber-500 to-orange-500 absolute top-2 right-2 rounded-full p-1 text-white shadow-lg">
                          <Check className="h-3 w-3" />
                        </div>
                      )}

                      {/* Color preview circles */}
                      <div className="mb-3 flex gap-2">
                        <div className="h-8 w-8 rounded-full shadow-inner ring-1 ring-black/10"
                          style={{ backgroundColor: theme.colors.primary }} />
                        <div className="h-8 w-8 rounded-full shadow-inner ring-1 ring-black/10"
                          style={{ backgroundColor: theme.colors.secondary }} />
                        <div className="h-8 w-8 rounded-full shadow-inner ring-1 ring-black/10"
                          style={{ backgroundColor: theme.colors.accent }} />
                      </div>

                      <h3 className="font-medium text-theme-fg">{theme.displayName}</h3>
                      <p className="mt-1 text-xs text-theme-fg-muted">{theme.description}</p>

                      <div className="mt-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-0.5 text-xs font-medium text-white shadow-sm">
                          ✨ Special
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>
    </Section>
  );
}
