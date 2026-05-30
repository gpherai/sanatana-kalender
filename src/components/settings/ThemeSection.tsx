"use client";

import { Palette, Sun, Moon, Monitor, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Section } from "@/components/ui/Section";
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
// SUB-COMPONENTS
// =============================================================================

function ThemeCard({
  theme,
  isSelected,
  onSelect,
}: {
  theme: ThemeOption;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const isSpecial = theme.category === "special";
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative rounded-xl border-2 p-4 text-left transition-all",
        isSpecial
          ? isSelected
            ? "border-amber-500 bg-gradient-to-br from-amber-500/10 to-orange-500/10 shadow-lg ring-2 ring-amber-500/30"
            : "border-theme-border hover:border-amber-500/50 hover:shadow-md hover:shadow-amber-500/10"
          : cn(
              "theme-interactive theme-focus-ring",
              isSelected
                ? "theme-interactive-selected"
                : "border-theme-border hover:border-theme-border-strong hover:shadow-md"
            )
      )}
    >
      {isSelected && (
        <div
          className={cn(
            "absolute top-2 right-2 rounded-full p-1 text-white",
            isSpecial
              ? "bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg"
              : "bg-theme-primary"
          )}
        >
          <Check className="h-3 w-3" />
        </div>
      )}

      {theme.category === "revamped" && (
        <div className="absolute top-2 left-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-br from-white/20 to-white/5 px-2 py-0.5 text-[10px] font-medium text-white/90 ring-1 ring-white/20 backdrop-blur-sm">
            🎨 Gradient
          </span>
        </div>
      )}

      <div
        className={cn("flex gap-2", theme.category === "revamped" ? "mt-6 mb-3" : "mb-3")}
      >
        {(["primary", "secondary", "accent"] as const).map((color) => (
          <div
            key={color}
            className="h-8 w-8 rounded-full shadow-inner ring-1 ring-black/10"
            style={{ backgroundColor: theme.colors[color] }}
          />
        ))}
      </div>

      <h3 className="text-theme-fg font-medium">{theme.displayName}</h3>
      <p className="text-theme-fg-muted mt-1 text-xs">{theme.description}</p>

      {theme.isDefault && (
        <div className="mt-2">
          <span className="bg-theme-surface-raised text-theme-fg-secondary inline-block rounded-full px-2 py-0.5 text-xs">
            Standaard
          </span>
        </div>
      )}

      {isSpecial && (
        <div className="mt-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-0.5 text-xs font-medium text-white shadow-sm">
            ✨ Speciaal
          </span>
        </div>
      )}
    </button>
  );
}

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
        <label className="text-theme-fg-secondary mb-2 block text-sm font-medium">
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
          <p className="text-theme-fg-muted mt-2 text-xs">
            Huidige systeemvoorkeur: {resolvedColorMode === "dark" ? "Donker" : "Licht"}
          </p>
        )}
      </div>

      {/* Theme Grid */}
      <div className="space-y-8">
        {themes.some((t) => t.category === "classic") && (
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="bg-theme-border h-px flex-1" />
              <h3 className="text-theme-fg-muted text-sm font-semibold tracking-wider uppercase">
                Klassieke thema&apos;s
              </h3>
              <div className="bg-theme-border h-px flex-1" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {themes
                .filter((t) => t.category === "classic")
                .map((theme) => (
                  <ThemeCard
                    key={theme.name}
                    theme={theme}
                    isSelected={themeName === theme.name}
                    onSelect={() => onThemeChange(theme.name)}
                  />
                ))}
            </div>
          </div>
        )}

        {themes.some((t) => t.category === "revamped") && (
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="bg-theme-border h-px flex-1" />
              <h3 className="text-theme-fg-muted flex items-center gap-1.5 text-sm font-semibold tracking-wider uppercase">
                <span className="text-base">✨</span>
                <span>Vernieuwde thema&apos;s</span>
              </h3>
              <div className="bg-theme-border h-px flex-1" />
            </div>
            <p className="text-theme-fg-muted mb-4 text-center text-xs">
              Met subtiele verloopachtergronden
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {themes
                .filter((t) => t.category === "revamped")
                .map((theme) => (
                  <ThemeCard
                    key={theme.name}
                    theme={theme}
                    isSelected={themeName === theme.name}
                    onSelect={() => onThemeChange(theme.name)}
                  />
                ))}
            </div>
          </div>
        )}

        {themes.some((t) => t.category === "special") && (
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
              <h3 className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-sm font-semibold tracking-wider text-transparent uppercase">
                <span className="text-base">✨</span> Speciale thema&apos;s
              </h3>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
            </div>
            <p className="text-theme-fg-muted mb-4 text-center text-xs">
              Premium thema&apos;s met verbeterde visuele effecten
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {themes
                .filter((t) => t.category === "special")
                .map((theme) => (
                  <ThemeCard
                    key={theme.name}
                    theme={theme}
                    isSelected={themeName === theme.name}
                    onSelect={() => onThemeChange(theme.name)}
                  />
                ))}
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}
