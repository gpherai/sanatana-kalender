"use client";

import { useEffect } from "react";

/**
 * Locks body scroll while an overlay is open.
 * Restores the previous overflow value on cleanup.
 */
export function useScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [locked]);
}
