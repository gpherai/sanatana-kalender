import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header, ToastProvider } from "@/components/ui";
import { ThemeProvider } from "@/components/theme";
import {
  DEFAULT_THEME_NAME,
  DEFAULT_COLOR_MODE,
  THEME_STORAGE_KEY,
  THEME_NAMES,
} from "@/config/themes";
import "./globals.css";

// =============================================================================
// FONTS
// =============================================================================

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// =============================================================================
// METADATA
// =============================================================================

export const metadata: Metadata = {
  title: "Dharma Calendar",
  description:
    "Hindu Festival & Spiritual Events Calendar - Track festivals, puja, vrat, and more",
  keywords: ["hindu", "calendar", "festival", "puja", "vrat", "tithi", "nakshatra"],
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
    <html lang="nl" suppressHydrationWarning>
      <head>
        {/* Theme initialization script - runs before paint to prevent flash */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
          <ToastProvider>
            <Header />
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
