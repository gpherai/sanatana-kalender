import { useCallback, useEffect, useRef } from "react";

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
      onClose();
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isOpen, onClose, stateKey]);

  useEffect(() => {
    if (!isOpen) {
      hasHistoryEntryRef.current = false;
    }
  }, [isOpen]);

  const requestClose = useCallback(
    (afterClose?: () => void) => {
      if (isOpen && hasHistoryEntryRef.current) {
        hasHistoryEntryRef.current = false;
        window.history.back();
      }

      onClose();
      afterClose?.();
    },
    [isOpen, onClose]
  );

  return { requestClose };
}
