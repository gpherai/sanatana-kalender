"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Scrolls the window to the top on every client-side route change.
 * Next.js App Router does not reliably restore scroll position to 0
 * when navigating between pages that share the same root layout.
 */
export function ScrollToTop() {
  const pathname = usePathname();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
