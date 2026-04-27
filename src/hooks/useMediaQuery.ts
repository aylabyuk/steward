import { useEffect, useState } from "react";

/** Subscribes to a CSS media query and returns its current match
 *  state, re-rendering on every change. SSR-safe — returns `false`
 *  when `window` isn't available, then hydrates on first effect.
 *  Use {@link useIsMobile} for the app-wide phone breakpoint instead
 *  of inlining the same string everywhere. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

/** True when the viewport is narrower than Tailwind's `md` breakpoint
 *  (768px). The WYSIWYG template editors target an 8.5×11 page at
 *  print scale and need at least a tablet's worth of horizontal room
 *  to be usable, so anything below `md` is treated as phone-class
 *  and gated behind a "desktop only" notice. */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 767.98px)");
}
