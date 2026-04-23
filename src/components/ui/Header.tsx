"use client";

/**
 * Header Component
 *
 * Main navigation header with:
 * - Logo linking to home
 * - Navigation links
 * - New event button
 * - Color mode toggle
 *
 * Uses native Tailwind v4 theme utilities and app-level theme hooks.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  ListTodo,
  Settings,
  Plus,
  BookOpen,
  BookMarked,
  CloudSun,
  Star,
  Sparkles,
} from "lucide-react";
import { ColorModeToggle } from "@/components/theme/ColorModeToggle";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/almanac", label: "Almanac", icon: BookOpen },
  { href: "/events", label: "Events", icon: ListTodo },
  { href: "/kundali", label: "Kundali", icon: Star },
  { href: "/weer", label: "Weer", icon: CloudSun },
  { href: "/sadhana", label: "Sadhana", icon: Sparkles },
  { href: "/encyclopedie", label: "Encyclopedie", icon: BookMarked },
  { href: "/settings", label: "Instellingen", icon: Settings },
] as const;

export function Header() {
  const pathname = usePathname();

  return (
    <header className="app-header sticky top-0 z-40 w-full border-b backdrop-blur-sm">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex min-h-14 flex-wrap items-center justify-between gap-y-2 py-2 sm:h-14 sm:flex-nowrap sm:py-0">
          {/* Logo - uses theme color */}
          <Link
            href="/"
            className="group flex shrink-0 items-center gap-2 font-bold transition-colors"
          >
            <span className="app-brand-mark text-xl transition-transform group-hover:scale-110">
              🙏
            </span>
            <span className="app-brand-label text-theme-primary hidden font-bold sm:inline">
              Dharma Calendar
            </span>
          </Link>

          {/* Navigation */}
          <div className="order-3 w-full min-w-0 overflow-x-auto [scrollbar-width:none] sm:order-none sm:w-auto sm:flex-1 [&::-webkit-scrollbar]:hidden">
            <nav className="flex min-w-max items-center justify-start gap-1 pb-1 sm:min-w-0 sm:justify-center sm:pb-0">
              {navItems.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
                      isActive
                        ? "bg-theme-primary-15 text-theme-primary shadow-sm"
                        : "text-theme-fg-secondary hover:bg-theme-hover hover:text-theme-fg"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden lg:inline">{label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-2">
            {/* New Event Button - uses theme color */}
            <Link
              href="/events/new"
              className="bg-theme-primary flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-white shadow-lg transition-all hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nieuw</span>
            </Link>

            {/* Color Mode Toggle */}
            <ColorModeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
