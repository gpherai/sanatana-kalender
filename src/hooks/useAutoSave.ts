"use client";

import { useState, useEffect, useRef } from "react";
import { logError } from "@/lib/utils";

type SaveStatus = "idle" | "saving" | "saved" | "error";

const DEFAULT_DELAY = 800;

export function useAutoSave<T>(
  data: T,
  saveFn: (data: T) => Promise<void>,
  delay: number = DEFAULT_DELAY,
  enabled: boolean = true,
  resetKey: number = 0
): SaveStatus {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const isFirstRender = useRef(true);
  const lastSavedData = useRef<string>("");
  const lastResetKey = useRef(resetKey);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const currentData = JSON.stringify(data);

    if (!enabled) {
      isFirstRender.current = false;
      lastSavedData.current = currentData;
      lastResetKey.current = resetKey;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    if (lastResetKey.current !== resetKey) {
      isFirstRender.current = false;
      lastSavedData.current = currentData;
      lastResetKey.current = resetKey;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    if (isFirstRender.current) {
      isFirstRender.current = false;
      lastSavedData.current = currentData;
      return;
    }

    if (currentData === lastSavedData.current) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    setStatus("saving");

    timeoutRef.current = setTimeout(async () => {
      try {
        await saveFn(data);
        if (isMountedRef.current) {
          lastSavedData.current = currentData;
          setStatus("saved");
          setTimeout(() => {
            if (isMountedRef.current) setStatus("idle");
          }, 2000);
        }
      } catch (error) {
        logError("Auto-save failed", error);
        if (isMountedRef.current) setStatus("error");
      }
    }, delay);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [data, saveFn, delay, enabled, resetKey]);

  return status;
}
