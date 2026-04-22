import { type RefObject, useLayoutEffect, useState } from "react";

/**
 * Observe a container and return a scale factor in `(0, 1]` such that
 * a child of width `contentWidth` exactly fits. Use with CSS `zoom`
 * (not `transform`) so the scaled element's layout box shrinks too —
 * otherwise the browser reserves empty space for the pre-scale size.
 *
 * Returns `1` until the first measurement, so the caller can render
 * at natural size on the first paint and shrink in on the next frame
 * without flashing at the wrong size.
 */
export function useFitScale(ref: RefObject<HTMLElement | null>, contentWidth: number): number {
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setScale(Math.min(1, w / contentWidth));
    };
    update();
    const obs = new ResizeObserver(update);
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, contentWidth]);
  return scale;
}
