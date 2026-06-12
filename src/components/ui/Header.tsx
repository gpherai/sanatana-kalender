"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Home,
  ListTodo,
  Settings,
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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`app-header sticky top-0 z-40 w-full border-b backdrop-blur-md transition-shadow duration-300 ${scrolled ? "shadow-md" : "shadow-none"}`}
    >
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
          <div className="order-3 w-full min-w-0 [scrollbar-width:none] overflow-x-auto [mask-image:linear-gradient(to_right,white_85%,transparent)] sm:order-none sm:w-auto sm:flex-1 sm:[mask-image:none] [&::-webkit-scrollbar]:hidden">
            <nav className="flex min-w-max items-center justify-start gap-1 pb-1 sm:min-w-0 sm:justify-center sm:pb-0">
              {navItems.map(({ href, label, icon: Icon }) => {
                const isActive =
                  href === "/" ? pathname === href : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-3 py-3 text-sm font-medium transition-colors sm:py-1.5",
                      isActive
                        ? "bg-theme-primary/15 text-theme-primary shadow-sm"
                        : "text-theme-fg-secondary hover:bg-theme-hover hover:text-theme-fg"
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    <span className="hidden lg:inline">{label}</span>
                    <span className="sr-only lg:hidden">{label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-2">
            <ColorModeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
