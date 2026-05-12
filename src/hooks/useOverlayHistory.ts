"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

interface UseOverlayHistoryOptions {
  isOpen: boolean;
  onClose: () => void;
  stateKey: string;
}

export function useOverlayHistory({
  isOpen,
  onClose,
  stateKey,
}: UseOverlayHistoryOptions) {
  const hasHistoryEntryRef = useRef(false);

  // Keep onClose in a ref so the popstate handler always calls the latest version
  // without needing onClose in the effect dependency array (which would break
  // re-registration when the caller re-creates the callback mid-session).
  const onCloseRef = useRef(onClose);
  useLayoutEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!isOpen || hasHistoryEntryRef.current) {
      return;
    }

    window.history.pushState({ overlay: stateKey }, "");
    hasHistoryEntryRef.current = true;

    const handlePopState = () => {
      if (!hasHistoryEntryRef.current) {
        return;
      }

      hasHistoryEntryRef.current = false;
      onCloseRef.current();
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isOpen, stateKey]);

  useEffect(() => {
    if (!isOpen) {
      hasHistoryEntryRef.current = false;
    }
  }, [isOpen]);

  const requestClose = useCallback(
    (afterClose?: () => void) => {
      if (isOpen && hasHistoryEntryRef.current) {
        hasHistoryEntryRef.current = false;
        if (afterClose) {
          // Navigating away: replace overlay entry in-place so no popstate fires.
          // history.back() + router.push() race causes Next.js to abort the push.
          window.history.replaceState(null, "");
        } else {
          window.history.back();
        }
      }

      onCloseRef.current();
      afterClose?.();
    },
    [isOpen]
  );

  return { requestClose };
}
