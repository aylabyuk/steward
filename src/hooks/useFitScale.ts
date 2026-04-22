import { type RefObject, useLayoutEffect, useState } from "react";

/**
 * Observe a container and return a scale factor in `(0, 1]` such that
 * a child of `contentWidth × contentHeight` exactly fits inside (no
 * scrollbars needed). When `contentHeight` is omitted, only width is
 * constrained. Use with CSS `zoom` (not `transform`) so the scaled
 * element's layout box shrinks too — otherwise the browser reserves
 * empty space for the pre-scale size.
 *
 * Returns `1` until the first measurement, so the caller can render
 * at natural size on the first paint and shrink in on the next frame
 * without flashing at the wrong size.
 */
export function useFitScale(
  ref: RefObject<HTMLElement | null>,
  contentWidth: number,
  contentHeight?: number,
): number {
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w <= 0) return;
      const widthScale = w / contentWidth;
      const heightScale = contentHeight && contentHeight > 0 ? h / contentHeight : Infinity;
      setScale(Math.min(1, widthScale, heightScale));
    };
    update();
    const obs = new ResizeObserver(update);
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, contentWidth, contentHeight]);
  return scale;
}
