import { useEffect } from "react";

/** Pins a fixed, bottom-anchored element (a chat drawer) to the
 *  visual viewport so the OS keyboard slides up *under* it instead of
 *  pushing it out of frame. iOS Safari is the offender:
 *
 *  - `position: fixed` is anchored to the *layout* viewport, which
 *    doesn't shrink when the soft keyboard appears.
 *  - iOS auto-scrolls the page to bring focused inputs into the
 *    *visual* viewport, dragging fixed elements with it.
 *  - `dvh` doesn't track the keyboard reliably across browsers, and
 *    vaul's built-in keyboard handler depends on layout/visual
 *    viewport drift that several iOS configurations don't expose.
 *
 *  This hook reads `visualViewport` directly on every `resize` /
 *  `scroll` and writes inline `bottom` + `height` to the ref'd
 *  element, so the drawer's bottom edge stays at the bottom of the
 *  visible area and its height clamps to the available space minus a
 *  caller-controlled top inset (the "peek" of the page behind it).
 *
 *  No-op on non-mobile (≥ md) and when `enabled` is false. When
 *  disabled or unmounted, the inline styles are cleared so Tailwind's
 *  classes take over again. */
export function useKeyboardAwareViewport(
  ref: React.RefObject<HTMLElement | null>,
  enabled: boolean,
  options: { topInset?: number } = {},
): void {
  const { topInset = 96 } = options;
  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return;
    const vv = window.visualViewport;
    if (!vv) return;

    function apply() {
      if (!el || !vv) return;
      const layoutHeight = window.innerHeight;
      const visibleBottomFromLayoutBottom = layoutHeight - (vv.offsetTop + vv.height);
      el.style.bottom = `${Math.max(visibleBottomFromLayoutBottom, 0)}px`;
      el.style.height = `${Math.max(vv.height - topInset, 0)}px`;
    }

    apply();
    vv.addEventListener("resize", apply);
    vv.addEventListener("scroll", apply);
    return () => {
      vv.removeEventListener("resize", apply);
      vv.removeEventListener("scroll", apply);
      if (el) {
        el.style.bottom = "";
        el.style.height = "";
      }
    };
  }, [ref, enabled, topInset]);
}
