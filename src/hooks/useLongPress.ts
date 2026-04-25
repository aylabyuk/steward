import { useCallback, useEffect, useRef, useState } from "react";

interface Options {
  /** Milliseconds the user must hold before `onLongPress` fires.
   *  Matches iOS Messages' 500ms default. */
  duration?: number;
  /** Fires once when the press has lasted `duration` ms without a
   *  release or pointer-leave. The pointer event is consumed (no
   *  click follows) so callers can safely open a menu. */
  onLongPress: () => void;
  /** When false, every event is a no-op — lets the caller cheaply
   *  disable the gesture without unmounting the bound element. */
  enabled?: boolean;
}

interface Result {
  /** True from pointerdown until either the timer fires or the
   *  press ends. UI uses this to show a hold-feedback indicator
   *  (scale-down, ring, etc). */
  pressing: boolean;
  /** Spread onto the pressable element. Covers mouse + touch + pen
   *  via the Pointer Events API. */
  bind: {
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerUp: () => void;
    onPointerLeave: () => void;
    onPointerCancel: () => void;
    onContextMenu: (e: React.MouseEvent) => void;
  };
}

/** Pointer-Events-based long-press detector. Returns a `pressing`
 *  flag for live visual feedback and a `bind` object to spread onto
 *  the target element. */
export function useLongPress({ duration = 500, onLongPress, enabled = true }: Options): Result {
  const [pressing, setPressing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedRef = useRef(false);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setPressing(false);
  }, []);

  useEffect(() => () => cancel(), [cancel]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!enabled) return;
      // Right- and middle-click shouldn't start a long-press.
      if (e.pointerType === "mouse" && e.button !== 0) return;
      firedRef.current = false;
      setPressing(true);
      timerRef.current = setTimeout(() => {
        firedRef.current = true;
        timerRef.current = null;
        setPressing(false);
        onLongPress();
      }, duration);
    },
    [duration, enabled, onLongPress],
  );

  const onPointerUp = useCallback(() => cancel(), [cancel]);
  const onPointerLeave = useCallback(() => cancel(), [cancel]);
  const onPointerCancel = useCallback(() => cancel(), [cancel]);
  const onContextMenu = useCallback((e: React.MouseEvent) => {
    // Suppress the default browser context menu only when our own
    // long-press just fired — leaves normal right-click behaviour
    // intact for taps that didn't reach the threshold.
    if (firedRef.current) e.preventDefault();
  }, []);

  return {
    pressing,
    bind: { onPointerDown, onPointerUp, onPointerLeave, onPointerCancel, onContextMenu },
  };
}
