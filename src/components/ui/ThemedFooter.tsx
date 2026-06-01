"use client";

import { useTheme } from "@/components/theme/ThemeProvider";

const THEME_MANTRAS: Record<string, string> = {
  "shri-ganesha": "ॐ गं गणपतये नमः",
  "bhairava-nocturne": "ॐ भैरवाय नमः",
  "narasimha-jwala": "ॐ नृसिंहाय नमः",
  "spiritual-minimal-revamped": "ॐ नमो नारायणाय",
  "traditional-rich-revamped": "ॐ नमो भगवते वासुदेवाय",
  "cosmic-purple-revamped": "ॐ नमः शिवाय",
  "forest-green-revamped": "ॐ तत्सत्",
  "sunrise-orange-revamped": "ॐ सूर्याय नमः",
};

const DEFAULT_MANTRA = "ॐ नमो नारायणाय";

export function ThemedFooter() {
  const { themeName } = useTheme();
  const mantra = THEME_MANTRAS[themeName] ?? DEFAULT_MANTRA;

  return (
    <footer className="border-theme-border border-t py-6 text-center">
      <p className="text-theme-fg-muted text-sm">
        <span aria-hidden="true" className="font-serif">
          ॐ
        </span>{" "}
        Dharma Calendar &mdash; <span className="font-serif">{mantra}</span>
      </p>
    </footer>
  );
}
