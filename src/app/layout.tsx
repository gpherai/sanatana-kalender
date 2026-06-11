import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/ui/Header";
import { ScrollToTop } from "@/components/ui/ScrollToTop";
import { ToastProvider } from "@/components/ui/Toast";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ThemedFooter } from "@/components/ui/ThemedFooter";
import {
  DEFAULT_THEME_NAME,
  DEFAULT_COLOR_MODE,
  THEME_STORAGE_KEY,
  THEME_NAMES,
} from "@/config/themes";
import "leaflet/dist/leaflet.css";
import "./globals.css";

// =============================================================================
// FONTS
// =============================================================================

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// =============================================================================
// METADATA
// =============================================================================

export const metadata: Metadata = {
  title: {
    default: "Dharma Calendar",
    template: "%s | Dharma Calendar",
  },
  description:
    "Hindu Festival & Spiritual Events Calendar - Track festivals, puja, vrat, and more",
  keywords: "hindu, calendar, festival, puja, vrat, tithi, nakshatra",
  openGraph: {
    title: "Dharma Calendar",
    description:
      "Hindu Festival & Spiritual Events Calendar - Track festivals, puja, vrat, and more",
    type: "website",
    locale: "nl_NL",
  },
};

// =============================================================================
// THEME INITIALIZATION SCRIPT
// =============================================================================

/**
 * Inline script to prevent flash of wrong theme/color mode.
 * Runs synchronously before React hydration.
 *
 * Must be kept in sync with ThemeProvider's storage format.
 * @see src/components/theme/ThemeProvider.tsx
 * @see src/config/themes.ts
 */
const themeInitScript = `
(function(){
  var K=${JSON.stringify(THEME_STORAGE_KEY)};
  var V=${JSON.stringify(THEME_NAMES)};
  var D=${JSON.stringify(DEFAULT_THEME_NAME)};
  var M=${JSON.stringify(DEFAULT_COLOR_MODE)};
  var t=D,c=M;
  try{
    var s=localStorage.getItem(K);
    if(s){
      var p=JSON.parse(s);
      if(p.themeName&&V.indexOf(p.themeName)!==-1)t=p.themeName;
      if(p.colorMode==="light"||p.colorMode==="dark"||p.colorMode==="system")c=p.colorMode;
    }
  }catch(e){}
  document.documentElement.setAttribute("data-theme",t);
  var isDark=c==="dark"||(c==="system"&&window.matchMedia("(prefers-color-scheme:dark)").matches);
  if(isDark)document.documentElement.classList.add("dark");
})();
`;

// =============================================================================
// ROOT LAYOUT
// =============================================================================

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="nl"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} font-sans`}
    >
      <head>
        {/* Theme initialization script - runs before paint to prevent flash */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="app-body antialiased">
        <ThemeProvider>
          <ToastProvider>
            <a
              href="#main-content"
              className="focus-visible:ring-theme-primary bg-theme-primary sr-only text-white focus-visible:not-sr-only focus-visible:absolute focus-visible:top-4 focus-visible:left-4 focus-visible:z-50 focus-visible:rounded-lg focus-visible:px-4 focus-visible:py-2 focus-visible:ring-2 focus-visible:outline-none"
            >
              Ga naar inhoud
            </a>
            <ScrollToTop />
            <Header />
            {children}
            <ThemedFooter />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
