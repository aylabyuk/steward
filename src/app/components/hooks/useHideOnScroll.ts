import { useEffect, useState } from "react";

/** Native-app-style auto-hiding sticky header. Returns `true` when a
 *  sticky element should slide off-screen — set when the user scrolls
 *  down past the top guard, cleared when they scroll up or return to
 *  the top. Pass `enabled` from a media query (e.g. `useIsMobile`) so
 *  the desktop layout never triggers a hide. */
export function useHideOnScroll(enabled: boolean): boolean {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setHidden(false);
      return;
    }

    const TOP_GUARD = 64;
    const HIDE_DELTA = 6;
    const SHOW_DELTA = 4;
    let lastY = window.scrollY;
    let frame = 0;

    function update() {
      frame = 0;
      const y = window.scrollY;
      const delta = y - lastY;
      if (y < TOP_GUARD) {
        setHidden(false);
      } else if (delta > HIDE_DELTA) {
        setHidden(true);
      } else if (delta < -SHOW_DELTA) {
        setHidden(false);
      }
      lastY = y;
    }

    function onScroll() {
      if (frame) return;
      frame = requestAnimationFrame(update);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [enabled]);

  return hidden;
}
