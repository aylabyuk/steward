import { useEffect, useRef, useState } from "react";

const LOAD_DELAY_MS = 450;

interface Options {
  /** First load — number of weeks rendered immediately. */
  initial: number;
  /** How many additional weeks to pull in each time the sentinel
   *  enters view. */
  step: number;
  /** Hard ceiling. Once `weeks >= max`, the observer disconnects and
   *  scroll won't trigger more loads. */
  max: number;
}

interface Result {
  weeks: number;
  /** True while the load delay is in flight — caller should render a
   *  "Loading…" indicator. Flips back to false once `weeks` updates. */
  loading: boolean;
  /** Attach to a sentinel element rendered just below the bottom of
   *  the list. Once the sentinel scrolls into view (with a 200px
   *  pre-roll), the horizon grows by `step` after a short delay. */
  sentinelRef: React.RefObject<HTMLDivElement | null>;
}

/** Scroll-driven horizon for the mobile schedule. The user has no
 *  HorizonSelect on a phone — the list starts at `initial` weeks and
 *  grows by `step` each time they scroll near the bottom (capped at
 *  `max`). A 450ms delay between intersection and load + a `loading`
 *  flag give the caller a chance to surface "Loading…" feedback so
 *  the growth doesn't feel instantaneous and disorienting. Pass
 *  `enabled: false` (i.e. on desktop) to short-circuit the
 *  IntersectionObserver entirely. */
export function useInfiniteHorizon(enabled: boolean, options: Options): Result {
  const [weeks, setWeeks] = useState(options.initial);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled || weeks >= options.max) return;
    const el = sentinelRef.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        if (timer) return;
        setLoading(true);
        timer = setTimeout(() => {
          setWeeks((w) => Math.min(w + options.step, options.max));
          setLoading(false);
          timer = null;
        }, LOAD_DELAY_MS);
      },
      { rootMargin: "200px" },
    );
    obs.observe(el);
    return () => {
      obs.disconnect();
      if (timer) {
        clearTimeout(timer);
        setLoading(false);
      }
    };
  }, [enabled, weeks, options.step, options.max]);

  return { weeks, loading, sentinelRef };
}
