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
 * Uses theme utility classes with HYPHEN notation (e.g., bg-theme-primary-15)
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ListTodo, Settings, Plus, BookOpen } from "lucide-react";
import { ColorModeToggle } from "@/components/theme";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/almanac", label: "Almanac", icon: BookOpen },
  { href: "/events", label: "Events", icon: ListTodo },
  { href: "/settings", label: "Instellingen", icon: Settings },
] as const;

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-theme-border bg-theme-surface-overlay backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center justify-between">
          {/* Logo - uses theme color */}
          <Link
            href="/"
            className="group flex items-center gap-2 font-bold transition-colors"
          >
            <span className="text-xl transition-transform group-hover:scale-110">🙏</span>
            <span className="text-theme-primary hidden font-bold sm:inline">
              Dharma Calendar
            </span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
                    isActive
                      ? "bg-theme-primary-15 text-theme-primary shadow-sm"
                      : "text-theme-fg-secondary hover:bg-theme-hover hover:text-theme-fg"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
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
